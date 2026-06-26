import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const ADMIN_EMAIL = "info@gelaberthomes.es";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const inquiry = await req.json();
    console.log("Received inquiry:", inquiry);

    let propertyDetails = null;
    if (inquiry.property_id) {
      const { data, error } = await supabaseAdmin
        .from("properties")
        .select("title, reference, slug, price, operation, city, agent_id")
        .eq("id", inquiry.property_id)
        .maybeSingle();
      
      if (!error && data) {
        propertyDetails = data;
      }
    }

    let agentEmail = null;
    const agentId = inquiry.agent_id || propertyDetails?.agent_id;
    if (agentId) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(agentId);
        if (!userError && userData?.user?.email) {
          agentEmail = userData.user.email;
          console.log(`Resolved agent email for inquiry notification: ${agentEmail}`);
        } else if (userError) {
          console.error("Error fetching agent user info:", userError);
        }
      } catch (authErr) {
        console.error("Exception fetching agent user info:", authErr);
      }
    }

    const name = inquiry.name || "No facilitado";
    const email = inquiry.email || "No facilitado";
    const phone = inquiry.phone || "No facilitado";
    const message = inquiry.message || "Sin mensaje";
    const inquiryType = inquiry.inquiry_type || "general";
    const city = inquiry.city || "";
    const opType = inquiry.operation_type || "";

    // Mappings to display nice labels in the email
    const typeLabelMap: Record<string, string> = {
      compra: "Comprar una propiedad",
      alquiler: "Alquilar una propiedad",
      venta: "Vender una propiedad",
      colaborar: "Colaboración / Propuesta",
      trabajar: "Trabajar con nosotros",
      otro: "Otro motivo",
      general: "Consulta General",
    };
    const inquiryTypeLabel = typeLabelMap[inquiryType] || inquiryType;

    const opLabelMap: Record<string, string> = {
      vender: "Quiere VENDER su propiedad",
      alquilar: "Quiere ALQUILAR su propiedad",
    };
    const opTypeLabel = opLabelMap[opType] || null;

    // Build smart, personalized subject line
    let subjectType = "";
    if (propertyDetails) {
      const ref = propertyDetails.reference ? ` [${propertyDetails.reference}]` : "";
      subjectType = `Interés en Propiedad: ${propertyDetails.title}${ref}`;
    } else if (opType === "vender" || opType === "alquilar") {
      subjectType = `Propietario quiere ${opType === "vender" ? "VENDER" : "ALQUILAR"}`;
    } else {
      const subjectMap: Record<string, string> = {
        compra: "Cliente quiere COMPRAR",
        alquiler: "Cliente quiere ALQUILAR",
        venta: "Cliente quiere VENDER",
        colaborar: "Propuesta de COLABORACIÓN",
        trabajar: "Candidatura de TRABAJO",
        otro: "Consulta General",
      };
      subjectType = subjectMap[inquiryType] || `Consulta (${inquiryType})`;
    }

    const subject = `📩 ${subjectType} - ${name}`;

    // Build Email Body
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; background: #0A0A0A; padding: 15px; border-radius: 6px 6px 0 0;">
          <h2 style="color: #C9A962; margin: 0; font-size: 20px; letter-spacing: 2px;">GELABERT HOMES</h2>
        </div>
        <div style="padding: 20px;">
          <h3 style="color: #0A0A0A; border-bottom: 2px solid #C9A962; padding-bottom: 8px; margin-top: 0;">📩 Nueva Consulta de Contacto</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px; border-bottom: 1px solid #eee;">Nombre:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Teléfono:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${phone}">${phone}</a></td>
            </tr>
    `;

    if (opTypeLabel) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Intención Propietario:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #C9A962;">${opTypeLabel}</td>
            </tr>
      `;
    } else {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Tipo Consulta:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${inquiryTypeLabel}</td>
            </tr>
      `;
    }

    if (city) {
      emailHtml += `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #eee;">Ciudad/Ubicación:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${city}</td>
            </tr>
      `;
    }

    emailHtml += `
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background: #fafafa; border-left: 4px solid #C9A962; border-radius: 4px;">
            <strong style="display: block; margin-bottom: 8px;">Mensaje:</strong>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
    `;

    if (propertyDetails) {
      const propUrl = `https://gelaberthomes.es/propiedades/${propertyDetails.slug || inquiry.property_id}`;
      emailHtml += `
          <div style="margin-top: 25px; padding: 15px; border: 1px solid #C9A962; border-radius: 6px; background: #FAF8F5;">
            <h4 style="color: #0A0A0A; margin: 0 0 10px 0;">🏠 Propiedad Consultada</h4>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Título:</strong> ${propertyDetails.title}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Referencia:</strong> ${propertyDetails.reference || "N/A"}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Precio:</strong> ${propertyDetails.price ? `${propertyDetails.price.toLocaleString("es-ES")} €` : "N/A"}</p>
            <p style="margin: 12px 0 0 0;">
              <a href="${propUrl}" target="_blank" style="background: #0A0A0A; color: #C9A962; padding: 8px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">Ver propiedad en la web</a>
            </p>
          </div>
      `;
    }

    emailHtml += `
          <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
            Este es un correo automático enviado desde el sitio web de Gelabert Homes.
          </div>
        </div>
      </div>
    `;

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Web Contacto <alertas@gelaberthomes.es>",
        to: agentEmail && agentEmail !== ADMIN_EMAIL ? [ADMIN_EMAIL, agentEmail] : [ADMIN_EMAIL],
        subject,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Error sending email via Resend:", errText);
      throw new Error(`Resend error: ${errText}`);
    }

    console.log("Email sent successfully");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("Critical error in notify-inquiry function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
