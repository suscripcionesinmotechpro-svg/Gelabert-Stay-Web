import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'info@gelaberthomes.es';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Official Signature HTML Snippet (Adapted for embedding)
const EMAIL_SIGNATURE = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%; max-width: 600px; background-color: #ffffff; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
    <tr>
        <td style="padding: 15px 0;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                <tr>
                    <td style="background-color: #000000; padding: 12px 20px; width: 140px; text-align: center; vertical-align: middle; border-radius: 4px;">
                        <a href="https://gelaberthomes.es" target="_blank" style="text-decoration: none;">
                            <img src="https://gelaberthomes.es/logo-hd-perfect.png" alt="Gelabert Homes" width="120" style="display: block; border: 0; outline: none; margin: 0 auto;">
                        </a>
                    </td>
                    <td style="width: 2px; background-color: #C9A962;"></td>
                    <td style="padding-left: 20px; vertical-align: middle;">
                        <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">
                            <tr>
                                <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #C9A962; font-weight: bold; padding-bottom: 2px;">
                                    José Carlos Delgado
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #888888; font-weight: 600; padding-bottom: 8px; text-transform: uppercase;">
                                    Director / CEO
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #444444;">
                                    📞 <a href="tel:+34611898827" style="color: #444444; text-decoration: none;">+34 611 898 827</a><br>
                                    ✉️ <a href="mailto:info@gelaberthomes.es" style="color: #444444; text-decoration: none;">info@gelaberthomes.es</a><br>
                                    🌐 <a href="https://gelaberthomes.es" target="_blank" style="color: #444444; text-decoration: none;">www.gelaberthomes.es</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    <tr>
        <td style="padding-top: 10px; font-family: Arial, sans-serif; font-size: 9px; color: #999; line-height: 12px; text-align: justify;">
            <strong>AVISO LEGAL Y PRIVACIDAD:</strong> Este mensaje y sus archivos adjuntos son confidenciales. Cumplimos con el RGPD (UE) 2016/679. Responsable: Gelabert Homes Real Estate. Finalidad: Gestión inmobiliaria.
        </td>
    </tr>
</table>
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { leadData, matches, type, isSummary, summaryHtml, adminOnly } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    // 1. Enviar Email al Cliente
    if (leadData.email && !adminOnly) {
      let clientHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://gelaberthomes.es/logo-hd-perfect.png" alt="Gelabert Homes" width="180" style="background: #000; padding: 15px; border-radius: 4px;">
          </div>
          
          <h2 style="color: #C9A962; border-bottom: 2px solid #C9A962; padding-bottom: 10px;">¡Hola ${leadData.name || 'propietario'}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">Gracias por confiar en <strong>Gelabert Homes</strong>.</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Hemos recibido correctamente tu solicitud de <strong>${type || 'información'}</strong>. Nuestro equipo de expertos ya está revisando tu perfil para ofrecerte la mejor solución inmobiliaria en Málaga.</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Un asesor se pondrá en contacto contigo muy pronto a través de este email o del teléfono <strong>${leadData.phone || 'facilitado'}</strong>.</p>
      `;

      if (isSummary && summaryHtml) {
        clientHtml += `
          <div style="background: #FAF8F5; padding: 20px; border-radius: 8px; border-left: 4px solid #C9A962; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #C9A962; font-size: 18px;">Resumen de tu solicitud:</h3>
            <div style="font-size: 14px; line-height: 1.5; color: #555;">
              ${summaryHtml}
            </div>
          </div>
        `;
      }

      if (matches && matches.length > 0) {
        clientHtml += `
          <h3 style="margin-top: 40px; color: #333; text-align: center;">Propiedades que encajan con tu búsqueda:</h3>
          <div style="margin-top: 20px;">
        `;

        for (const p of matches) {
          const propLink = `https://gelaberthomes.es/propiedades/${p.slug}`;
          // Usar una imagen por defecto si no tiene
          const imgUrl = p.main_image || 'https://gelaberthomes.es/sample_property.jpg';
          
          clientHtml += `
            <div style="background: white; border: 1px solid #eee; border-radius: 12px; overflow: hidden; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="width: 40%; vertical-align: top;">
                    <img src="${imgUrl}" alt="${p.title}" style="width: 100%; height: 100%; min-height: 150px; object-fit: cover;" />
                  </td>
                  <td style="padding: 20px; vertical-align: middle;">
                    <h4 style="margin: 0 0 10px 0; font-size: 18px; color: #000;">${p.title}</h4>
                    <p style="color: #C9A962; font-weight: bold; font-size: 20px; margin: 0 0 15px 0;">${p.price.toLocaleString('es-ES')}€${p.operation === 'alquiler' ? '/mes' : ''}</p>
                    <a href="${propLink}" style="display: inline-block; background-color: #C9A962; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 14px;">Ver Detalles</a>
                  </td>
                </tr>
              </table>
            </div>
          `;
        }
        clientHtml += `</div>`;
      }

      clientHtml += `
          <p style="font-size: 15px; color: #666; margin-top: 30px;">Si tienes alguna duda urgente, puedes responder a este correo o escribirnos por WhatsApp.</p>
          
          ${EMAIL_SIGNATURE}
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'CRM Lead <info@gelaberthomes.es>',
          to: [leadData.email],
          subject: matches && matches.length > 0 ? 'Selección de Propiedades para ti - Gelabert Homes' : 'Confirmación de Solicitud - Gelabert Homes',
          html: clientHtml
        })
      });
    }

    // 2. Enviar Email al Admin
    if (!isSummary) {
      const adminHtml = `
        <div style="font-family: sans-serif; padding: 20px; background: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 8px; border-top: 5px solid #C9A962;">
            <h2 style="margin-top: 0; color: #333;">🚀 ¡Nuevo Lead Registrado!</h2>
            <p style="font-size: 16px;">El sistema CRM ha captado un nuevo cliente interesado en <strong>${type}</strong>.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Nombre:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${leadData.name || 'No facilitado'}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${leadData.email}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Teléfono:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${leadData.phone || 'No facilitado'}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Intención:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${type}</td></tr>
            </table>

            <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; border: 1px solid #ddd;">
              <h3 style="margin-top: 0; font-size: 16px; color: #C9A962;">Notas de CRM Lead:</h3>
              <p style="white-space: pre-wrap; font-size: 14px; color: #444;">${leadData.agent_notes || 'Sin notas adicionales.'}</p>
            </div>

            <p style="margin-top: 25px; text-align: center;">
              <a href="https://gelaberthomes.es/admin/leads" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en el CRM</a>
            </p>
          </div>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'CRM Lead Notifications <info@gelaberthomes.es>',
          to: [ADMIN_EMAIL],
          subject: `⚡ NUEVO LEAD: ${leadData.name || leadData.email} (${type})`,
          html: adminHtml
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in notify-lead-matches:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

