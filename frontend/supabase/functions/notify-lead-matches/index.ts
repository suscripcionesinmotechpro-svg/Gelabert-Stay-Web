import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'info@gelaberthomes.es'; // Puedes cambiarlo si quieres que te llegue a otro

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { leadData, matches, type, isSummary, summaryHtml, adminOnly } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    // 1. Enviar Email al Cliente (Si dejó su correo y NO es solo para admin)
    if (leadData.email && !adminOnly) {
      let clientHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 20px;">
          <h2 style="color: #C9A962;">¡Hola ${leadData.name || ''}!</h2>
          <p>Gracias por contactar con <strong>Gelabert Homes</strong>.</p>
          <p>Hemos recibido correctamente tu solicitud. Un agente de nuestro equipo de expertos se pondrá en contacto contigo lo antes posible para asesorarte de manera personalizada.</p>
      `;

      if (isSummary && summaryHtml) {
        clientHtml += `
          <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #C9A962;">Resumen de tu solicitud:</h3>
            ${summaryHtml}
          </div>
        `;
      } else {
        clientHtml += `
          <p style="font-size: 12px; color: #666;"><em>Nota: Nuestro agente te informará de todos los detalles durante nuestra conversación.</em></p>
        `;
      }


      if (matches && matches.length > 0) {
        clientHtml += `
          <h3 style="margin-top: 30px;">Hemos encontrado opciones interesantes para ti:</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
        `;

        for (const p of matches) {
          const propLink = `https://gelaberthomes.com/propiedades/${p.slug}`;
          clientHtml += `
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; width: 100%; max-width: 300px; margin-bottom: 20px;">
              <img src="${p.main_image || ''}" alt="${p.title}" style="width: 100%; height: 200px; object-fit: cover;" />
              <div style="padding: 15px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px;">${p.title}</h4>
                <p style="color: #C9A962; font-weight: bold; font-size: 18px; margin: 0 0 15px 0;">${p.price}€</p>
                <a href="${propLink}" style="display: block; text-align: center; background-color: #C9A962; color: #000; text-decoration: none; padding: 10px; border-radius: 4px; font-weight: bold;">Ver Propiedad</a>
              </div>
            </div>
          `;
        }
        clientHtml += `</div>`;
      }

      clientHtml += `
          <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #C9A962; font-size: 12px; color: #666;">
            <strong>Política de Privacidad:</strong><br/>
            De acuerdo con la legislación vigente en materia de protección de datos, te informamos que Gelabert Homes tratará tus datos personales con la finalidad de gestionar tu solicitud y ofrecerte nuestros servicios inmobiliarios. Tus datos no serán cedidos a terceros salvo obligación legal. Puedes ejercer tus derechos de acceso, rectificación, supresión y oposición en cualquier momento contactando con nosotros en info@gelaberthomes.es.
          </div>

          <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
            <img src="https://gelaberthomes.com/logo.png" alt="Gelabert Homes Logo" style="height: 60px; margin-bottom: 15px;" />
            <p style="margin: 5px 0; color: #333; font-weight: bold;">Gelabert Homes Real Estate</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">📍 Málaga, España</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">📞 +34 628 49 00 28</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">✉️ <a href="mailto:info@gelaberthomes.es" style="color: #C9A962; text-decoration: none;">info@gelaberthomes.es</a></p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">🌐 <a href="https://gelaberthomes.com" style="color: #C9A962; text-decoration: none;">www.gelaberthomes.com</a></p>
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
          from: 'Gelabert Homes <info@gelaberthomes.com>',
          to: [leadData.email],
          subject: matches && matches.length > 0 ? 'Tus Propiedades Seleccionadas - Gelabert Homes' : 'Hemos recibido tu solicitud - Gelabert Homes',
          html: clientHtml
        })
      });
    }

    // 2. Enviar Email al Admin (Aviso interno, solo si no es solo resumen)
    if (!isSummary) {
      const adminHtml = `
        <h2>Nuevo Lead desde Gelabot</h2>
        <p><strong>Nombre:</strong> ${leadData.name}</p>
        <p><strong>Email:</strong> ${leadData.email}</p>
        <p><strong>Teléfono:</strong> ${leadData.phone}</p>
        <p><strong>Intención:</strong> ${type}</p>
        <p><strong>Estado:</strong> ${leadData.status}</p>
        <p><strong>Notas:</strong> ${leadData.agent_notes || 'Ninguna'}</p>
        <p>Revisa el panel de administración CRM para ver todos los detalles financieros y de búsqueda.</p>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Gelabot Notificaciones <onboarding@resend.dev>', // O tu dominio verificado
          to: [ADMIN_EMAIL],
          subject: `NUEVO LEAD: ${leadData.name} (${type})`,
          html: adminHtml
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
