interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function supabaseImageLoader({ src, width, quality = 80 }: ImageLoaderProps): string {
  if (!src) return '';
  
  // Only process Supabase Storage URLs
  if (src.includes('supabase.co') && src.includes('object/public')) {
    const baseUrl = src.split('?')[0].replace('object/public', 'render/image/public');
    const params = new URLSearchParams();
    params.append('width', width.toString());
    params.append('quality', quality.toString());
    params.append('format', 'avif'); // Request AVIF next-gen format
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  // Return as-is for local assets or other CDN URLs
  return src;
}
