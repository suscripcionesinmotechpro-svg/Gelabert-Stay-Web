import JSZip from 'jszip';
import type { Property } from '../types/property';

/**
 * Collects all image URLs for a property:
 * main_image + gallery + floor_plans (and legacy floor_plan).
 * Skips PDF floor plans and external URLs that may have CORS issues.
 */
function collectImageUrls(property: Property): { url: string; filename: string }[] {
  const entries: { url: string; filename: string }[] = [];
  let index = 1;

  const addUrl = (url: string | null | undefined, prefix: string) => {
    if (!url || typeof url !== 'string') return;
    // Skip PDF files
    if (url.toLowerCase().split('?')[0].endsWith('.pdf')) return;
    const ext = url.split('?')[0].split('.').pop() || 'jpg';
    entries.push({ url, filename: `${prefix}_${String(index).padStart(2, '0')}.${ext}` });
    index++;
  };

  // Main image
  if (property.main_image) {
    const ext = property.main_image.split('?')[0].split('.').pop() || 'jpg';
    entries.push({ url: property.main_image, filename: `foto_01_principal.${ext}` });
    index = 2;
  }

  // Gallery
  (property.gallery || []).forEach(url => addUrl(url, 'foto'));

  // Reset index for plans
  index = 1;

  // Floor plans (legacy single + array)
  const allPlans = [
    ...(property.floor_plan ? [property.floor_plan] : []),
    ...(property.floor_plans || []),
  ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

  allPlans.forEach(url => addUrl(url, 'plano'));

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

  await Promise.all(
    images.map(async ({ url, filename }) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        folder.file(filename, blob);
      } catch {
        // Skip images that can't be fetched (CORS, 404, etc.)
        console.warn(`[ZIP] Could not fetch: ${url}`);
      } finally {
        done++;
        onProgress?.(Math.round((done / images.length) * 100));
      }
    })
  );

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
