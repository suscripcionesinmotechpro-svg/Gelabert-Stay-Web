export const applyWatermark = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    // Return videos, pdfs directly
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(file); // fail safe
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image at native uncompressed resolution
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Load watermark
        const watermark = new Image();
        watermark.crossOrigin = 'anonymous'; // necessary for tainted canvases
        watermark.src = '/watermark.png'; // Make sure this is in public

        watermark.onload = () => {
          // Calculate watermark dimensions
          // Let's make it 25% of the image width, up to a max of maybe 600px
          let wmWidth = canvas.width * 0.25;
          if (wmWidth > 600) wmWidth = 600;
          if (wmWidth < 150) wmWidth = 150;
          
          const aspectRatio = watermark.width / watermark.height;
          const wmHeight = wmWidth / aspectRatio;

          // Padding from edge
          const padding = 20;

          // Enable shadow for better visibility on all backgrounds
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // 85% opacity golden watermark
          ctx.globalAlpha = 0.85;

          // Draw the watermark on the bottom right corner
          const x = canvas.width - wmWidth - padding;
          const y = canvas.height - wmHeight - padding;
          
          ctx.drawImage(watermark, x, y, wmWidth, wmHeight);

          // Return as blob without quality loss 
          // (keep JPEG output on JPEG inputs for compatibility, quality 1.0 = 100% max quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const watermarkedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(watermarkedFile);
              } else {
                resolve(file); // Fallback to original
              }
            },
            file.type,
            1.0 // Maximum lossless-like quality
          );
        };

        watermark.onerror = () => {
          console.warn('Could not load watermark, saving without it.');
          resolve(file); // fail safe
        };
      };

      img.onerror = () => reject(new Error('Failed to load image for watermarking'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
