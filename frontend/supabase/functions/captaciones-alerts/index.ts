import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabaseAdmin = createClient(
  SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY ?? ''
)

const ADMIN_EMAIL = 'info@gelaberthomes.es'

/**
 * Returns today's date in 'YYYY-MM-DD' (Spain timezone UTC+2)
 */
const getTodayStr = (): string => {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
}

/**
 * Returns a date string offset by N days from today (Spain tz)
 */
const getDatePlusDays = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
}

/**
 * Returns current Spain time hour (0-23)
 */
const getSpainHour = (): number => {
  return parseInt(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour: 'numeric', hour12: false }), 10)
}

/**
 * Sends an email via Resend API
 */
const sendEmail = async (subject: string, html: string) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Captaciones Gelabert Homes <alertas@gelaberthomes.es>',
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return false
  }
  return true
}

/**
 * Marks an alert as sent to avoid re-sending
 */
const markAlertSent = async (captacionId: string, alertType: string) => {
  await supabaseAdmin
    .from('captaciones_alerts_sent')
    .upsert({ captacion_id: captacionId, alert_type: alertType, sent_at: new Date().toISOString() },
             { onConflict: 'captacion_id,alert_type' })
}

/**
 * Checks if an alert was already sent
 */
const wasAlertSent = async (captacionId: string, alertType: string): Promise<boolean> => {
  const { data } = await supabaseAdmin
    .from('captaciones_alerts_sent')
    .select('id')
    .eq('captacion_id', captacionId)
    .eq('alert_type', alertType)
    .maybeSingle()
  return !!data
}

/**
 * Build a card HTML block for a captacion alert
 */
const buildCaptacionCard = (c: any, message: string, urgencyColor: string): string => `
  <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #ddd; border-left: 4px solid ${urgencyColor}; border-radius: 6px; background: #fafafa;">
    <h4 style="margin: 0 0 8px; color: ${urgencyColor}; font-size: 14px;">${message}</h4>
    <p style="margin: 4px 0; font-size: 13px;"><strong>Propietario:</strong> ${c.owner_name}</p>
    <p style="margin: 4px 0; font-size: 13px;"><strong>Dirección:</strong> ${c.property_address}</p>
    ${c.owner_phone ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Teléfono:</strong> <a href="tel:${c.owner_phone}" style="color: #C9A962;">${c.owner_phone}</a></p>` : ''}
    ${c.owner_email ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> ${c.owner_email}</p>` : ''}
    ${c.agent_name ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Agente:</strong> ${c.agent_name}</p>` : ''}
    <div style="margin-top: 12px;">
      <a href="https://gelaberthomes.es/admin/captaciones?id=${c.id}"
         style="background:#0A0A0A; color:#C9A962; padding:8px 14px; text-decoration:none; border-radius:4px; font-size:13px; font-weight:bold;">
        Ver en CRM →
      </a>
    </div>
  </div>
`

const buildEmailHtml = (sections: string[], title: string): string => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: sans-serif; background: #f5f5f5; padding: 24px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background: #0A0A0A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A962; margin: 0; font-size: 20px; letter-spacing: 2px;">GELABERT HOMES</h1>
        <p style="color: #888; margin: 6px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Control de Captaciones</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #333; font-size: 16px; border-bottom: 2px solid #C9A962; padding-bottom: 8px; margin-bottom: 20px;">${title}</h2>
        ${sections.join('\n')}
        <p style="font-size: 11px; color: #aaa; text-align: center; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
          Alerta automática del CRM de Captaciones · Gelabert Homes
        </p>
      </div>
    </div>
  </body>
  </html>
`

serve(async (_req) => {
  try {
    const todayStr = getTodayStr()
    const in1Day = getDatePlusDays(1)
    const in3Days = getDatePlusDays(3)
    const spainHour = getSpainHour()

    let emailsSent = 0

    // Fetch all active captaciones (not rejected/finished)
    const { data: captaciones, error } = await supabaseAdmin
      .from('captaciones')
      .select(`
        id, owner_name, owner_phone, owner_email, property_address,
        status, follow_up_date, visit_date, agent_id,
        agent:user_profiles!captaciones_agent_id_fkey(agent_name)
      `)
      .not('status', 'in', '(rechazado)')

    if (error) {
      console.error('Error fetching captaciones:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const followUpSections: string[] = []
    const visitSections: string[] = []

    for (const c of (captaciones || [])) {
      const agentName = (c.agent as any)?.agent_name || null
      const enriched = { ...c, agent_name: agentName }

      // ── FOLLOW-UP ALERTS ───────────────────────────────────────────────────
      if (c.follow_up_date) {
        // 3 days before follow-up (runs between 07:00-09:00 Spain)
        if (c.follow_up_date === in3Days && spainHour >= 7 && spainHour <= 9) {
          const key = `follow_up_3d`
          if (!await wasAlertSent(c.id, key)) {
            followUpSections.push(buildCaptacionCard(enriched, '📅 Seguimiento en 3 días', '#f97316'))
            await markAlertSent(c.id, key)
          }
        }

        // 1 day before follow-up
        if (c.follow_up_date === in1Day && spainHour >= 7 && spainHour <= 9) {
          const key = `follow_up_1d`
          if (!await wasAlertSent(c.id, key)) {
            followUpSections.push(buildCaptacionCard(enriched, '⏰ Seguimiento MAÑANA', '#f97316'))
            await markAlertSent(c.id, key)
          }
        }

        // Same day follow-up (send at 08:00 Spain)
        if (c.follow_up_date === todayStr && spainHour >= 8 && spainHour <= 10) {
          const key = `follow_up_today`
          if (!await wasAlertSent(c.id, key)) {
            followUpSections.push(buildCaptacionCard(enriched, '📞 Llamar HOY — Seguimiento programado', '#ef4444'))
            await markAlertSent(c.id, key)
          }
        }
      }

      // ── VISIT ALERTS ────────────────────────────────────────────────────────
      if (c.visit_date) {
        const visitDate = new Date(c.visit_date)
        const visitDayStr = visitDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
        const visitHour = visitDate.toLocaleString('en-US', { timeZone: 'Europe/Madrid', hour: 'numeric', hour12: false })
        const visitHourNum = parseInt(visitHour, 10)
        const visitTimeStr = visitDate.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })

        // 3 days before visit
        if (visitDayStr === in3Days && spainHour >= 7 && spainHour <= 9) {
          const key = `visit_3d`
          if (!await wasAlertSent(c.id, key)) {
            visitSections.push(buildCaptacionCard(enriched, `🏠 Visita en 3 días · ${visitTimeStr}`, '#3b82f6'))
            await markAlertSent(c.id, key)
          }
        }

        // 1 day before visit
        if (visitDayStr === in1Day && spainHour >= 7 && spainHour <= 9) {
          const key = `visit_1d`
          if (!await wasAlertSent(c.id, key)) {
            visitSections.push(buildCaptacionCard(enriched, `🏠 Visita MAÑANA a las ${visitTimeStr}`, '#3b82f6'))
            await markAlertSent(c.id, key)
          }
        }

        // Same day — send 2-3 hours before the visit
        if (visitDayStr === todayStr) {
          const hoursBeforeVisit = visitHourNum - spainHour
          if (hoursBeforeVisit >= 2 && hoursBeforeVisit <= 3) {
            const key = `visit_today`
            if (!await wasAlertSent(c.id, key)) {
              visitSections.push(buildCaptacionCard(enriched, `🔑 Visita HOY a las ${visitTimeStr} — en ~${hoursBeforeVisit}h`, '#ef4444'))
              await markAlertSent(c.id, key)
            }
          }
        }
      }
    }

    // Send follow-up email if there are alerts
    if (followUpSections.length > 0) {
      const sent = await sendEmail(
        `📞 Alertas de Seguimiento — ${followUpSections.length} captación(es) · Gelabert Homes`,
        buildEmailHtml(followUpSections, 'Seguimientos Programados')
      )
      if (sent) emailsSent++
    }

    // Send visit email if there are alerts
    if (visitSections.length > 0) {
      const sent = await sendEmail(
        `🏠 Alertas de Visitas — ${visitSections.length} visita(s) · Gelabert Homes`,
        buildEmailHtml(visitSections, 'Visitas a Propiedades')
      )
      if (sent) emailsSent++
    }

    return new Response(JSON.stringify({
      success: true,
      emailsSent,
      followUpAlerts: followUpSections.length,
      visitAlerts: visitSections.length,
      checkedAt: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Critical error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
