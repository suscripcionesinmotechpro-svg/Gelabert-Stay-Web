import { Context } from 'https://edge.netlify.com';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL') || '';
const supabaseKey = Netlify.env.get('VITE_SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Optimize Supabase Storage image for sitemap (used by Google Image Search)
function getImageUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  if (rawUrl.includes('supabase.co') && rawUrl.includes('/object/public/')) {
    const base = rawUrl.split('?')[0];
    return base.replace('/object/public/', '/render/image/public/') + '?width=1200&height=630&resize=contain&quality=80';
  }
  return rawUrl.split('?')[0];
}

export default async function handler(request: Request, context: Context) {
  try {
    // 1. Obtener todas las propiedades publicadas
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, reference, slug, updated_at, main_image, gallery, title, city, operation, property_type')
      .eq('status', 'publicada');

    if (error) {
      console.error("Error fetching properties for sitemap:", error);
      throw error;
    }

    // 2. Definir las rutas estáticas base con prioridades correctas
    const staticRoutes: { path: string; priority: string; changefreq: string }[] = [
      { path: '',            priority: '1.0', changefreq: 'weekly'  },
      { path: '/propiedades',priority: '0.9', changefreq: 'daily'   },
      { path: '/servicios',  priority: '0.8', changefreq: 'monthly' },
      { path: '/propietarios',priority: '0.7',changefreq: 'monthly' },
      { path: '/contacto',   priority: '0.7', changefreq: 'monthly' },
    ];

    // 3. Construir XML con namespace de imágenes
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    const baseUrl = 'https://gelaberthomes.es';
    const today = new Date().toISOString().split('T')[0];

    // Rutas estáticas ES y EN
    staticRoutes.forEach(({ path, priority, changefreq }) => {
      xml += `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
  <url>
    <loc>${baseUrl}/en${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${parseFloat(priority) > 0.1 ? (parseFloat(priority) - 0.1).toFixed(1) : priority}</priority>
  </url>`;
    });

    // Rutas dinámicas de propiedades ES y EN (con imágenes para Google Image Search)
    if (properties) {
      properties.forEach(prop => {
        const urlId = prop.reference || prop.slug || prop.id;
        const lastMod = prop.updated_at ? prop.updated_at.split('T')[0] : today;

        // Get primary image
        let rawImg = '';
        if (prop.main_image && prop.main_image.trim()) {
          rawImg = prop.main_image.trim();
        } else if (prop.gallery && prop.gallery.length > 0) {
          rawImg = prop.gallery.find((i: string) => i && i.trim()) || '';
        }
        const imgUrl = rawImg ? getImageUrl(rawImg) : '';
        const imageTitle = `${prop.title || 'Propiedad'}${prop.city ? ' en ' + prop.city : ''} - Gelabert Homes`;
        const imageTag = imgUrl
          ? `\n    <image:image>\n      <image:loc>${imgUrl}</image:loc>\n      <image:title>${imageTitle.replace(/&/g,'&amp;')}</image:title>\n    </image:image>`
          : '';

        xml += `
  <url>
    <loc>${baseUrl}/propiedades/${urlId}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageTag}
  </url>
  <url>
    <loc>${baseUrl}/en/propiedades/${urlId}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${imageTag}
  </url>`;
      });
    }

    xml += `\n</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
        'X-Robots-Tag': 'noindex',
      }
    });

  } catch (err) {
    console.error("Error generating sitemap:", err);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
