import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const INDEX_HTML = path.resolve(DIST_DIR, 'index.html');
const PROPERTIES_DIR = path.resolve(DIST_DIR, 'propiedades');
const EN_PROPERTIES_DIR = path.resolve(DIST_DIR, 'en', 'propiedades');

// Configuración de Supabase
const SUPABASE_URL = "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, " ");
}

async function translateText(text) {
  if (!text || typeof text !== 'string') return "";
  if (text.length < 3) return text;
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join("");
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

async function generateStaticPreviews() {
  console.log('🚀 Generando previsualizaciones profesionales bilingües con traducción automática...');

  // Limpiar directorios
  [PROPERTIES_DIR, path.resolve(DIST_DIR, 'en')].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
  });
  fs.mkdirSync(EN_PROPERTIES_DIR, { recursive: true });

  if (!fs.existsSync(INDEX_HTML)) {
    console.error('❌ Error: index.html no encontrado en dist/.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(INDEX_HTML, 'utf-8');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
    
    const properties = await response.json();
    console.log(`🏠 Procesando ${properties.length} propiedades (ES & EN)...`);

    for (const prop of properties) {
      // --- Versión ESPAÑOL ---
      const titleEs = escapeHtml(prop.title);
      const featuresEs = [];
      if (prop.area_m2) featuresEs.push(`${prop.area_m2} m²`);
      if (prop.bedrooms) featuresEs.push(`${prop.bedrooms} hab.`);
      if (prop.bathrooms) featuresEs.push(`${prop.bathrooms} baños`);
      if (prop.floor) featuresEs.push(`Planta ${prop.floor}`);
      if (prop.availability) featuresEs.push(`Disp: ${prop.availability}`);
      
      const descEs = escapeHtml(featuresEs.join(' • ') || prop.description?.slice(0, 150) || "Gelabert Homes Real Estate | Málaga & Costa del Sol.");
      
      const htmlEs = buildPropHtml(baseHtml, titleEs, descEs, prop, 'es');
      savePropHtml(htmlEs, prop, PROPERTIES_DIR);

      // --- Versión INGLÉS ---
      // Traducir título si no existe título_en
      let rawTitleEn = prop.title_en;
      if (!rawTitleEn || rawTitleEn.trim() === "") {
        console.log(`  [TR] Traduciendo título: ${prop.title.slice(0, 20)}...`);
        rawTitleEn = await translateText(prop.title);
      }
      
      const titleEn = escapeHtml(rawTitleEn);
      const featuresEn = [];
      if (prop.area_m2) featuresEn.push(`${prop.area_m2} sqm`);
      if (prop.bedrooms) featuresEn.push(`${prop.bedrooms} beds`);
      if (prop.bathrooms) featuresEn.push(`${prop.bathrooms} baths`);
      if (prop.floor) featuresEn.push(`Floor ${prop.floor}`);
      
      // Traducir disponibilidad si existe
      if (prop.availability) {
        let availEn = prop.availability;
        if (availEn.toLowerCase() === 'inmediata') availEn = 'Immediate';
        else if (availEn.toLowerCase() === 'a convenir') availEn = 'To be agreed';
        else if (availEn.toLowerCase() === 'mayo 2024') availEn = 'May 2024'; // Ejemplo del usuario
        else {
          availEn = await translateText(prop.availability);
        }
        featuresEn.push(`Avail: ${availEn}`);
      }
      
      let rawDescEn = prop.description_en;
      if (!rawDescEn || rawDescEn.trim() === "") {
        // Para el meta description, usamos los features o traducimos una parte del texto
        rawDescEn = featuresEn.join(' • ') || await translateText(prop.description?.slice(0, 150));
      } else {
        rawDescEn = escapeHtml(rawDescEn.slice(0, 160));
      }
      
      const descEn = escapeHtml(rawDescEn || "Gelabert Homes Real Estate | Malaga & Costa del Sol.");
      
      const htmlEn = buildPropHtml(baseHtml, titleEn, descEn, prop, 'en');
      savePropHtml(htmlEn, prop, EN_PROPERTIES_DIR);
    }

    // --- Generación de Sitemap Dinámico Bilingüe ---
    generateSitemap(properties);

    console.log('✅ Previsualizaciones Bilingües generadas correctamente.');
  } catch (error) {
    console.error('❌ Error generando previsualizaciones:', error);
  }
}

function buildPropHtml(baseHtml, title, description, prop, lang) {
  let mainImage = prop.main_image || "";
  
  if (!mainImage) {
    // Si no hay imagen principal, intentamos coger la primera de la galería
    if (prop.gallery && prop.gallery.length > 0) {
      mainImage = prop.gallery[0];
    } else {
      mainImage = "https://gelaberthomes.es/logo.png";
    }
  }

  // No usamos Image Transformation (render/image/public) ya que es de pago y el proyecto tiene plan Gratis.
  // Usamos la URL pública directa con un timestamp para evitar caché agresiva.
  const cacheBuster = `t=${Date.now()}`;
  const previewImage = mainImage.includes('?') 
    ? `${mainImage}&${cacheBuster}` 
    : `${mainImage}?${cacheBuster}`;

  // Logging para depuración en el build
  if (!prop.main_image) {
    console.log(`  [WARN] Propiedad ${prop.reference || prop.id} no tiene imagen principal. Usando: ${previewImage.slice(0, 50)}...`);
  }

  const langPrefix = lang === 'en' ? '/en' : '';
  // Usamos URL con slash final para mejorar compatibilidad con algunos scrapers
  const siteUrl = `https://gelaberthomes.es${langPrefix}/propiedades/${prop.reference || prop.id}/`;
  
  let propHtml = baseHtml;
  
  // Inyectar atributo lang y prefix en el HTML para máxima compatibilidad
  propHtml = propHtml.replace('<html lang="es"', `<html lang="${lang}" prefix="og: http://ogp.me/ns#"`);

  // Lista de etiquetas meta para inyectar AL PRINCIPIO del <head>
  const metaTags = [
    { name: 'description', content: description },
    // Google / Schema.org
    { itemprop: 'name', content: `${title} | Gelabert Homes` },
    { itemprop: 'description', content: description },
    { itemprop: 'image', content: previewImage },
    // Open Graph / Facebook
    { property: 'og:title', content: `${title} | Gelabert Homes` },
    { property: 'og:description', content: description },
    { property: 'og:image', content: previewImage },
    { property: 'og:image:secure_url', content: previewImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:type', content: 'image/jpeg' },
    { property: 'og:image:alt', content: title },
    { property: 'og:url', content: siteUrl },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'Gelabert Homes Real Estate' },
    { property: 'og:locale', content: lang === 'en' ? 'en_US' : 'es_ES' },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: `${title} | Gelabert Homes` },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: previewImage },
    { name: 'twitter:image:alt', content: title }
  ];

  // Actualizar el título
  propHtml = propHtml.replace(/<title>.*?<\/title>/i, `<title>${title} | Gelabert Homes</title>`);
  
  // Inyectar etiquetas meta al principio del head (justo después de <head>)
  // Esto es crucial para scrapers que solo leen los primeros bytes del archivo
  let metaHtml = '\n';
  for (const tag of metaTags) {
    const attrName = tag.property ? 'property' : (tag.itemprop ? 'itemprop' : 'name');
    const attrValue = tag.property || tag.itemprop || tag.name;
    
    // Eliminar si ya existe una etiqueta con ese nombre/propiedad para evitar duplicados
    const existingRegex = new RegExp(`<meta[^>]+(?:name|property|itemprop)=["']${attrValue}["'][^>]*>`, 'gi');
    propHtml = propHtml.replace(existingRegex, '');
    
    metaHtml += `    <meta ${attrName}="${attrValue}" content="${tag.content}" />\n`;
  }

  // Etiquetas adicionales fijas, de formato o legacy
  metaHtml += `    <meta property="og:image:width" content="1200" />\n`;
  metaHtml += `    <meta property="og:image:height" content="630" />\n`;
  metaHtml += `    <meta property="og:image:type" content="image/jpeg" />\n`;
  metaHtml += `    <link rel="image_src" href="${previewImage}" />\n`;
  metaHtml += `    <link rel="canonical" href="${siteUrl}" />\n`;

  // Inyectar todo al principio del head
  propHtml = propHtml.replace('<head>', `<head>${metaHtml}`);
  
  return propHtml;
}

function savePropHtml(html, prop, baseDir) {
  // 1. Por REFERENCIA
  if (prop.reference) {
    const refDir = path.join(baseDir, prop.reference.toString());
    if (!fs.existsSync(refDir)) fs.mkdirSync(refDir, { recursive: true });
    fs.writeFileSync(path.join(refDir, 'index.html'), html);
  }

  // 2. Por ID
  const idDir = path.join(baseDir, prop.id);
  if (!fs.existsSync(idDir)) fs.mkdirSync(idDir, { recursive: true });
  fs.writeFileSync(path.join(idDir, 'index.html'), html);

  // 3. Por SLUG
  if (prop.slug) {
    const slugDir = path.join(baseDir, prop.slug);
    if (!fs.existsSync(slugDir)) fs.mkdirSync(slugDir, { recursive: true });
    fs.writeFileSync(path.join(slugDir, 'index.html'), html);
  }
}

function generateSitemap(properties) {
  const routes = ['', '/propiedades', '/servicios', '/propietarios', '/contacto'];
  const sitemapEntries = [];
  const now = new Date().toISOString().split('T')[0];

  // Rutas base ES y EN
  routes.forEach(r => {
    sitemapEntries.push({ loc: `https://gelaberthomes.es${r}`, priority: r === '' ? '1.0' : '0.8', lastmod: now });
    sitemapEntries.push({ loc: `https://gelaberthomes.es/en${r}`, priority: r === '' ? '0.9' : '0.7', lastmod: now });
  });

  // Rutas de propiedades ES y EN
  for (const prop of properties) {
    const lastmod = (prop.updated_at || now).split('T')[0];
    const ref = prop.reference || prop.id;
    sitemapEntries.push({ loc: `https://gelaberthomes.es/propiedades/${ref}`, priority: '0.6', lastmod });
    sitemapEntries.push({ loc: `https://gelaberthomes.es/en/propiedades/${ref}`, priority: '0.6', lastmod });
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.resolve(DIST_DIR, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.resolve(ROOT_DIR, 'public', 'sitemap.xml'), sitemapXml);
  console.log('✅ Sitemap.xml bilingüe actualizado.');
}

generateStaticPreviews();
