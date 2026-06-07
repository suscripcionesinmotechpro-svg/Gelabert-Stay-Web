import { Context } from "https://edge.netlify.com";

const SUPABASE_URL = "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

// Converts a Supabase Storage URL to use the render/image API for optimized previews.
// Social scrapers (WhatsApp, Facebook, Instagram) work best with images < 300KB, 1200x630.
// IMPORTANT: Keep query string minimal — WhatsApp bot sometimes fails on long/complex URLs.
function optimizeSupabaseImage(rawUrl: string, format = "webp"): string {
  if (!rawUrl || !rawUrl.trim()) return "";
  const clean = rawUrl.split("?")[0].split("#")[0].trim();
  // Only transform if it's a Supabase storage URL
  if (clean.includes("supabase.co") && clean.includes("/object/public/")) {
    return clean.replace("/object/public/", "/render/image/public/") + `?width=1200&height=630&resize=cover&quality=75&format=${format}`;
  }
  // For non-Supabase images (e.g. external CDN), return as-is without query params
  return clean;
}


function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Pattern to capture property reference/ID or blog slug
  // Matches:
  // - /propiedades/REF
  // - /en/propiedades/REF
  // - /blog/SLUG
  // - /en/blog/SLUG
  const match = path.match(/^\/(?:en\/)?(propiedades|blog)\/([^\\/]+)/);
  if (!match) return;

  const routeType = match[1]; // "propiedades" or "blog"
  const rawIdentifier = match[2];
  const isEn = path.startsWith("/en/");

  // Avoid processing static files or non-property routes
  if (rawIdentifier.includes(".") || rawIdentifier === "catalog") return;

  // Clean trailing slash if present
  let cleanId = rawIdentifier;
  if (cleanId.endsWith("/")) {
    cleanId = cleanId.slice(0, -1);
  }

  try {
    // 1. Clean identifier
    const identifier = cleanId.trim();

    // 2. Resolve template (index.html)
    const pageRes = await context.next();
    let html: string;
    let originStatus = pageRes.status;

    if (pageRes.ok && pageRes.headers.get("content-type")?.includes("text/html")) {
      html = await pageRes.text();
    } else {
      const rootRes = await fetch(new URL("/index.html", request.url).href);
      if (rootRes.ok) {
        html = await rootRes.text();
      } else {
        return pageRes;
      }
    }

    // 3. Identification and Normalization
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(identifier);

    let searchId = identifier;
    if (!isUuid && identifier.toLowerCase().includes("gel")) {
      searchId = identifier.toUpperCase().replace(/\s+/g, "-");
      if (!searchId.startsWith("GEL-") && searchId.includes("GEL")) {
        searchId = searchId.replace("GEL", "GEL-");
      }
    }

    // 4. Supabase Query
    let dbData = null;
    let xDebug = `origin:${originStatus}`;
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    if (routeType === "propiedades") {
      const urls = [
        `${SUPABASE_URL}/rest/v1/properties?reference=eq.${encodeURIComponent(searchId)}&select=*`,
        `${SUPABASE_URL}/rest/v1/properties?slug=eq.${encodeURIComponent(identifier)}&select=*`
      ];
      if (searchId.includes("-")) {
        urls.push(`${SUPABASE_URL}/rest/v1/properties?reference=eq.${encodeURIComponent(searchId.replace(/-/g, ""))}&select=*`);
      }
      if (isUuid) {
        urls.push(`${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(searchId)}&select=*`);
      }

      const responses = await Promise.all(
        urls.map(url => fetch(url, { headers, cache: 'no-store' }))
      );

      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        if (res.ok) {
          const items = await res.json();
          if (items && items.length > 0) {
            dbData = items[0];
            xDebug += `|found_ref:${dbData.reference || dbData.id}`;
            break;
          }
        } else {
          xDebug += `|db_err_${i}:${res.status}`;
        }
      }
      if (!dbData) {
        xDebug += `|not_found`;
      }
    } else {
      // Blog search by slug (cleaned of parameter t)
      const queryUrl = `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(identifier)}&select=*`;
      const dbResponse = await fetch(queryUrl, { headers, cache: 'no-store' });
      if (dbResponse.ok) {
        const items = await dbResponse.json();
        xDebug += `|found_blog:${items.length}`;
        if (items && items.length > 0) {
          dbData = items[0];
        }
      } else {
        xDebug += `|db_err_blog:${dbResponse.status}`;
      }
    }

    // 5. Injection Logic
    if (dbData) {
      let cleanTitle = "";
      let cleanDesc = "";
      let previewImage = "";
      let canonicalUrl = "";
      let jsonLds: any[] = [];

      if (routeType === "propiedades") {
        const prop = dbData;
        // ── Labels & Translations ──
        const typeLabels: Record<string, { es: string; en: string }> = {
          piso: { es: "Piso", en: "Apartment" },
          casa: { es: "Casa", en: "House" },
          chalet: { es: "Chalet", en: "Villa" },
          atico: { es: "Ático", en: "Penthouse" },
          estudio: { es: "Estudio", en: "Studio" },
          loft: { es: "Loft", en: "Loft" },
          local: { es: "Local", en: "Commercial" },
          oficina: { es: "Oficina", en: "Office" },
          nave: { es: "Nave", en: "Warehouse" },
          terreno: { es: "Terreno", en: "Land" },
          negocio: { es: "Negocio", en: "Business" },
          habitacion: { es: "Habitación", en: "Room" },
          otro: { es: "Propiedad", en: "Property" }
        };

        const type = prop.property_type || "otro";
        const typeLabel = isEn
          ? typeLabels[type]?.en || typeLabels.otro.en
          : typeLabels[type]?.es || typeLabels.otro.es;

        let opLabel = "";
        if (prop.operation === "alquiler") {
          if (prop.is_room_rental) {
            opLabel = isEn ? "Room Rental" : "Alquiler por habitaciones";
          } else {
            opLabel = isEn ? "Rent" : "Alquiler";
          }
        } else if (prop.operation === "venta") {
          opLabel = isEn ? "Sale" : "Venta";
        } else if (prop.operation === "traspaso") {
          opLabel = isEn ? "Transfer" : "Traspaso";
        }

        const cityLabel = prop.city ? (isEn ? ` in ${prop.city}` : ` en ${prop.city}`) : "";
        const baseSharingTitle = `${opLabel} ${typeLabel}${cityLabel}`;
        
        let title = "";
        if (isEn) {
          title = prop.title_en || prop.meta_title_en || baseSharingTitle;
        } else {
          title = prop.meta_title || prop.title || baseSharingTitle;
        }
        cleanTitle = (title || "Propiedad").trim();

        const features: string[] = [];
        if (prop.city) features.push(prop.city);
        if (prop.price) {
          const formatter = new Intl.NumberFormat(isEn ? "en-US" : "es-ES", {
            style: "currency",
            currency: prop.currency || "EUR",
            maximumFractionDigits: 0,
          });
          const feeLabel = prop.operation === "alquiler" ? (isEn ? "/month" : "/mes") : "";
          features.push(`${formatter.format(prop.price)}${feeLabel}`);
        }
        if (prop.area_m2) features.push(`${prop.area_m2} m²`);
        if (prop.bedrooms > 0) features.push(`${isEn ? "Bedrooms" : "Hab."} ${prop.bedrooms}`);
        if (prop.bathrooms > 0) features.push(`${isEn ? "Bath." : "Baños"} ${prop.bathrooms}`);
        if (prop.floor) features.push(`${isEn ? "Floor" : "Planta"} ${prop.floor}`);
        if (prop.has_elevator) features.push(isEn ? "Elevator" : "Ascensor");
        if (prop.has_pool) features.push(isEn ? "Pool" : "Piscina");
        if (prop.sea_views) features.push(isEn ? "Sea Views" : "Vistas al mar");

        const rawShort = isEn
          ? prop.short_description_en || prop.meta_description_en
          : prop.short_description || prop.meta_description;
        
        const rawLong = isEn ? prop.description_en : prop.description;
        
        let descriptionBody = "";
        if (rawShort) {
          descriptionBody = stripHtml(rawShort);
        } else if (rawLong) {
          descriptionBody = stripHtml(rawLong).substring(0, 160);
        }

        let description = features.join(" · ");
        if (descriptionBody) {
          description += ` | ${descriptionBody}`;
        }
        cleanDesc = description.trim() || cleanTitle;

        const rawImage = prop.main_image || (prop.gallery && prop.gallery[0]);
        previewImage = rawImage ? optimizeSupabaseImage(rawImage) : "https://gelaberthomes.es/logo-meta-v3.png";
        canonicalUrl = `https://gelaberthomes.es${isEn ? "/en" : ""}/propiedades/${prop.reference || prop.slug || prop.id}`;

        jsonLds.push({
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: cleanTitle,
          description: cleanDesc,
          image: previewImage,
          url: canonicalUrl,
          identifier: prop.reference || prop.id,
          offers: {
            "@type": "Offer",
            price: prop.price,
            priceCurrency: prop.currency || "EUR",
            availability: "https://schema.org/InStock"
          },
          address: {
            "@type": "PostalAddress",
            addressLocality: prop.city,
            addressRegion: "Andalucía",
            addressCountry: "ES",
            ...(prop.postal_code ? { postalCode: prop.postal_code } : {})
          },
          ...(prop.bedrooms > 0 ? { numberOfRooms: prop.bedrooms } : {}),
          ...(prop.bathrooms > 0 ? { numberOfBathroomsTotal: prop.bathrooms } : {}),
          ...(prop.area_m2 ? { floorSize: { "@type": "QuantitativeValue", value: prop.area_m2, unitCode: "MTK" } } : {}),
          seller: {
            "@type": "RealEstateAgent",
            name: "Gelabert Homes Real Estate",
            url: "https://gelaberthomes.es/",
            telephone: "+34611898827"
          }
        });
      } else {
        // ── Blog Injection ──
        const post = dbData;
        cleanTitle = isEn ? (post.seo_title_en || post.title_en || post.title) : (post.seo_title || post.title);
        const rawContent = isEn ? (post.content_en || post.content) : post.content;
        cleanDesc = isEn ? (post.seo_description_en || stripHtml(rawContent).substring(0, 160)) : (post.seo_description || stripHtml(rawContent).substring(0, 160));
        
        const rawImage = post.cover_image;
        previewImage = rawImage ? optimizeSupabaseImage(rawImage, "jpeg") : "https://gelaberthomes.es/logo-meta-v3.png";
        canonicalUrl = `https://gelaberthomes.es${isEn ? "/en" : ""}/blog/${post.slug}`;

        jsonLds.push({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: cleanTitle,
          description: cleanDesc,
          image: previewImage,
          url: canonicalUrl,
          datePublished: post.published_at || post.created_at
        });
      }

      // ── Clean & sanitize ──
      cleanTitle = cleanTitle.replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();
      cleanDesc = cleanDesc.replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();

      const tags = [
        `<title>${cleanTitle} | Gelabert Homes</title>`,
        `<meta name="description" content="${cleanDesc}">`,
        `<link rel="canonical" href="${canonicalUrl}">`,
        `<link rel="image_src" href="${previewImage}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="Gelabert Homes Real Estate">`,
        `<meta property="og:url" content="${canonicalUrl}">`,
        `<meta property="og:title" content="${cleanTitle} | Gelabert Homes">`,
        `<meta property="og:description" content="${cleanDesc}">`,
        `<meta property="og:image" content="${previewImage}">`,
        `<meta property="og:image:secure_url" content="${previewImage}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:image:type" content="${routeType === "propiedades" ? "image/webp" : "image/jpeg"}">`,
        `<meta property="og:image:alt" content="${cleanTitle}">`,
        `<meta property="og:locale" content="${isEn ? "en_US" : "es_ES"}">`,
        `<meta property="og:locale:alternate" content="${isEn ? "es_ES" : "en_US"}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:site" content="@GelabertHomes">`,
        `<meta name="twitter:title" content="${cleanTitle} | Gelabert Homes">`,
        `<meta name="twitter:description" content="${cleanDesc}">`,
        `<meta name="twitter:image" content="${previewImage}">`,
        `<meta name="twitter:image:alt" content="${cleanTitle}">`,
        `<link rel="alternate" hrefLang="es" href="https://gelaberthomes.es${routeType === "propiedades" ? "/propiedades/" : "/blog/"}${identifier}">`,
        `<link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/${routeType === "propiedades" ? "propiedades" : "blog"}/${identifier}">`,
        `<link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es${routeType === "propiedades" ? "/propiedades/" : "/blog/"}${identifier}">`,
        ...jsonLds.map(ld => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
      ];

      // Remove existing tags to avoid duplicates
      html = html.replace(/<title>[\s\S]*?<\/title>/gi, "");
      html = html.replace(/<meta [^>]*property=["']og:[^"']*["'][^>]*>/gi, "");
      html = html.replace(/<meta [^>]*name=["']twitter:[^"']*["'][^>]*>/gi, "");
      html = html.replace(/<meta [^>]*name=["']description["'][^>]*>/gi, "");
      html = html.replace(/<link [^>]*rel=["'](canonical|image_src|alternate)["'][^>]*>/gi, "");
      html = html.replace(/<script type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");

      // Update lang attribute
      html = html.replace(/<html([^>]*)lang=["'][^"']*["']([^>]*)>/i, `<html$1lang="${isEn ? "en" : "es"}"$2>`);
      if (!html.includes(" lang=")) {
        html = html.replace(/<html/i, `<html lang="${isEn ? "en" : "es"}"`);
      }

      html = html.replace(/<head>/i, `<head>\n    ${tags.join("\n    ")}`);
      xDebug += `|desc:${cleanDesc.slice(0, 20)}...`;
    }

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "x-meta-injected": dbData ? "true" : "false",
        "x-debug": xDebug,
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("Edge function crash:", err);
    return;
  }
};
