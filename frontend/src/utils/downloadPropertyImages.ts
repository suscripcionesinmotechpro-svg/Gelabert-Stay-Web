import JSZip from 'jszip';
import type { Property } from '../types/property';

/**
 * Collects all image URLs for a property:
 * main_image + gallery + floor_plans (and legacy floor_plan).
 * Skips PDF floor plans and external URLs that may have CORS issues.
 */
function collectImageUrls(property: Property): { url: string; filename: string }[] {
  const entries: { url: string; filename: string }[] = [];
  const isRoomRental = !!property.is_room_rental;

  const sanitizeFolderName = (name: string): string => {
    return name.replace(/[\\/:*?"<>|]/g, '').trim();
  };

  const addUrl = (url: string | null | undefined, prefix: string, idx: number) => {
    if (!url || typeof url !== 'string') return;
    // Skip PDF files
    if (url.toLowerCase().split('?')[0].endsWith('.pdf')) return;
    const ext = url.split('?')[0].split('.').pop() || 'jpg';
    
    const folderPrefix = isRoomRental ? 'General/' : '';
    entries.push({ 
      url, 
      filename: `${folderPrefix}${prefix}_${String(idx).padStart(2, '0')}.${ext}` 
    });
  };

  // Main image
  if (property.main_image) {
    const ext = property.main_image.split('?')[0].split('.').pop() || 'jpg';
    const folderPrefix = isRoomRental ? 'General/' : '';
    entries.push({ 
      url: property.main_image, 
      filename: `${folderPrefix}foto_01_principal.${ext}` 
    });
  }

  // Gallery
  let galleryIndex = property.main_image ? 2 : 1;
  (property.gallery || []).forEach(url => {
    addUrl(url, 'foto', galleryIndex);
    galleryIndex++;
  });

  // Floor plans (legacy single + array)
  const allPlans = [
    ...(property.floor_plan ? [property.floor_plan] : []),
    ...(property.floor_plans || []),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  let planIndex = 1;
  allPlans.forEach(url => {
    addUrl(url, 'plano', planIndex);
    planIndex++;
  });

  // Rooms & Common Areas if room rental
  if (isRoomRental) {
    // Rooms
    (property.rooms || []).forEach((room) => {
      const roomFolderName = sanitizeFolderName(room.name || 'Habitación');
      let roomImgIndex = 1;
      (room.images || []).forEach((url) => {
        if (!url || typeof url !== 'string') return;
        const ext = url.split('?')[0].split('.').pop() || 'jpg';
        entries.push({
          url,
          filename: `${roomFolderName}/foto_${String(roomImgIndex).padStart(2, '0')}.${ext}`
        });
        roomImgIndex++;
      });
    });

    // Common Areas
    (property.common_areas || []).forEach((area) => {
      const areaName = sanitizeFolderName(area.name || area.type || 'Zona Común');
      let areaImgIndex = 1;
      (area.images || []).forEach((url) => {
        if (!url || typeof url !== 'string') return;
        const ext = url.split('?')[0].split('.').pop() || 'jpg';
        entries.push({
          url,
          filename: `Zonas Comunes/${areaName}_${String(areaImgIndex).padStart(2, '0')}.${ext}`
        });
        areaImgIndex++;
      });
    });
  }

  return entries;
}

/**
 * Builds a lookup map: imageUrl (clean) → room label string
 * for all room images in a room-rental property.
 * Format: "HABITACIÓN 1 · 450€/MES" or the room name if set.
 */
function buildRoomLabelMap(property: Property): Map<string, string> {
  const map = new Map<string, string>();
  if (!property.is_room_rental) return map;

  (property.rooms || []).forEach((room, idx) => {
    const roomName = (room.name && room.name.trim()) ? room.name.trim() : `Habitación ${idx + 1}`;
    const priceStr = room.price ? ` · ${Math.round(room.price)}€/mes` : '';
    const label = `${roomName}${priceStr}`.toUpperCase();

    (room.images || []).forEach((url) => {
      if (!url || typeof url !== 'string') return;
      const cleanUrl = url.trim().split('?')[0];
      map.set(cleanUrl, label);
    });
  });

  return map;
}

/**
 * Applies a black badge with white text in the bottom-left corner of an image blob.
 * Returns a new Blob with the label drawn on it.
 * This mirrors the createLabeledImageBuffer logic from the Edge Function (server-side),
 * but runs in the browser using Canvas.
 */
async function applyRoomLabelToBlob(blob: Blob, label: string): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(blob); // fallback — return original
        return;
      }

      // Draw the original image
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      // ── Badge layout ─────────────────────────────────────────────────────────
      const W = canvas.width;
      const H = canvas.height;

      // Font size scales with image width (similar to Edge Function's 22px at 900px)
      const fontSize = Math.max(14, Math.round(W * 0.024));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;

      const textMetrics = ctx.measureText(label);
      const textW = textMetrics.width;

      const paddingX = Math.round(W * 0.02);      // 2% of width
      const paddingY = Math.round(H * 0.025);     // 2.5% of height
      const badgePadH = Math.round(fontSize * 0.55); // vertical padding inside badge
      const badgePadW = Math.round(fontSize * 0.75); // horizontal padding inside badge

      const badgeW = Math.round(textW) + badgePadW * 2;
      const badgeH = fontSize + badgePadH * 2;
      const badgeX = paddingX;
      const badgeY = H - paddingY - badgeH;

      // Badge background (solid black with slight transparency)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

      // White border (2px)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
      ctx.lineWidth = Math.max(1.5, W * 0.002);
      ctx.strokeRect(
        badgeX + ctx.lineWidth / 2,
        badgeY + ctx.lineWidth / 2,
        badgeW - ctx.lineWidth,
        badgeH - ctx.lineWidth,
      );

      // Text (white, bold, with subtle shadow for legibility)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(label, badgeX + badgePadW, badgeY + badgePadH + fontSize * 0.88);
      ctx.shadowBlur = 0;

      canvas.toBlob(
        (result) => resolve(result ?? blob),
        'image/jpeg',
        0.88,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(blob); // fallback on error
    };

    img.crossOrigin = 'anonymous';
    img.src = objectUrl;
  });
}

/**
 * Downloads all images of a property as a ZIP file.
 * For room-rental properties, room photos get a label badge
 * (room name + price) drawn on the bottom-left corner.
 * @param property - The property object
 * @param onProgress - Optional callback with progress (0-100)
 */
export async function downloadPropertyImagesAsZip(
  property: Property,
  onProgress?: (pct: number) => void
): Promise<void> {
  const images = collectImageUrls(property);

  if (images.length === 0) {
    throw new Error('Esta propiedad no tiene fotos para descargar.');
  }

  // Build a room label map (only populated for room-rental properties)
  const roomLabelMap = buildRoomLabelMap(property);

  const zip = new JSZip();
  const folder = zip.folder(property.reference || property.id.slice(0, 8)) as JSZip;

  let done = 0;
  let successfulDownloads = 0;

  await Promise.all(
    images.map(async ({ url, filename }) => {
      try {
        // CORREGIR BUG DE CACHÉ DE CORS EN NAVEGADORES:
        // Si las imágenes ya se cargaron en la página mediante etiquetas <img> normales sin crossorigin,
        // el navegador las guarda en caché sin cabeceras CORS. Un fetch() posterior a la misma URL
        // fallará por CORS al leer de la caché. Añadir un timestamp como parámetro único
        // obliga a realizar una petición de red limpia que sí obtiene las cabeceras CORS correctas de Supabase.
        const cacheBustingUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
        
        const response = await fetch(cacheBustingUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        let blob = await response.blob();

        // ── Apply room label badge if this image belongs to a room ────────────
        const cleanUrl = url.trim().split('?')[0];
        const roomLabel = roomLabelMap.get(cleanUrl);
        if (roomLabel) {
          try {
            blob = await applyRoomLabelToBlob(blob, roomLabel);
          } catch (labelErr) {
            console.warn(`[ZIP] Room label failed for ${url}, using original:`, labelErr);
          }
        }

        // Force .jpg extension for labeled images (canvas outputs JPEG)
        const finalFilename = roomLabel
          ? filename.replace(/\.[^.]+$/, '.jpg')
          : filename;

        folder.file(finalFilename, blob);
        successfulDownloads++;
      } catch (err) {
        // Skip images that can't be fetched (CORS, 404, etc.)
        console.warn(`[ZIP] Could not fetch: ${url}`, err);
      } finally {
        done++;
        onProgress?.(Math.round((done / images.length) * 100));
      }
    })
  );

  // Evitar la descarga de una carpeta vacía si todos los fetch fallan
  if (successfulDownloads === 0) {
    throw new Error(
      'No se ha podido descargar ninguna de las imágenes. Esto suele deberse a un problema de permisos CORS en el servidor de Supabase Storage o restricciones de red del navegador.'
    );
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });

  // Trigger browser download
  const ref = property.reference || property.id.slice(0, 8);
  const zipName = `Gelabert_Homes_${ref}.zip`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
