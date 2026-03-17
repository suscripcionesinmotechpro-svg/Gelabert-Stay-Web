import { Context } from 'https://edge.netlify.com';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL') || '';
const supabaseKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request: Request, context: Context) {
  try {
    // 1. Obtener todas las propiedades publicadas
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, reference, slug, updated_at')
      .eq('status', 'publicada');

    if (error) {
      console.error("Error fetching properties for sitemap:", error);
      throw error;
    }

    // 2. Definir las rutas estáticas base
    const staticRoutes = [
      '',
      '/propiedades',
      '/servicios',
      '/propietarios',
      '/contacto'
    ];

    // 3. Empezar a construir el XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const baseUrl = 'https://gelaberthomes.es';
    const today = new Date().toISOString().split('T')[0];

    // Rutas estáticas ES y EN
    staticRoutes.forEach(route => {
      xml += `
  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${today}</lastmod>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>
  <url>
    <loc>${baseUrl}/en${route}</loc>
    <lastmod>${today}</lastmod>
    <priority>${route === '' ? '0.9' : '0.7'}</priority>
  </url>`;
    });

    // Rutas dinámicas de propiedades ES y EN
    if (properties) {
      properties.forEach(prop => {
        const urlId = prop.reference || prop.slug || prop.id;
        const lastMod = prop.updated_at ? prop.updated_at.split('T')[0] : today;
        
        xml += `
  <url>
    <loc>${baseUrl}/propiedades/${urlId}</loc>
    <lastmod>${lastMod}</lastmod>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/en/propiedades/${urlId}</loc>
    <lastmod>${lastMod}</lastmod>
    <priority>0.6</priority>
  </url>`;
      });
    }

    xml += `\n</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });

  } catch (err) {
    console.error("Error generating sitemap:", err);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
