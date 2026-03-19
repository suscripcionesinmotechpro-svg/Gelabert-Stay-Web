import { Context } from "https://edge.netlify.com";

const SUPABASE_URL = "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

// Converts a Supabase Storage URL to use the render/image API for optimized previews.
// Social scrapers (WhatsApp, etc.) work best with images < 300KB and well-defined dimensions.
function optimizeSupabaseImage(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return "";
  // Only transform if it's a Supabase storage URL
  if (rawUrl.includes("supabase.co") && rawUrl.includes("/object/public/")) {
    const base = rawUrl.split("?")[0]; // strip existing query params
    return base.replace("/object/public/", "/render/image/public/") + "?width=1200&height=630&resize=contain&quality=80";
  }
  // For non-Supabase images, return as-is (but strip any old cache params first)
  return rawUrl.split("?")[0];
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Pattern to capture property reference/ID
  // Matches /propiedades/REF and /en/propiedades/REF
  const match = path.match(/^\/(?:en\/)?propiedades\/([^\\/]+)/);
  if (!match) return;

  const rawIdentifier = match[1];
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
    const possibleRefs = [searchId];
    if (searchId.includes("-")) {
      possibleRefs.push(searchId.replace("-", ""));
      possibleRefs.push(searchId.replace("-", " "));
    } else if (searchId.startsWith("GEL") && searchId.length > 3) {
      const numPart = searchId.substring(3);
      if (/^\d+$/.test(numPart)) {
        possibleRefs.push(`GEL-${numPart}`);
      }
    }

    const orConditions = isUuid
      ? `reference.eq.${searchId},slug.eq.${searchId},id.eq.${searchId}`
      : `reference.in.(${possibleRefs.join(",")}),slug.eq.${searchId},reference.ilike.${searchId},slug.ilike.${searchId}`;

    const queryUrl = `${SUPABASE_URL}/rest/v1/properties?or=(${orConditions})&select=*`;

    const dbResponse = await fetch(queryUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
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
      // ── Language / Translation ──
      const translateText = async (text: string, to: string) => {
        if (!text || to === "es") return text;
        try {
          const tUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(tUrl);
          if (res.ok) {
            const data = await res.json();
            return data[0].map((item: any) => item[0]).join("");
          }
        } catch (e) {
          console.error("Translation fail", e);
        }
        return text;
      };

      let title = "";
      if (isEn) {
        title = prop.title_en || prop.meta_title_en || (await translateText(prop.meta_title || prop.title, "en"));
      } else {
        title = prop.meta_title || prop.title;
      }
      title = (title || "Propiedad").trim();

      // ── Type / Operation labels ──
      const typeLabels: Record<string, { es: string; en: string }> = {
        piso:    { es: "Piso",     en: "Apartment" },
        casa:    { es: "Casa",     en: "House" },
        atico:   { es: "Ático",    en: "Penthouse" },
        estudio: { es: "Estudio",  en: "Studio" },
        loft:    { es: "Loft",     en: "Loft" },
        local:   { es: "Local",    en: "Commercial Premises" },
        oficina: { es: "Oficina",  en: "Office" },
        nave:    { es: "Nave",     en: "Industrial Warehouse" },
        terreno: { es: "Terreno",  en: "Land" },
        negocio: { es: "Negocio",  en: "Business" },
        otro:    { es: "Propiedad",en: "Property" },
      };

      const type = prop.property_type || "otro";
      const typeLabel = isEn
        ? typeLabels[type]?.en || typeLabels.otro.en
        : typeLabels[type]?.es || typeLabels.otro.es;

      let opLabel = "";
      if (prop.operation === "alquiler") opLabel = isEn ? "Rent" : "Alquiler";
      else if (prop.operation === "venta")   opLabel = isEn ? "Sale" : "Venta";
      else if (prop.operation === "traspaso") opLabel = isEn ? "Transfer" : "Traspaso";

      const features: string[] = [];
      if (opLabel && typeLabel) features.push(`${opLabel} ${typeLabel}`);
      if (prop.city) features.push(prop.city);

      if (prop.price) {
        const formatter = new Intl.NumberFormat(isEn ? "en-US" : "es-ES", {
          style: "currency",
          currency: prop.currency || "EUR",
          maximumFractionDigits: 0,
        });
        const formattedPrice = formatter.format(prop.price);
        const feeLabel = prop.operation === "alquiler" ? (isEn ? "/month" : "/mes") : "";
        features.push(`${formattedPrice}${feeLabel}`);
      }

      if (typeof prop.area_m2 === "number" && prop.area_m2 > 0) features.push(`${prop.area_m2} m²`);
      if (typeof prop.bedrooms === "number" && prop.bedrooms > 0) features.push(`${isEn ? "Bedrooms" : "Hab."} ${prop.bedrooms}`);
      if (typeof prop.bathrooms === "number" && prop.bathrooms > 0) features.push(`${isEn ? "Bath." : "Baños"} ${prop.bathrooms}`);

      if (prop.floor && String(prop.floor).trim() !== "") {
        const floorVal = String(prop.floor).trim();
        const hasSymbol = floorVal.includes("º") || floorVal.includes("ª");
        features.push(`${isEn ? "Floor" : "Planta"} ${floorVal}${!hasSymbol && /^\d+$/.test(floorVal) ? "º" : ""}`);
      }

      if (prop.orientation) {
        let orient = "";
        if (Array.isArray(prop.orientation)) {
          const oLabels: Record<string, string> = isEn
            ? { N: "N", S: "S", E: "E", O: "W", W: "W", Norte: "North", Sur: "South", Este: "East", Oeste: "West" }
            : { N: "N", S: "S", E: "E", O: "O", W: "O", North: "Norte", South: "Sur", East: "Este", West: "Oeste" };
          orient = prop.orientation.map((o: string) => oLabels[o] || o).join(", ");
        } else {
          orient = String(prop.orientation);
        }
        if (orient.trim() !== "") features.push(`${isEn ? "Orientation" : "Orientación"} ${orient}`);
      }

      let description = features.join(" · ");
      const extraDesc = isEn
        ? prop.short_description_en || prop.meta_description_en || prop.short_description
        : prop.short_description || prop.meta_description;
      if (extraDesc) description += ` | ${extraDesc}`;
      description = description.trim() || title || "Gelabert Homes Real Estate";

      // ── Image logic — GUARANTEED for all properties ──
      // Priority: main_image → gallery[0] → sharing-logo.jpg (not logo.png which is square/tiny)
      const siteFallback = "https://gelaberthomes.es/sharing-logo.jpg";

      let rawImage = "";
      if (prop.main_image && prop.main_image.trim()) {
        rawImage = prop.main_image.trim();
      } else if (prop.gallery && Array.isArray(prop.gallery) && prop.gallery.length > 0) {
        // Get first non-empty gallery image
        const firstGallery = prop.gallery.find((img: string) => img && img.trim());
        rawImage = firstGallery ? firstGallery.trim() : "";
      }

      // Apply Supabase render API for optimization (WhatsApp/social scrapers prefer <300KB)
      const previewImage = rawImage ? optimizeSupabaseImage(rawImage) : siteFallback;

      xDebug += `|img:${rawImage ? "property" : "fallback"}`;

      // ── Clean & sanitize ──
      const cleanTitle = (title || "").replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();
      const cleanDesc = (description || "").slice(0, 160).replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();
      const canonicalUrl = `https://gelaberthomes.es${isEn ? "/en" : ""}/propiedades/${prop.reference || prop.slug || prop.id}`;

      // Structured data for Google Rich Results
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": ["RealEstateListing"],
        name: cleanTitle,
        description: cleanDesc,
        image: previewImage,
        url: canonicalUrl,
        offers: {
          "@type": "Offer",
          price: prop.price,
          priceCurrency: prop.currency || "EUR",
          availability: "https://schema.org/InStock",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: prop.city || "Málaga",
          addressRegion: "Andalucía",
          addressCountry: "ES",
        },
        ...(prop.bedrooms > 0 ? { numberOfRooms: prop.bedrooms } : {}),
        ...(prop.bathrooms > 0 ? { numberOfBathroomsTotal: prop.bathrooms } : {}),
        ...(prop.area_m2 ? { floorSize: { "@type": "QuantitativeValue", value: prop.area_m2, unitCode: "MTK" } } : {}),
      };

      const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: "https://gelaberthomes.es/" },
          { "@type": "ListItem", position: 2, name: "Propiedades", item: "https://gelaberthomes.es/propiedades/" },
          { "@type": "ListItem", position: 3, name: cleanTitle, item: canonicalUrl },
        ],
      };

      // ── Aggressive cleaning of existing tags ──
      html = html.replace(/<title>[\s\S]*?<\/title>/gi, "");
      html = html.replace(/<meta [^>]*property=["']og:[^"']*["'][^>]*>/gi, "");
      html = html.replace(/<meta [^>]*name=["']twitter:[^"']*["'][^>]*>/gi, "");
      html = html.replace(/<meta [^>]*name=["']description["'][^>]*>/gi, "");
      html = html.replace(/<meta [^>]*name=["']keywords["'][^>]*>/gi, "");
      html = html.replace(/<link [^>]*rel=["'](canonical|image_src)["'][^>]*>/gi, "");
      // Remove any existing JSON-LD from index.html
      html = html.replace(/<script type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");

      const keywordList = isEn
        ? `${typeLabel}, ${prop.operation === "alquiler" ? "rent" : "sale"} in Malaga, Costa del Sol real estate, Gelabert Homes`
        : `${typeLabel} en ${prop.city || "Málaga"}, ${opLabel} en Málaga, inmobiliaria Costa del Sol, Gelabert Homes`;

      const tags = [
        `<title>${cleanTitle} | Gelabert Homes</title>`,
        `<meta name="description" content="${cleanDesc}">`,
        `<meta name="keywords" content="${keywordList}">`,
        `<meta name="robots" content="index, follow">`,
        `<link rel="canonical" href="${canonicalUrl}">`,
        // Open Graph
        `<meta property="og:site_name" content="Gelabert Homes Real Estate">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:url" content="${canonicalUrl}">`,
        `<meta property="og:title" content="${cleanTitle} | Gelabert Homes">`,
        `<meta property="og:description" content="${cleanDesc}">`,
        `<meta property="og:locale" content="${isEn ? "en_US" : "es_ES"}">`,
        `<meta property="og:image" content="${previewImage}">`,
        `<meta property="og:image:secure_url" content="${previewImage}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:image:type" content="image/jpeg">`,
        `<meta property="og:image:alt" content="${cleanTitle}">`,
        // Twitter / X
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${cleanTitle} | Gelabert Homes">`,
        `<meta name="twitter:description" content="${cleanDesc}">`,
        `<meta name="twitter:image" content="${previewImage}">`,
        `<meta name="twitter:image:alt" content="${cleanTitle}">`,
        // Schema.org itemprop (Google+)
        `<meta itemprop="name" content="${cleanTitle}">`,
        `<meta itemprop="description" content="${cleanDesc}">`,
        `<meta itemprop="image" content="${previewImage}">`,
        // Link previews
        `<link rel="image_src" href="${previewImage}">`,
        // hreflang
        `<link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/propiedades/${prop.reference || prop.slug || prop.id}">`,
        `<link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/propiedades/${prop.reference || prop.slug || prop.id}">`,
        `<link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/propiedades/${prop.reference || prop.slug || prop.id}">`,
        // Structured data
        `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
        `<script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>`,
      ];

      html = html.replace(/<head>/i, `<head>\n    ${tags.join("\n    ")}`);

      xDebug += `|desc:${cleanDesc.slice(0, 20)}...`;
    }

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "x-meta-injected": prop ? "true" : "false",
        "x-meta-version": "5.0",
        "x-debug": xDebug,
        "x-prop-id": searchId,
        // Don't cache at CDN edge so images update immediately when property is edited
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Edge function crash:", err);
    return;
  }
};
