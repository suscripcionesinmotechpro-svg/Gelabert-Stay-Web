/**
 * Utility to transform Supabase image URLs for optimization
 * Uses Supabase Image Transformation service if available
 */
export const getOptimizedImage = (url: string | null | undefined, options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' | 'origin' } = {}) => {
  if (!url) return '';
  
  // Use WEBP as default format for max compatibility and quality
  const { width, height, quality = 100, format = 'webp' } = options;
  
  // Only transform Supabase storage URLs
  if (url.includes('supabase.co') && url.includes('object/public')) {
    const baseUrl = url.split('?')[0].replace('object/public', 'render/image/public');
    const params = new URLSearchParams();
    
    // Use 2.0 buffer for ultra-high DPI devices
    if (width) params.append('width', (width * 2.0).toString()); 
    if (height) params.append('height', (height * 2.0).toString());
    params.append('quality', quality.toString());
    params.append('format', format);
    params.append('resize', 'cover');
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  return url;
};
