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
 * Downloads all images of a property as a ZIP file.
 * Images already have the watermark applied (they were watermarked on upload).
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
        const blob = await response.blob();
        folder.file(filename, blob);
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
