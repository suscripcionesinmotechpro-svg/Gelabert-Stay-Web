import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  const opMap: Record<string, string> = {
    venta:    isEn ? '🏠 For Sale'   : '🏠 En Venta',
    alquiler: isEn ? '🏠 For Rent'   : '🏠 En Alquiler',
    traspaso: isEn ? '🏢 Transfer'   : '🏢 Traspaso',
  }
  const op = opMap[prop.operation] || '🏠'
  const price = prop.price
    ? new Intl.NumberFormat(isEn ? 'en-US' : 'es-ES', { style: 'currency', currency: prop.currency || 'EUR', maximumFractionDigits: 0 }).format(prop.price) + (prop.operation === 'alquiler' ? (isEn ? '/month' : '/mes') : '')
    : null

  const features = [
    prop.area_m2 ? `📐 ${prop.area_m2} m²` : null,
    prop.bedrooms > 0 ? `🛏 ${prop.bedrooms} ${isEn ? 'bed.' : 'hab.'}` : null,
    prop.bathrooms > 0 ? `🚿 ${prop.bathrooms} ${isEn ? 'bath.' : 'baños'}` : null,
    prop.floor ? `🏢 ${isEn ? 'Floor' : 'Planta'} ${prop.floor}` : null,
    prop.has_pool ? (isEn ? '🏊 Pool' : '🏊 Piscina') : null,
    prop.sea_views ? (isEn ? '🌊 Sea Views' : '🌊 Vistas al mar') : null,
    prop.has_parking ? (isEn ? '🅿 Parking' : '🅿 Parking') : null,
  ].filter(Boolean).join('  ')

  const title = isEn ? (prop.title_en || prop.title) : prop.title
  const zone = [prop.zone, prop.city].filter(Boolean).join(', ')
  const link = `https://gelaberthomes.es${isEn ? '/en' : ''}/propiedades/${prop.reference || prop.slug || prop.id}`

  return [
    `${op} | ${isEn ? 'Gelabert Homes' : 'Gelabert Homes'}`,
    ``,
    title,
    zone ? `📍 ${zone}` : null,
    price ? `💰 ${price}` : null,
    features || null,
    ``,
    `🔗 ${link}`,
    ``,
    isEn
      ? `#RealEstate #Malaga #GelabertHomes #Property`
      : `#Inmobiliaria #Málaga #GelabertHomes #Propiedad`,
  ].filter(s => s !== null).join('\n')
}

// ── Download image and add a diagonal watermark banner ────────────────────────
async function createWatermarkedImageBuffer(imageUrl: string, statusKey: string): Promise<Uint8Array | null> {
  try {
    // Import imagescript — a pure Deno image processing library
    const { Image } = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
    
    const cfg = WATERMARK_CONFIG[statusKey]
    if (!cfg) return null

    // Download the source image
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    
    const img = await Image.decode(buf)

    // Resize to OG dimensions (1200x630)
    const targetW = 1200
    const targetH = 630
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

// ── Upload image buffer to Facebook (as form data) ─────────────────────────────
async function uploadImageToFacebook(pageId: string, pageToken: string, imageBuffer: Uint8Array, fileName: string): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('source', new Blob([imageBuffer], { type: 'image/jpeg' }), fileName)
    formData.append('published', 'false') // unpublished media, to be used in post
    formData.append('access_token', pageToken)

    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (data.id) return data.id
    console.error('FB photo upload error:', data)
    return null
  } catch (err) {
    console.error('FB upload exception:', err)
    return null
  }
}

// ── Publish a post to a Facebook Page ─────────────────────────────────────────
async function publishToFacebook(pageId: string, pageToken: string, message: string, imageUrl: string | null, existingPostId: string | null): Promise<{ postId: string | null; error: string | null }> {
  try {
    // Delete existing post first if we have one
    if (existingPostId) {
      await fetch(`https://graph.facebook.com/v20.0/${existingPostId}?access_token=${pageToken}`, { method: 'DELETE' })
        .catch(() => {}) // Ignore delete errors
    }

    const body: Record<string, string> = {
      message,
      access_token: pageToken,
    }
    if (imageUrl) {
      body.link = imageUrl // Use link preview which includes the og:image
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.id) return { postId: data.id, error: null }
    return { postId: null, error: data.error?.message || 'Unknown FB error' }
  } catch (err: any) {
    return { postId: null, error: err.message }
  }
}

// ── Publish a post to Instagram (via Media Container + Publish) ────────────────
async function publishToInstagram(igAccountId: string, pageToken: string, caption: string, imageUrl: string, existingPostId: string | null): Promise<{ postId: string | null; error: string | null }> {
  try {
    // Step 1: Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: pageToken,
      }),
    })
    const container = await containerRes.json()
    if (!container.id) return { postId: null, error: container.error?.message || 'IG container error' }

    // Wait 2 seconds for container processing
    await new Promise(r => setTimeout(r, 2000))

    // Step 2: Publish container
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
    } = payload

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

    // ── Build image URL ───────────────────────────────────────────────────────
    const rawImage = prop.main_image || (prop.gallery && prop.gallery[0])
    const cleanImageUrl = rawImage ? rawImage.split('?')[0] : null

    const propUrl = `https://gelaberthomes.es/propiedades/${prop.reference || prop.slug || prop.id}`
    const copy    = buildPostCopy(prop, false) // always Spanish for social posts

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
        // Determine if we need a watermark (status not 'disponible')
        const needsWatermark = prop.commercial_status && prop.commercial_status !== 'disponible'
        let finalImageUrl = cleanImageUrl

        if (needsWatermark && cleanImageUrl && WATERMARK_CONFIG[prop.commercial_status]) {
          // Try to create watermarked image
          const wmBuffer = await createWatermarkedImageBuffer(cleanImageUrl, prop.commercial_status)
          if (wmBuffer) {
            // Upload watermarked image to Supabase Storage
            const wmFileName = `watermarks/${pid}_${prop.commercial_status}_${Date.now()}.jpg`
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('properties')
              .upload(wmFileName, wmBuffer, { contentType: 'image/jpeg', upsert: true })
            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage.from('properties').getPublicUrl(wmFileName)
              finalImageUrl = urlData.publicUrl
            }
          }
        }

        const existingPostId = prop.facebook_post_id || null
        const postCopy = needsWatermark
          ? `${WATERMARK_CONFIG[prop.commercial_status]?.label_es}: ${prop.title}\n\n${propUrl}`
          : copy

        fbResult = await publishToFacebook(FB_PAGE_ID, FB_PAGE_TOKEN, postCopy, propUrl, existingPostId)

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
        if (!cleanImageUrl) {
          igResult = { postId: null, error: 'No image available for Instagram post' }
        } else {
          const needsWatermark = prop.commercial_status && prop.commercial_status !== 'disponible'
          let finalIgImageUrl = cleanImageUrl

          if (needsWatermark && WATERMARK_CONFIG[prop.commercial_status]) {
            const wmBuffer = await createWatermarkedImageBuffer(cleanImageUrl, prop.commercial_status)
            if (wmBuffer) {
              const wmFileName = `watermarks/ig_${pid}_${prop.commercial_status}_${Date.now()}.jpg`
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('properties')
                .upload(wmFileName, wmBuffer, { contentType: 'image/jpeg', upsert: true })
              if (!uploadError && uploadData) {
                const { data: urlData } = supabase.storage.from('properties').getPublicUrl(wmFileName)
                finalIgImageUrl = urlData.publicUrl
              }
            }
          }

          igResult = await publishToInstagram(IG_ACCOUNT_ID, FB_PAGE_TOKEN, copy, finalIgImageUrl, prop.instagram_post_id || null)

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
