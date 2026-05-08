import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const { record, old_record, type } = payload

    // 1. Detectar si la propiedad se acaba de "publicar" o es nueva disponible
    // Si es un UPDATE, verificamos que el estado haya cambiado a 'disponible'
    // Si es un INSERT, verificamos que nazca como 'disponible'
    const isNowAvailable = 
      (type === 'INSERT' && record.commercial_status === 'disponible') ||
      (type === 'UPDATE' && record.commercial_status === 'disponible' && old_record?.commercial_status !== 'disponible')

    if (!isNowAvailable) {
      return new Response(JSON.stringify({ message: 'Status unchanged or not relevant' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const propLink = `https://gelaberthomes.es/propiedades/${record.slug}`
    const price = record.price?.toLocaleString('es-ES') + '€' + (record.operation === 'alquiler' ? '/mes' : '')
    const mainImg = record.main_image || 'https://gelaberthomes.es/sample_property.jpg'

    // ── DISCORD INTEGRATION ──────────────────────────────────────────────────
    const DISCORD_URL = Deno.env.get('COMMUNITY_WEBHOOK_URL')
    if (DISCORD_URL) {
      const discordPayload = {
        content: `🏠 **¡Nueva propiedad publicada en la web!**`,
        embeds: [{
          title: record.title,
          description: record.short_description || 'Nueva oportunidad inmobiliaria en Málaga.',
          url: propLink,
          color: 13216098, // #C9A962 en decimal
          fields: [
            { name: 'Precio', value: price, inline: true },
            { name: 'Operación', value: record.operation.toUpperCase(), inline: true },
            { name: 'Ubicación', value: `${record.zone || ''}, ${record.city || 'Málaga'}`, inline: true }
          ],
          image: { url: mainImg },
          footer: { text: 'Gelabert Homes — Real Estate', icon_url: 'https://gelaberthomes.es/favicon.ico' }
        }]
      }
      
      await fetch(DISCORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      }).catch(e => console.error('Discord error:', e))
    }

    // ── TELEGRAM INTEGRATION ─────────────────────────────────────────────────
    const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const TG_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
    if (TG_TOKEN && TG_CHAT_ID) {
      const text = `🏠 *¡Nueva propiedad disponible!*\n\n*${record.title}*\n💰 Precio: ${price}\n📍 Zona: ${record.zone || record.city}\n\n🔗 [Ver en la web](${propLink})`
      
      const tgUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          photo: mainImg,
          caption: text,
          parse_mode: 'Markdown'
        })
      }).catch(e => console.error('Telegram error:', e))
    }

    return new Response(JSON.stringify({ success: true, notified: !!(DISCORD_URL || TG_TOKEN) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error('Community sharing error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
