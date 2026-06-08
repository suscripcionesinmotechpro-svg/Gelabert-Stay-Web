import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Watermark colors and labels per commercial status ──────────────────────────
const WATERMARK_CONFIG: Record<string, { label_es: string; label_en: string; color: string }> = {
  reservado:  { label_es: 'RESERVADO',  label_en: 'RESERVED',  color: '#F97316' }, // orange
  alquilado:  { label_es: 'ALQUILADO',  label_en: 'RENTED',    color: '#8B5CF6' }, // violet
  vendido:    { label_es: 'VENDIDO',    label_en: 'SOLD',       color: '#EF4444' }, // red
  traspasado: { label_es: 'TRASPASADO', label_en: 'TRANSFERRED',color: '#3B82F6' }, // blue
}

// ── Build copy text for Facebook/Instagram post ────────────────────────────────
function buildPostCopy(prop: any, isEn: boolean): string {
  const lines: string[] = []

  // ── 1. HEADER: Property type + operation ─────────────────────────────────────
  const typeEmojis: Record<string, string> = {
    piso: '🏢', casa: '🏡', atico: '✨', loft: '🎨', estudio: '🏠',
    local: '🏪', oficina: '💼', nave: '🏭', terreno: '🌳', negocio: '💰', otro: '🏠',
  }
  const typeLabels: Record<string, { es: string; en: string }> = {
    piso:    { es: 'Piso',            en: 'Apartment' },
    casa:    { es: 'Casa',            en: 'House' },
    atico:   { es: 'Ático',           en: 'Penthouse' },
    loft:    { es: 'Loft',            en: 'Loft' },
    estudio: { es: 'Estudio',         en: 'Studio' },
    local:   { es: 'Local Comercial', en: 'Commercial Space' },
    oficina: { es: 'Oficina',         en: 'Office' },
    nave:    { es: 'Nave Industrial',  en: 'Industrial Unit' },
    terreno: { es: 'Terreno',         en: 'Land Plot' },
    negocio: { es: 'Negocio',         en: 'Business' },
    otro:    { es: 'Inmueble',        en: 'Property' },
  }
  const opLabels: Record<string, { es: string; en: string }> = {
    venta:    { es: 'En Venta',    en: 'For Sale' },
    alquiler: { es: 'En Alquiler', en: 'For Rent' },
    traspaso: { es: 'Traspaso',    en: 'Business Transfer' },
  }
  const rentTypeLabels: Record<string, string> = {
    temporal:     '🗓️ Alquiler Temporal',
    habitual:     '🏠 Alquiler Habitual',
    vacacional:   '☀️ Alquiler Vacacional',
    habitaciones: '🚪 Alquiler de Habitaciones',
    otros:        '📋 Alquiler',
  }

  const emoji     = typeEmojis[prop.property_type] || '🏠'
  const typeLabel = isEn
    ? (typeLabels[prop.property_type]?.en || 'Property')
    : (typeLabels[prop.property_type]?.es || 'Inmueble')
  const opLabel = isEn
    ? (opLabels[prop.operation]?.en || '')
    : (opLabels[prop.operation]?.es || '')

  lines.push(`${emoji} ${typeLabel}${opLabel ? ' — ' + opLabel : ''}`)
  lines.push('')

  // ── 2. TITLE ─────────────────────────────────────────────────────────────────
  const title = isEn ? (prop.title_en || prop.title) : prop.title
  if (title) lines.push(title)

  // ── 3. LOCATION ──────────────────────────────────────────────────────────────
  const locationParts = [prop.urbanization, prop.zone, prop.city].filter(Boolean)
  if (locationParts.length > 0) lines.push(`📍 ${locationParts.join(', ')}`)


  if (prop.orientation && typeof prop.orientation === 'string') {
    const orientMap: Record<string, string> = {
      norte: 'Norte ↑', sur: 'Sur ↓', este: 'Este →', oeste: 'Oeste ←',
      noreste: 'Noreste ↗', noroeste: 'Noroeste ↖', sureste: 'Sureste ↘', suroeste: 'Suroeste ↙',
    }
    const orientLabel = orientMap[prop.orientation.toLowerCase()] || prop.orientation
    lines.push(`🧭 Orientación ${orientLabel}`)
  }

  lines.push('')

  // ── 4. PRICE ─────────────────────────────────────────────────────────────────
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: prop.currency || 'EUR', maximumFractionDigits: 0 }).format(n)

  if (prop.price) {
    let priceStr = fmt(prop.price)
    if (prop.operation === 'alquiler') priceStr += '/mes'
    if (prop.max_price && prop.max_price > prop.price) priceStr += ` – ${fmt(prop.max_price)}/mes`
    lines.push(`💰 ${priceStr}`)

    if (prop.operation === 'venta') {
      const costs: string[] = []
      if (prop.community_fees)     costs.push(`Comunidad: ${fmt(prop.community_fees)}/mes`)
      if (prop.ibi)                costs.push(`IBI: ${fmt(prop.ibi)}/año`)
      if (prop.has_parking) {
        if (prop.parking_included)   costs.push('Parking incluido ✔️')
        else if (prop.parking_price) costs.push(`Parking: ${fmt(prop.parking_price)}`)
      }
      if (costs.length > 0) lines.push(`   └ ${costs.join(' · ')}`)
    }

    if (prop.operation === 'alquiler') {
      const rentCosts: string[] = []
      if (prop.has_parking) {
        if (prop.parking_included)   rentCosts.push('Parking incluido ✔️')
        else if (prop.parking_price) rentCosts.push(`Parking: ${fmt(prop.parking_price)}/mes`)
      }
      if (rentCosts.length > 0) lines.push(`   └ ${rentCosts.join(' · ')}`)
    }
  }

  // ── 5. KEY FEATURES (adapted per property type) ───────────────────────────────
  const residential = ['piso', 'casa', 'atico', 'loft', 'estudio']
  const commercial  = ['local', 'oficina', 'nave']
  const feats: string[] = []

  if (residential.includes(prop.property_type)) {
    if (prop.area_m2)       feats.push(`📐 ${prop.area_m2} m²`)
    if (prop.bedrooms > 0)  feats.push(`🛏 ${prop.bedrooms} ${isEn ? 'bed.' : 'hab.'}`)
    if (prop.bathrooms > 0) feats.push(`🚿 ${prop.bathrooms} ${isEn ? 'bath.' : 'baños'}`)
    if (prop.floor)         feats.push(`🏢 ${isEn ? 'Floor' : 'Planta'} ${prop.floor}`)
    if (prop.has_elevator)  feats.push(`🛗 ${isEn ? 'Lift' : 'Ascensor'}`)
    if (prop.is_furnished)  feats.push(`🛋 ${isEn ? 'Furnished' : 'Amueblado'}`)
    if (prop.is_exterior)   feats.push(`🌤 Exterior`)
    if (prop.has_terrace)   feats.push(`🌿 ${isEn ? 'Terrace' : 'Terraza'}`)
    if (prop.has_balcony)   feats.push(`🪟 ${isEn ? 'Balcony' : 'Balcón'}`)
  } else if (commercial.includes(prop.property_type)) {
    if (prop.area_m2)   feats.push(`📐 ${prop.area_m2} m²`)
    if (prop.floor)     feats.push(`🏢 ${isEn ? 'Floor' : 'Planta'} ${prop.floor}`)
    if (prop.has_elevator) feats.push(`🛗 ${isEn ? 'Lift' : 'Ascensor'}`)
    const state = prop.conservation_state || prop.property_condition
    if (state)          feats.push(`✅ ${state}`)
  } else if (prop.property_type === 'terreno') {
    if (prop.area_m2)   feats.push(`📐 ${prop.area_m2} m²`)
  } else if (prop.property_type === 'negocio') {
    if (prop.area_m2)      feats.push(`📐 ${prop.area_m2} m²`)
    if (prop.is_furnished) feats.push(`🛋 ${isEn ? 'Equipped' : 'Equipado'}`)
  } else {
    if (prop.area_m2)       feats.push(`📐 ${prop.area_m2} m²`)
    if (prop.bedrooms > 0)  feats.push(`🛏 ${prop.bedrooms} ${isEn ? 'bed.' : 'hab.'}`)
    if (prop.bathrooms > 0) feats.push(`🚿 ${prop.bathrooms} ${isEn ? 'bath.' : 'baños'}`)
  }

  if (feats.length > 0) {
    lines.push('')
    lines.push(feats.join('  ·  '))
  }

  // ── 6. PREMIUM AMENITIES ──────────────────────────────────────────────────────
  const premiumFeats: string[] = []
  if (prop.sea_views)        premiumFeats.push(`🌊 ${isEn ? 'Sea Views' : 'Vistas al mar'}`)
  if (prop.has_pool)         premiumFeats.push(`🏊 ${isEn ? 'Pool' : 'Piscina'}`)
  if (prop.garden)           premiumFeats.push(`🌳 ${isEn ? 'Garden' : 'Jardín'}`)
  if (prop.has_patio)        premiumFeats.push(`🌺 Patio`)
  if (prop.has_storage)      premiumFeats.push(`📦 ${isEn ? 'Storage room' : 'Trastero'}`)
  if (prop.air_conditioning) premiumFeats.push(`❄️ A/C`)
  if (prop.heating)          premiumFeats.push(`🔥 ${isEn ? 'Heating' : 'Calefacción'}`)
  if (prop.has_fireplace)    premiumFeats.push(`🪵 ${isEn ? 'Fireplace' : 'Chimenea'}`)
  if (prop.has_wardrobes)    premiumFeats.push(`🚪 ${isEn ? 'Built-in wardrobes' : 'Armarios empotrados'}`)
  if (prop.pets_allowed)     premiumFeats.push(`🐾 ${isEn ? 'Pets allowed' : 'Se admiten mascotas'}`)

  if (premiumFeats.length > 0) {
    lines.push('')
    lines.push(premiumFeats.join('  ·  '))
  }

  // ── 7. CURATED HIGHLIGHTS (from CRM) ─────────────────────────────────────────
  const hiList = isEn ? (prop.highlights_en || prop.highlights) : prop.highlights
  if (Array.isArray(hiList) && hiList.length > 0) {
    lines.push('')
    lines.push(isEn ? '✨ Key features:' : '✨ Puntos destacados:')
    hiList.slice(0, 4).forEach((h: string) => lines.push(`  → ${h}`))
  }

  // ── 8. SHORT DESCRIPTION ──────────────────────────────────────────────────────
  const shortDesc = isEn
    ? (prop.short_description_en || prop.short_description)
    : prop.short_description
  if (shortDesc) {
    lines.push('')
    const desc = shortDesc.trim()
    lines.push(desc.length > 220 ? desc.slice(0, 220).trimEnd() + '…' : desc)
  }

  // ── 9. RENT TYPE & AVAILABILITY ───────────────────────────────────────────────
  if (prop.operation === 'alquiler' && !isEn) {
    const rentInfo: string[] = []
    if (prop.rent_type && rentTypeLabels[prop.rent_type]) rentInfo.push(rentTypeLabels[prop.rent_type])
    if (rentInfo.length > 0) {
      lines.push('')
      lines.push(rentInfo.join('  ·  '))
    }
  }

  if (prop.availability) {
    lines.push('')
    lines.push(`📅 Disponibilidad: ${prop.availability}`)
  }

  // ── 10. ENERGY RATING (sale only) ────────────────────────────────────────────
  if (prop.operation === 'venta' && prop.energy_rating &&
      !['en tramite', 'en trámite', '-', ''].includes(prop.energy_rating.toLowerCase())) {
    lines.push('')
    lines.push(`⚡ ${isEn ? 'Energy rating' : 'Calificación energética'}: ${prop.energy_rating.toUpperCase()}`)
  }

  // ── 11. VIRTUAL TOUR ──────────────────────────────────────────────────────────
  if (prop.virtual_tour_url) {
    lines.push('')
    lines.push(`🎥 ${isEn ? 'Virtual tour' : 'Tour virtual'}: ${prop.virtual_tour_url}`)
  }

  // ── 12. CALL TO ACTION ────────────────────────────────────────────────────────
  const link = `https://gelaberthomes.es${isEn ? '/en' : ''}/propiedades/${prop.reference || prop.slug || prop.id}`
  lines.push('')
  lines.push(isEn ? `👉 Full listing: ${link}` : `👉 Ficha completa: ${link}`)
  lines.push(isEn ? `📞 Contact us to book a viewing` : `📞 Llámanos o escríbenos para una visita`)

  // ── 13. SMART HASHTAGS ────────────────────────────────────────────────────────
  lines.push('')
  const cityTag = prop.city ? `#${prop.city.replace(/\s+/g, '')}` : '#Málaga'
  const zoneTag = prop.zone ? `#${prop.zone.replace(/[\s\-]+/g, '')}` : ''
  const typeHashtags: Record<string, string> = {
    piso: '#Piso', casa: '#Casa', atico: '#Atico', loft: '#Loft', estudio: '#Estudio',
    local: '#LocalComercial', oficina: '#Oficina', nave: '#NaveIndustrial',
    terreno: '#Terreno', negocio: '#Traspaso', otro: '#Inmueble',
  }
  const opHashtags: Record<string, string> = {
    venta: '#EnVenta', alquiler: '#EnAlquiler', traspaso: '#Traspaso',
  }
  const specialTags: string[] = []
  if (prop.sea_views) specialTags.push('#VistasAlMar')
  if (prop.has_pool)  specialTags.push('#ConPiscina')
  if (prop.operation === 'alquiler' && prop.rent_type === 'vacacional') specialTags.push('#AlquilerVacacional')
  if (prop.operation === 'alquiler' && prop.rent_type === 'habitaciones') specialTags.push('#Habitaciones')

  const hashtags = [
    '#GelabertHomes', '#Inmobiliaria', '#RealEstate',
    opHashtags[prop.operation] || '',
    typeHashtags[prop.property_type] || '#Inmueble',
    cityTag, zoneTag,
    prop.operation === 'alquiler' ? '#AlquilerMalaga' : '#VentaMalaga',
    '#PropiedadesMalaga',
    ...specialTags,
  ].filter(Boolean).join(' ')

  lines.push(hashtags)

  return lines.join('\n')
}

// ── Helper to get SHA-256 hash of a string in Deno ───────────────────────────
async function getUrlHash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ── Helper to download image using Supabase render transformation if possible ──
async function fetchImageBuffer(imageUrl: string): Promise<Uint8Array | null> {
  const cleanUrl = imageUrl.trim().split('?')[0];
  
  // Try to use Supabase image transformation if it's a Supabase storage URL
  const supabaseStorageRegex = /https:\/\/([a-z0-9]+)\.supabase\.co\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/i;
  const match = cleanUrl.match(supabaseStorageRegex);
  if (match) {
    const projectId = match[1];
    const bucket = match[2];
    const path = match[3];
    const transformedUrl = `https://${projectId}.supabase.co/storage/v1/render/image/public/${bucket}/${path}?width=1200&resize=contain`;
    
    console.log(`[Media Sync] Attempting to fetch transformed image: ${transformedUrl}`);
    try {
      const res = await fetch(transformedUrl);
      if (res.ok) {
        return new Uint8Array(await res.arrayBuffer());
      }
      console.warn(`[Media Sync] Transformed image fetch failed (status ${res.status}), falling back to original URL.`);
    } catch (err) {
      console.warn(`[Media Sync] Transformed image fetch error, falling back to original URL:`, err);
    }
  }

  // Fallback to fetching the original URL
  console.log(`[Media Sync] Fetching original image: ${cleanUrl}`);
  const res = await fetch(cleanUrl);
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

// ── Download image and add a diagonal watermark banner ────────────────────────
async function createWatermarkedImageBuffer(imageUrl: string, statusKey: string): Promise<Uint8Array | null> {
  try {
    // Import imagescript — a pure Deno image processing library
    const { Image } = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
    
    const cfg = WATERMARK_CONFIG[statusKey]
    if (!cfg) return null

    // Download the source image
    const buf = await fetchImageBuffer(imageUrl)
    if (!buf) return null
    
    const img = await Image.decode(buf)

    // Resize to compact social dimensions (900x472) — saves ~44% memory vs 1200x630
    // Facebook/Instagram still renders these at full quality in feeds
    const targetW = 900
    const targetH = 472
    const resized = img.resize(targetW, targetH)

    // ── Draw diagonal banner ──
    // We draw a semi-transparent dark stripe across the center, rotated 45deg.
    // imagescript doesn't support rotation natively, so we draw a horizontal band
    // that gives a "stamp" feel across the image.
    const bannerH = Math.round(targetH * 0.22) // ~22% of height
    const bannerY = Math.round(targetH / 2 - bannerH / 2)

    // Parse hex color
    const r = parseInt(cfg.color.slice(1, 3), 16)
    const g = parseInt(cfg.color.slice(3, 5), 16)
    const b = parseInt(cfg.color.slice(5, 7), 16)
    const fillColor = Image.rgbaToColor(r, g, b, 210) // 82% opacity
    const darkOverlay = Image.rgbaToColor(0, 0, 0, 140) // dark bg behind text

    // Draw dark overlay band
    for (let y = bannerY; y < bannerY + bannerH; y++) {
      for (let x = 0; x < targetW; x++) {
        resized.setPixelAt(x + 1, y + 1, darkOverlay)
      }
    }

    // Draw colored top and bottom border lines of the band
    const borderH = Math.max(4, Math.round(bannerH * 0.06))
    for (let y = bannerY; y < bannerY + borderH; y++) {
      for (let x = 0; x < targetW; x++) {
        resized.setPixelAt(x + 1, y + 1, fillColor)
      }
    }
    for (let y = bannerY + bannerH - borderH; y < bannerY + bannerH; y++) {
      for (let x = 0; x < targetW; x++) {
        resized.setPixelAt(x + 1, y + 1, fillColor)
      }
    }

    // Draw the label text using imagescript's built-in font
    const label = cfg.label_es
    const fontSize = Math.round(bannerH * 0.55)
    await resized.drawText(label, {
      x: Math.round(targetW / 2 - (label.length * fontSize * 0.5) / 2),
      y: bannerY + Math.round(bannerH / 2 - fontSize / 2),
      size: fontSize,
      color: Image.rgbaToColor(255, 255, 255, 255),
    }).catch(() => {}) // Skip text if font fails — image will still have colored band

    return await resized.encode(1) // 1 = JPEG
  } catch (err) {
    console.error('Watermark error:', err)
    return null
  }
}

// ── Download image and add an elegant gold-striped label watermark tag ───────
async function createLabeledImageBuffer(imageUrl: string, label: string): Promise<Uint8Array | null> {
  try {
    const { Image } = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
    
    // Download the source image
    const buf = await fetchImageBuffer(imageUrl)
    if (!buf) return null
    
    const img = await Image.decode(buf)
    
    // Compact social dimensions (900x472) — saves ~44% memory vs 1200x630
    const targetW = 900
    const targetH = 472
    const resized = img.resize(targetW, targetH)
    
    // Rectangular badge at bottom-left corner with high-contrast borders
    const normalizedLabel = label.toUpperCase().trim()
    const fontSize = 22

    // Calculate precise badge width based on character widths to look perfectly balanced
    let textWidth = 0
    for (const char of normalizedLabel) {
      if (['I', '1', '.', ' ', '·', '-', '/'].includes(char)) {
        textWidth += fontSize * 0.38
      } else if (['M', 'W', 'O', 'Q', '0', '€'].includes(char)) {
        textWidth += fontSize * 0.82
      } else {
        textWidth += fontSize * 0.62
      }
    }

    const badgeW = Math.round(textWidth) + 32 // 16px padding on each side
    const badgeH = 50
    const paddingX = 30
    const paddingY = targetH - badgeH - 30 // 30px from bottom of the image
    
    const blackColor = Image.rgbaToColor(0, 0, 0, 255) // solid black for background
    const whiteColor = Image.rgbaToColor(255, 255, 255, 255) // solid white for text and border
    
    // Draw badge background (solid black) with a 2px solid white border for maximum contrast
    for (let y = paddingY; y < paddingY + badgeH; y++) {
      for (let x = paddingX; x < paddingX + badgeW; x++) {
        const isBorder = (y < paddingY + 2) || (y >= paddingY + badgeH - 2) || 
                         (x < paddingX + 2) || (x >= paddingX + badgeW - 2)
        if (isBorder) {
          resized.setPixelAt(x + 1, y + 1, whiteColor)
        } else {
          resized.setPixelAt(x + 1, y + 1, blackColor)
        }
      }
    }
    
    // Draw text inside badge (with 1px horizontal offset to simulate a bold font)
    const textX = paddingX + 16
    const textY = paddingY + Math.round(badgeH / 2 - fontSize / 2)

    await resized.drawText(normalizedLabel, {
      x: textX,
      y: textY,
      size: fontSize,
      color: whiteColor,
    }).catch(() => {})

    await resized.drawText(normalizedLabel, {
      x: textX + 1,
      y: textY,
      size: fontSize,
      color: whiteColor,
    }).catch(() => {})
    
    return await resized.encode(1) // JPEG
  } catch (err) {
    console.error('Labeling watermark error:', err)
    return null
  }
}

// ── Helper to resolve the label (room name/number and price) for a given image URL ──
function getLabelForImage(prop: any, imageUrl: string): { label: string | null } {
  const cleanUrl = imageUrl.trim().split('?')[0];

  // 1. Check if it's a room image
  if (prop.rooms && Array.isArray(prop.rooms)) {
    for (let roomIdx = 0; roomIdx < prop.rooms.length; roomIdx++) {
      const room = prop.rooms[roomIdx];
      const roomImages = Array.isArray(room.images) ? room.images : [];
      if (roomImages.some((img: string) => img && img.trim().split('?')[0] === cleanUrl)) {
        const roomNumber = roomIdx + 1;
        const roomLabel = (room.name && room.name.trim()) ? room.name.trim() : `HAB. ${roomNumber}`;
        const priceLabel = room.price ? ` - ${Math.round(room.price)}€` : '';
        return { label: `${roomLabel}${priceLabel}` };
      }
    }
  }

  // 2. Check if it's a common area image
  if (prop.common_areas && Array.isArray(prop.common_areas)) {
    for (const area of prop.common_areas) {
      const areaImages = Array.isArray(area.images) ? area.images : [];
      if (areaImages.some((img: string) => img && img.trim().split('?')[0] === cleanUrl)) {
        let label = 'ZONA COMÚN';
        if (area.name && area.name.trim()) {
          label = `Z. COMÚN: ${area.name.trim()}`;
        } else if (area.type) {
          label = `ZONA COMÚN: ${area.type.toUpperCase()}`;
        }
        return { label };
      }
    }
  }

  // 3. Check if property itself is of type 'habitacion' (individual room)
  if (prop.property_type === 'habitacion') {
    const priceLabel = prop.price ? ` - ${Math.round(prop.price)}€` : '';
    return { label: `HABITACIÓN${priceLabel}` };
  }

  return { label: null };
}

// ── Process, apply watermarks/labels, and upload to storage if needed ──
async function processAndWatermarkImage(
  prop: any,
  pid: string,
  supabase: any,
  imageUrl: string,
  isCover: boolean,
  needsCommercialWatermark: boolean
): Promise<string> {
  const cleanUrl = imageUrl.trim().split('?')[0];
  
  // 1. Cover with commercial status watermark (e.g. RESERVADO)
  if (isCover && needsCommercialWatermark && WATERMARK_CONFIG[prop.commercial_status]) {
    const status = prop.commercial_status;
    const urlHash = await getUrlHash(cleanUrl);
    const wmFileName = `watermarks/${pid}_${status}_${urlHash}.jpg`;
    
    // Get public URL first
    const { data: urlData } = supabase.storage.from('properties').getPublicUrl(wmFileName);
    const publicUrl = urlData.publicUrl;
    
    // Check if it already exists in Supabase storage
    try {
      const checkRes = await fetch(publicUrl, { method: 'HEAD' });
      if (checkRes.ok) {
        console.log(`[Media Sync] Cover commercial watermark already exists, reusing: ${publicUrl}`);
        return publicUrl;
      }
    } catch (err) {
      console.warn(`[Media Sync] HEAD check failed for cover watermark (will re-process):`, err);
    }
    
    console.log(`[Media Sync] Applying commercial watermark "${status}" to cover: ${cleanUrl}`);
    const wmBuffer = await createWatermarkedImageBuffer(cleanUrl, status);
    if (wmBuffer) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('properties')
        .upload(wmFileName, wmBuffer, { contentType: 'image/jpeg', upsert: true });
      if (!uploadError && uploadData) {
        return publicUrl;
      }
    }
    return cleanUrl;
  }

  // 2. Corner label watermark (rooms / common areas / individual room)
  const labelInfo = getLabelForImage(prop, cleanUrl);
  if (labelInfo && labelInfo.label) {
    const label = labelInfo.label;
    const urlHash = await getUrlHash(cleanUrl + '_' + label);
    const labelFileName = `labeled_images/${pid}_lbl_${urlHash}.jpg`;
    
    // Get public URL first
    const { data: urlData } = supabase.storage.from('properties').getPublicUrl(labelFileName);
    const publicUrl = urlData.publicUrl;
    
    // Check if it already exists in Supabase storage
    try {
      const checkRes = await fetch(publicUrl, { method: 'HEAD' });
      if (checkRes.ok) {
        console.log(`[Media Sync] Labeled image already exists, reusing: ${publicUrl}`);
        return publicUrl;
      }
    } catch (err) {
      console.warn(`[Media Sync] HEAD check failed for labeled image (will re-process):`, err);
    }
    
    console.log(`[Media Sync] Applying corner label "${label}" to: ${cleanUrl}`);
    const labeledBuffer = await createLabeledImageBuffer(cleanUrl, label);
    if (labeledBuffer) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('properties')
        .upload(labelFileName, labeledBuffer, { contentType: 'image/jpeg', upsert: true });
      if (!uploadError && uploadData) {
        return publicUrl;
      }
    }
  }

  return cleanUrl;
}

// ── Process a list of raw image URLs in batches to avoid WORKER_RESOURCE_LIMIT ──
// Each batch of BATCH_SIZE images is processed sequentially, then a short pause
// gives the Deno runtime time to garbage-collect before the next batch.
async function processImageUrlsInBatches(
  urls: string[], // validated http URLs, in order
  prop: any,
  pid: string,
  supabase: any,
  needsWatermark: boolean,
  coverIndex = 0,  // index in `urls` that should be treated as the cover
  batchSize = 5,
  pauseMs = 300,
): Promise<{ url: string; type: 'IMAGE' }[]> {
  const results: { url: string; type: 'IMAGE' }[] = []
  for (let i = 0; i < urls.length; i += batchSize) {
    if (i > 0) {
      // Short pause between batches so the GC can reclaim image buffers
      await new Promise(r => setTimeout(r, pauseMs))
    }
    const batch = urls.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j++) {
      const img = batch[j]
      const globalIdx = i + j
      const isCover = globalIdx === coverIndex
      const processed = await processAndWatermarkImage(prop, pid, supabase, img, isCover, needsWatermark)
      results.push({ url: processed, type: 'IMAGE' })
    }
    console.log(`[Media Sync] Batch ${Math.floor(i / batchSize) + 1} done (${Math.min(i + batchSize, urls.length)}/${urls.length} images)`)
  }
  return results
}

interface MediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
}

// ── Publish a video to a Facebook Page via /videos endpoint ───────────────────
async function publishVideoToFacebook(pageId: string, pageToken: string, message: string, videoUrl: string): Promise<{ postId: string | null; error: string | null }> {
  try {
    console.log(`[FB Video] Uploading video to Facebook page: ${videoUrl}`)
    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: videoUrl,
        description: message,
        access_token: pageToken,
      }),
    })
    const data = await res.json()
    console.log('[FB Video] Response:', JSON.stringify(data))
    if (data.id) return { postId: data.id, error: null }
    return { postId: null, error: data.error?.message || 'FB video upload error' }
  } catch (err: any) {
    return { postId: null, error: err.message }
  }
}

// ── Publish a post to a Facebook Page ─────────────────────────────────────────
async function publishToFacebook(pageId: string, pageToken: string, message: string, mediaItems: MediaItem[], existingPostId: string | null): Promise<{ postId: string | null; error: string | null }> {
  try {
    // Delete existing post first if we have one
    if (existingPostId) {
      await fetch(`https://graph.facebook.com/v20.0/${existingPostId}?access_token=${pageToken}`, { method: 'DELETE' })
        .catch(() => {}) // Ignore delete errors
    }

    // Facebook attached_media only supports photos — videos must be published separately
    const imageItems = mediaItems.filter(item => item.type === 'IMAGE')

    if (imageItems.length === 0) {
      return { postId: null, error: 'No images available for Facebook post' }
    }

    if (imageItems.length === 1) {
      const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageItems[0].url,
          caption: message,
          access_token: pageToken,
        }),
      })
      const data = await res.json()
      if (data.id) return { postId: data.id, error: null }
      return { postId: null, error: data.error?.message || 'FB single photo error' }
    } else {
      // Step 1: Upload photos as unpublished
      const photoIds: string[] = []
      for (const item of imageItems) {
        const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            published: 'false',
            access_token: pageToken,
          }),
        })
        const data = await res.json()
        if (data.id) {
          photoIds.push(data.id)
        } else {
          console.error('FB photo upload error:', data)
        }
      }

      if (photoIds.length === 0) {
        return { postId: null, error: 'Could not upload any photos to Facebook' }
      }

      // Step 2: Publish the feed post with attached_media
      const attachedMedia = photoIds.map(id => ({ media_fbid: id }))
      const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          attached_media: attachedMedia,
          access_token: pageToken,
        }),
      })
      const data = await res.json()
      if (data.id) return { postId: data.id, error: null }
      return { postId: null, error: data.error?.message || 'FB feed attached_media error' }
    }
  } catch (err: any) {
    return { postId: null, error: err.message }
  }
}

// ── Poll an IG media container until status is FINISHED or ERROR ────────────────
async function pollUntilReady(containerId: string, accessToken: string, maxWaitSec: number): Promise<string | null> {
  const maxIterations = Math.ceil(maxWaitSec / 3)
  for (let i = 0; i < maxIterations; i++) {
    // Wait 3 seconds between each poll
    await new Promise(r => setTimeout(r, 3000))
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${containerId}?fields=status_code,status&access_token=${accessToken}`
    )
    const data = await res.json()
    const status = data.status_code || data.status
    console.log(`[IG Poll] container=${containerId} status=${status} attempt=${i + 1}/${maxIterations}`)
    if (status === 'FINISHED') return null                        // ready to publish
    if (status === 'ERROR' || status === 'EXPIRED') {
      return data.status || `Container ${status} before publish`  // failed
    }
    // IN_PROGRESS or null → keep waiting
  }
  return `IG container not ready after ${maxWaitSec}s`
}

// ── Publish a post to Instagram (via Media Container + Publish) ────────────────
async function publishToInstagram(igAccountId: string, pageToken: string, caption: string, mediaItems: MediaItem[], existingPostId: string | null): Promise<{ postId: string | null; error: string | null }> {
  try {
    if (mediaItems.length === 0) {
      return { postId: null, error: 'No media items available for Instagram' }
    }

    if (mediaItems.length === 1) {
      const item = mediaItems[0]
      const body: Record<string, string> = {
        caption,
        access_token: pageToken,
      }
      if (item.type === 'VIDEO') {
        body.media_type = 'VIDEO'
        body.video_url = item.url
      } else {
        body.image_url = item.url
      }

      const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const container = await containerRes.json()
      if (!container.id) return { postId: null, error: container.error?.message || 'IG container error' }

      // Poll until container is FINISHED before publishing
      const pollErr = await pollUntilReady(container.id, pageToken, item.type === 'VIDEO' ? 90 : 30)
      if (pollErr) return { postId: null, error: pollErr }

      const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: pageToken,
        }),
      })
      const published = await publishRes.json()
      if (published.id) return { postId: published.id, error: null }
      return { postId: null, error: published.error?.message || 'IG publish error' }
    } else {
      // Step 1: Create a container for each item in the carousel and poll each one
      const childIds: string[] = []
      for (const item of mediaItems) {
        const body: Record<string, any> = {
          is_carousel_item: true,
          access_token: pageToken,
        }
        if (item.type === 'VIDEO') {
          body.media_type = 'VIDEO'
          body.video_url = item.url
        } else {
          body.image_url = item.url
        }

        const res = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (data.id) {
          // Poll each child container individually until it's FINISHED
          const pollErr = await pollUntilReady(data.id, pageToken, item.type === 'VIDEO' ? 90 : 30)
          if (pollErr) {
            console.error(`IG carousel child polling failed (skipping item): ${pollErr}`)
            continue // skip this item but continue with others
          }
          childIds.push(data.id)
        } else {
          console.error('IG carousel item container error:', data)
        }
      }

      if (childIds.length === 0) {
        return { postId: null, error: 'Could not create any carousel item containers' }
      }

      // Wait 5 seconds for processing of all carousel items
      await new Promise(r => setTimeout(r, 5000))

      // Step 2: Create the main carousel container
      const res = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          caption,
          access_token: pageToken,
        })
      })
      const data = await res.json()
      if (!data.id) {
        return { postId: null, error: data.error?.message || 'IG main carousel container error' }
      }

      await new Promise(r => setTimeout(r, 3000))

      // Step 3: Publish the carousel container
      const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: data.id,
          access_token: pageToken,
        }),
      })
      const published = await publishRes.json()
      if (published.id) return { postId: published.id, error: null }
      return { postId: null, error: published.error?.message || 'IG carousel publish error' }
    }
  } catch (err: any) {
    return { postId: null, error: err.message }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const {
      propertyId,
      action,       // 'publish_facebook' | 'unpublish_facebook' | 'publish_instagram' | 'unpublish_instagram'
      trigger,      // 'manual' | 'status_change' | 'auto' (from DB trigger)
      record,       // from DB trigger: the updated property record
      old_record,   // from DB trigger: previous record
      type,         // INSERT | UPDATE (from DB trigger)
      customCopy,   // Optional user-customized/AI-enhanced text for post copy
      customCopyFb, // Optional customized copy for Facebook
      customCopyIg, // Optional customized copy for Instagram
      selectedImages, // Optional: ordered array of image URLs chosen manually by the user in the modal
      includeVideo,   // Optional: boolean to include/exclude video (manual shares)
      customVideoUrl, // Optional: custom video URL (manual shares)
    } = payload

    if (action === 'enhance_copy') {
      const { text, tone, platform } = payload
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Falta la API Key de OpenAI en la configuración de Supabase.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }

      const prompt = `Eres un copywriter inmobiliario premium de élite para Gelabert Homes.
Tu tarea es tomar la siguiente descripción técnica de una propiedad y reescribirla para hacerla extremadamente atractiva, persuasiva y elegante para publicar en ${platform === 'instagram' ? 'Instagram (más visual, dinámico, con hashtags, invitando a ver el enlace en la bio)' : 'Facebook (más estructurado, formal y descriptivo)'}.

💥 REGLA DE ORO CRÍTICA Y ABSOLUTA (¡SÍGUELA SIEMPRE!):
- ¡NO TE INVENTES NINGÚN TIPO DE INFORMACIÓN! Queda terminantemente prohibido inventar servicios, calidades, comodidades, ubicaciones, distancias a puntos de interés, características físicas o cualquier otro dato que no esté explícitamente detallado en el texto original.
- Coge y extrae toda la información real de la propiedad provista, reestructurándola con elegancia, pero no añadas nada que sea fruto de la suposición o invención.

REGLAS DE FORMATO:
- Usa un tono ${tone || 'premium y sofisticado'}.
- Utiliza emojis estratégicos para hacer la lectura fluida y visualmente atractiva (sin saturar).
- Mantén toda la información verídica intacta (precio, características, ubicación).
- Asegúrate de que el enlace final de la propiedad permanezca inalterado al final de la publicación.
${platform === 'instagram' ? '- Añade una indicación clara que invite a los usuarios a pinchar en el enlace de nuestra biografía de Instagram (@gelaberthomes) para ver todos los detalles.' : ''}
- Añade hashtags elegantes e inmobiliarios al final del post.
- Conserva el idioma español.

TEXTO A OPTIMIZAR:
${text}`

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Eres un copywriter inmobiliario de lujo para Gelabert Homes.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        })
      })

      const aiData = await openAIResponse.json()
      if (aiData.error) {
        return new Response(JSON.stringify({ error: aiData.error.message || 'Error en OpenAI API' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        })
      }
      const enhancedText = aiData.choices?.[0]?.message?.content || text

      return new Response(JSON.stringify({ success: true, enhancedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // ── Resolve property ──────────────────────────────────────────────────────
    let prop: any = record
    let pid: string = propertyId || record?.id

    if (!prop && pid) {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', pid)
        .single()
      prop = data
    }

    if (!prop) {
      return new Response(JSON.stringify({ error: 'Property not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404
      })
    }

    pid = prop.id

    // ── Load credentials from Supabase secrets ────────────────────────────────
    const FB_PAGE_ID    = Deno.env.get('FACEBOOK_PAGE_ID')    || ''
    const FB_PAGE_TOKEN = Deno.env.get('FACEBOOK_PAGE_TOKEN') || ''
    const IG_ACCOUNT_ID = Deno.env.get('INSTAGRAM_ACCOUNT_ID')|| ''

    // ── Determine what changed (for DB trigger-based auto-sync) ──────────────
    const isStatusChange = type === 'UPDATE' && old_record &&
      old_record.commercial_status !== prop.commercial_status

    // ── Build list of media items (photos + videos + floor plans) ─────────────
    const mediaItems: MediaItem[] = []

    const needsWatermark = prop.commercial_status && prop.commercial_status !== 'disponible'

    if (selectedImages && Array.isArray(selectedImages) && selectedImages.length > 0) {
      // Filter valid URLs first
      const validSelected = selectedImages.filter((img: string) => img && img.trim().startsWith('http'))
      console.log(`[Media Sync] Using manually selected images (${validSelected.length} valid of ${selectedImages.length})`)

      // ── Insert the video BEFORE batch-processing so it lands right after the cover ──
      const useVideo = trigger === 'manual' ? (includeVideo !== false) : true;
      const rawVideo = trigger === 'manual' ? (customVideoUrl || prop.video_url) : prop.video_url;
      const hasVideo = useVideo && rawVideo && rawVideo.trim().startsWith('http') && rawVideo.toLowerCase().includes('.mp4')

      // Process images in batches of 5 to avoid WORKER_RESOURCE_LIMIT
      const processedImages = await processImageUrlsInBatches(
        validSelected, prop, pid, supabase, needsWatermark, 0, 5, 300
      )

      // Assemble mediaItems: cover → video → rest of images
      if (processedImages.length > 0) {
        mediaItems.push(processedImages[0]) // cover
        if (hasVideo) mediaItems.push({ url: rawVideo.trim(), type: 'VIDEO' })
        for (let k = 1; k < processedImages.length; k++) mediaItems.push(processedImages[k])
      }
    } else {
      // 1. Cover Image (main_image or first gallery image)
      const rawImage = prop.main_image || (prop.gallery && prop.gallery[0])
      if (rawImage) {
        const processedCover = await processAndWatermarkImage(prop, pid, supabase, rawImage, true, needsWatermark)
        mediaItems.push({ url: processedCover, type: 'IMAGE' })
      }

      // 2. Video (if direct mp4) - placed immediately after the cover image as requested by the user
      const useVideo = trigger === 'manual' ? (includeVideo !== false) : true;
      const rawVideo = trigger === 'manual' ? (customVideoUrl || prop.video_url) : prop.video_url;
      if (useVideo && rawVideo && rawVideo.trim().startsWith('http') && rawVideo.toLowerCase().includes('.mp4')) {
        mediaItems.push({ url: rawVideo.trim(), type: 'VIDEO' })
      }

      // 3. Room rental specific processing:
      if (prop.is_room_rental === true || prop.property_type === 'habitacion') {
        console.log(`[Media Sync] Property is a room rental. Processing room and common area photos...`);

        // A. Habitaciones (solo para pisos por habitaciones)
        if (prop.is_room_rental === true && prop.rooms && Array.isArray(prop.rooms) && prop.rooms.length > 0) {
          for (let roomIdx = 0; roomIdx < prop.rooms.length; roomIdx++) {
            const room = prop.rooms[roomIdx];
            const roomImages = Array.isArray(room.images) ? room.images : [];
            for (const roomImg of roomImages) {
              if (!roomImg || !roomImg.trim().startsWith('http')) continue;
              const cleanRoomUrl = roomImg.trim().split('?')[0];
              // Avoid duplicate URLs if we already added it (e.g. as cover)
              if (mediaItems.some(item => item.url.includes(cleanRoomUrl) || cleanRoomUrl.includes(item.url))) continue;

              const processedRoomUrl = await processAndWatermarkImage(prop, pid, supabase, roomImg, false, false);
              mediaItems.push({ url: processedRoomUrl, type: 'IMAGE' });
            }
          }
        }

        // B. Zonas comunes
        if (prop.common_areas && Array.isArray(prop.common_areas)) {
          for (const area of prop.common_areas) {
            const areaImages = Array.isArray(area.images) ? area.images.slice(0, 2) : [];
            for (const areaImg of areaImages) {
              if (!areaImg || !areaImg.trim().startsWith('http')) continue;
              const cleanAreaUrl = areaImg.trim().split('?')[0];
              if (mediaItems.some(item => item.url.includes(cleanAreaUrl) || cleanAreaUrl.includes(item.url))) continue;

              const processedAreaUrl = await processAndWatermarkImage(prop, pid, supabase, areaImg, false, false);
              mediaItems.push({ url: processedAreaUrl, type: 'IMAGE' });
            }
          }
        }
      }

      // 4. Standard Gallery Photos — collected then processed in batches to avoid WORKER_RESOURCE_LIMIT
      const galleryUrls: string[] = []
      if (prop.gallery && Array.isArray(prop.gallery)) {
        const firstGalleryImg = prop.gallery[0]
        const galleryStartIdx = (firstGalleryImg === prop.main_image) ? 1 : 0
        for (let i = galleryStartIdx; i < prop.gallery.length; i++) {
          const img = prop.gallery[i]
          if (img && img.trim().startsWith('http')) {
            const rawUrl = img.trim().split('?')[0];
            if (!mediaItems.some(item => item.url.includes(rawUrl) || rawUrl.includes(item.url))) {
              galleryUrls.push(img)
            }
          }
        }
      }

      // 5. Floor Plans — also collected for batch processing
      const floorPlanUrls: string[] = []
      if (prop.floor_plans && Array.isArray(prop.floor_plans)) {
        for (const img of prop.floor_plans) {
          if (img && img.trim().startsWith('http')) {
            const rawUrl = img.trim().split('?')[0];
            if (!mediaItems.some(item => item.url.includes(rawUrl) || rawUrl.includes(item.url))) {
              floorPlanUrls.push(img)
            }
          }
        }
      }

      // Process gallery + floor plans in batches of 5 with 300ms pause
      const allExtraUrls = [...galleryUrls, ...floorPlanUrls]
      if (allExtraUrls.length > 0) {
        console.log(`[Media Sync] Processing ${allExtraUrls.length} extra images in batches...`)
        const processedExtra = await processImageUrlsInBatches(
          allExtraUrls, prop, pid, supabase, false, -1, 5, 300
        )
        for (const item of processedExtra) mediaItems.push(item)
      }
    }

    // Instagram carousel: images only (max 10). The video URL is appended as text in the caption.
    const videoItem = mediaItems.find(item => item.type === 'VIDEO')
    const finalIgMediaItems = mediaItems.filter(item => item.type === 'IMAGE').slice(0, 10)

    // Facebook: images only for the photo post (video published separately via /videos endpoint)
    const finalFbMediaItems = mediaItems.slice(0, 30)

    const propUrl = `https://gelaberthomes.es/propiedades/${prop.reference || prop.slug || prop.id}`
    const copy    = customCopy || buildPostCopy(prop, false) // always Spanish for social posts

    // ──────────────────────────────────────────────────────────────────────────
    // DISCORD + TELEGRAM (existing functionality, preserved)
    // ──────────────────────────────────────────────────────────────────────────
    if (trigger === 'auto' || type === 'INSERT' || (type === 'UPDATE' && prop.commercial_status === 'disponible' && old_record?.commercial_status !== 'disponible')) {
      const price = prop.price?.toLocaleString('es-ES') + '€' + (prop.operation === 'alquiler' ? '/mes' : '')
      const mainImg = prop.main_image || 'https://gelaberthomes.es/sample_property.jpg'

      const DISCORD_URL = Deno.env.get('COMMUNITY_WEBHOOK_URL')
      if (DISCORD_URL) {
        const discordPayload = {
          content: `🏠 **¡Nueva propiedad publicada en la web!**`,
          embeds: [{
            title: prop.title,
            description: prop.short_description || 'Nueva oportunidad inmobiliaria en Málaga.',
            url: propUrl,
            color: 13216098,
            fields: [
              { name: 'Precio', value: price, inline: true },
              { name: 'Operación', value: prop.operation?.toUpperCase(), inline: true },
              { name: 'Ubicación', value: `${prop.zone || ''}, ${prop.city || 'Málaga'}`, inline: true }
            ],
            image: { url: mainImg },
            footer: { text: 'Gelabert Homes — Real Estate', icon_url: 'https://gelaberthomes.es/favicon.ico' }
          }]
        }
        await fetch(DISCORD_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discordPayload) })
          .catch(e => console.error('Discord error:', e))
      }

      const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
      const TG_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')
      if (TG_TOKEN && TG_CHAT_ID) {
        const text = `🏠 *¡Nueva propiedad disponible!*\n\n*${prop.title}*\n💰 ${price}\n📍 ${prop.zone || prop.city}\n\n🔗 [Ver en la web](${propUrl})`
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TG_CHAT_ID, photo: mainImg, caption: text, parse_mode: 'Markdown' })
        }).catch(e => console.error('Telegram error:', e))
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FACEBOOK SYNC
    // ──────────────────────────────────────────────────────────────────────────
    let fbResult: { postId: string | null; error: string | null } = { postId: null, error: null }

    const shouldSyncFacebook = FB_PAGE_ID && FB_PAGE_TOKEN && (
      action === 'publish_facebook' ||
      action === 'unpublish_facebook' ||
      (isStatusChange && prop.facebook_status === 'published')
    )

    if (shouldSyncFacebook) {
      if (action === 'unpublish_facebook') {
        // Delete post
        if (prop.facebook_post_id) {
          await fetch(`https://graph.facebook.com/v20.0/${prop.facebook_post_id}?access_token=${FB_PAGE_TOKEN}`, { method: 'DELETE' })
            .catch(() => {})
        }
        await supabase.from('properties').update({
          facebook_status: 'not_published',
          facebook_post_id: null,
          facebook_last_sync: new Date().toISOString(),
          facebook_error_log: null,
        }).eq('id', pid)

      } else if (action === 'publish_facebook' || (isStatusChange && prop.facebook_status === 'published')) {
        let postCopy = customCopyFb || customCopy || (needsWatermark
          ? `${WATERMARK_CONFIG[prop.commercial_status]?.label_es}: ${prop.title}\n\n${propUrl}`
          : copy)

        // Append video URL to the Facebook post copy so followers can find it
        // (Facebook API does not support mixing photos+videos in attached_media)
        const fbVideoItem = finalFbMediaItems.find(item => item.type === 'VIDEO')
        if (fbVideoItem) {
          postCopy += `\n\n🎬 ¡Mira el vídeo aquí!: ${fbVideoItem.url}`
        }

        // Step A: Publish photo post (images only in attached_media)
        fbResult = await publishToFacebook(FB_PAGE_ID, FB_PAGE_TOKEN, postCopy, finalFbMediaItems, prop.facebook_post_id || null)

        // Step B: Also publish the video as a separate Facebook video post
        if (fbVideoItem) {
          console.log('[FB Video] Publishing video separately to Facebook...')
          const videoResult = await publishVideoToFacebook(FB_PAGE_ID, FB_PAGE_TOKEN, postCopy, fbVideoItem.url)
          if (videoResult.error) {
            console.error('[FB Video] Video post failed:', videoResult.error)
          } else {
            console.log('[FB Video] Video published successfully. Post ID:', videoResult.postId)
          }
        }

        await supabase.from('properties').update({
          facebook_status: fbResult.postId ? 'published' : 'error',
          facebook_post_id: fbResult.postId,
          facebook_last_sync: new Date().toISOString(),
          facebook_error_log: fbResult.error,
        }).eq('id', pid)
      }
    } else if (action === 'publish_facebook' || action === 'unpublish_facebook') {
      fbResult = { postId: null, error: 'Credenciales de Facebook no configuradas en Supabase (FACEBOOK_PAGE_ID o FACEBOOK_PAGE_TOKEN vacíos).' }
      await supabase.from('properties').update({
        facebook_status: 'error',
        facebook_last_sync: new Date().toISOString(),
        facebook_error_log: fbResult.error,
      }).eq('id', pid)
    }

    // ──────────────────────────────────────────────────────────────────────────
    // INSTAGRAM SYNC
    // ──────────────────────────────────────────────────────────────────────────
    let igResult: { postId: string | null; error: string | null } = { postId: null, error: null }

    const shouldSyncInstagram = FB_PAGE_TOKEN && IG_ACCOUNT_ID && (
      action === 'publish_instagram' ||
      action === 'unpublish_instagram' ||
      (isStatusChange && prop.instagram_status === 'published')
    )

    if (shouldSyncInstagram) {
      if (action === 'unpublish_instagram') {
        // Instagram API does not support deleting posts via API — mark as not published only
        await supabase.from('properties').update({
          instagram_status: 'not_published',
          instagram_post_id: null,
          instagram_last_sync: new Date().toISOString(),
          instagram_error_log: 'Note: Instagram posts must be manually deleted from the app.',
        }).eq('id', pid)

      } else if (action === 'publish_instagram' || (isStatusChange && prop.instagram_status === 'published')) {
        if (finalIgMediaItems.length === 0) {
          igResult = { postId: null, error: 'No images or videos available for Instagram post' }
        } else {
          let igCopy = customCopyIg || copy
          const igVideo = mediaItems.find(item => item.type === 'VIDEO')
          const shouldIncludeVideoInIgCaption = trigger === 'manual' ? (includeVideo === true) : !!igVideo
          if (igVideo && shouldIncludeVideoInIgCaption) {
            igCopy += `\n\n🎬 ¡Mira el vídeo aquí!: ${igVideo.url}`
          }

          igResult = await publishToInstagram(IG_ACCOUNT_ID, FB_PAGE_TOKEN, igCopy, finalIgMediaItems, prop.instagram_post_id || null)

          await supabase.from('properties').update({
            instagram_status: igResult.postId ? 'published' : 'error',
            instagram_post_id: igResult.postId,
            instagram_last_sync: new Date().toISOString(),
            instagram_error_log: igResult.error,
          }).eq('id', pid)
        }
      }
    } else if (action === 'publish_instagram' || action === 'unpublish_instagram') {
      igResult = { postId: null, error: 'Credenciales de Instagram no configuradas en Supabase (FACEBOOK_PAGE_TOKEN o INSTAGRAM_ACCOUNT_ID vacíos).' }
      await supabase.from('properties').update({
        instagram_status: 'error',
        instagram_last_sync: new Date().toISOString(),
        instagram_error_log: igResult.error,
      }).eq('id', pid)
    }

    return new Response(JSON.stringify({
      success: true,
      property_id: pid,
      facebook: fbResult,
      instagram: igResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error('share-to-community error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
