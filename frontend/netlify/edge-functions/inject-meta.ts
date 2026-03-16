import { Context } from "https://edge.netlify.com";

const SUPABASE_URL = "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Pattern to capture property reference/ID
  // Matches /propiedades/REF and /en/propiedades/REF
  const match = path.match(/^\/(?:en\/)?propiedades\/([^\/]+)/);
  if (!match) return;

  const rawIdentifier = match[1];
  const isEn = path.startsWith('/en/');

  // Avoid processing static files or non-property routes
  if (rawIdentifier.includes('.') || rawIdentifier === 'catalog') return;
  
  // Clean trailing slash if present
  let cleanId = rawIdentifier;
  if (cleanId.endsWith('/')) {
      cleanId = cleanId.slice(0, -1);
  }

  try {
    // 1. Clean identifier
    const identifier = cleanId.trim();
    
    // 2. Resolve template (index.html)
    // We try context.next() first, but if it's a 404 (dynamic property), 
    // we fetch the root index.html to have a valid template.
    const pageRes = await context.next();
    let html: string;
    let originStatus = pageRes.status;

    if (pageRes.ok && pageRes.headers.get("content-type")?.includes("text/html")) {
      html = await pageRes.text();
    } else {
      // If origin returns 404 (dynamic property), we MUST fetch the base index.html
      const rootRes = await fetch(new URL("/index.html", request.url).href);
      if (rootRes.ok) {
        html = await rootRes.text();
      } else {
        // Absolute fallback if everything fails
        return pageRes;
      }
    }

    // 3. Identification and Normalization
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(identifier);

    let searchId = identifier;
    if (!isUuid && identifier.toLowerCase().includes('gel')) {
      searchId = identifier.toUpperCase().replace(/\s+/g, '-');
      if (!searchId.startsWith('GEL-') && searchId.includes('GEL')) {
          searchId = searchId.replace('GEL', 'GEL-');
      }
    }

    // 4. Supabase Query
    const orConditions = isUuid 
      ? `reference.eq.${searchId},slug.eq.${searchId},id.eq.${searchId}`
      : `reference.eq.${searchId},slug.eq.${searchId},reference.ilike.${searchId},slug.ilike.${searchId}`;

    const queryUrl = `${SUPABASE_URL}/rest/v1/properties?or=(${orConditions})&select=*`;
    
    const dbResponse = await fetch(queryUrl, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });

    let xDebug = `origin:${originStatus}`;
    let prop = null;

    if (dbResponse.ok) {
      const properties = await dbResponse.json();
      xDebug += `|found:${properties.length}`;
      if (properties && properties.length > 0) {
        prop = properties[0];
      }
    } else {
      xDebug += `|db_err:${dbResponse.status}`;
    }

    // 5. Injection Logic
    if (prop) {
      const title = prop.meta_title || (isEn ? (prop.title_en || prop.title) : prop.title) || "Propiedad | Gelabert Stay";
      const features = [];
      if (prop.area_m2) features.push(`${prop.area_m2} ${isEn ? 'sqm' : 'm²'}`);
      if (prop.bedrooms) features.push(`${prop.bedrooms} ${isEn ? 'beds' : 'hab.'}`);
      if (prop.bathrooms) features.push(`${prop.bathrooms} ${isEn ? 'baths' : 'baños'}`);
      
      let description = prop.meta_description;
      if (!description || description.length < 10) {
          description = features.join(' • ');
          if (!description || description.length < 10) {
              description = isEn ? (prop.description_en || prop.description) : prop.description;
          }
      }

      const mainImage = prop.main_image || (prop.gallery && prop.gallery.length > 0 ? prop.gallery[0] : null);
      if (mainImage) {
        const cacheBuster = `t=${Date.now()}`;
        const previewImage = mainImage.includes('?') ? `${mainImage}&${cacheBuster}` : `${mainImage}?${cacheBuster}`;
        const cleanTitle = (title || "").replace(/"/g, '&quot;');
        const cleanDesc = (description || "").slice(0, 160).replace(/"/g, '&quot;');

        // Clean existing tags
        html = html.replace(/<title>[^<]*<\/title>/gi, '');
        html = html.replace(/<meta [^>]*property=["']og:[^"']*["'][^>]*>/gi, '');
        html = html.replace(/<meta [^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
        html = html.replace(/<meta [^>]*name=["']description["'][^>]*>/gi, '');
        html = html.replace(/<link [^>]*rel=["'](canonical|image_src)["'][^>]*>/gi, '');

        const tags = [
          `<title>${cleanTitle} | Gelabert Stay</title>`,
          `<meta name="description" content="${cleanDesc}">`,
          `<link rel="canonical" href="${request.url}">`,
          `<link rel="image_src" href="${previewImage}">`,
          `<meta property="og:site_name" content="Gelabert Stay Real Estate">`,
          `<meta property="og:type" content="website">`,
          `<meta property="og:url" content="${request.url}">`,
          `<meta property="og:title" content="${cleanTitle} | Gelabert Stay">`,
          `<meta property="og:description" content="${cleanDesc}">`,
          `<meta property="og:image" content="${previewImage}">`,
          `<meta property="og:image:secure_url" content="${previewImage}">`,
          `<meta property="og:image:width" content="1200">`,
          `<meta property="og:image:height" content="630">`,
          `<meta property="og:image:type" content="image/jpeg">`,
          `<meta name="twitter:card" content="summary_large_image">`,
          `<meta name="twitter:title" content="${cleanTitle} | Gelabert Stay">`,
          `<meta name="twitter:description" content="${cleanDesc}">`,
          `<meta name="twitter:image" content="${previewImage}">`,
          `<meta itemprop="name" content="${cleanTitle}">`,
          `<meta itemprop="description" content="${cleanDesc}">`,
          `<meta itemprop="image" content="${previewImage}">`
        ];

        html = html.replace(/<head>/i, `<head>\n    <meta charset="UTF-8">\n    ${tags.join('\n    ')}`);
      }
    }

    // Always return a success response if we have HTML, to avoid 404s for dynamic properties
    return new Response(html, {
      headers: { 
        "content-type": "text/html; charset=UTF-8",
        "x-meta-injected": prop ? "true" : "false",
        "x-debug": xDebug,
        "x-prop-id": searchId,
        "cache-control": "public, max-age=0, must-revalidate"
      },
    });
  } catch (err) {
    console.error("Edge function crash:", err);
    return;
  }
};
