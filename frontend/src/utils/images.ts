/**
 * Utility to transform Supabase image URLs for optimization
 * Uses Supabase Image Transformation service if available
 */
export const getOptimizedImage = (url: string | null | undefined, options: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' | 'origin' } = {}) => {
  if (!url) return '';
  
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // Only transform Supabase storage URLs
  if (url.includes('supabase.co') && url.includes('object/public')) {
    const baseUrl = url.split('?')[0].replace('object/public', 'render/image/public');
    const params = new URLSearchParams();
    
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    params.append('format', format);
    params.append('resize', 'cover');
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  return url;
};
