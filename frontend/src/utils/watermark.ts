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
          // Let's make it 40% of the image width for a prominent center watermark
          let wmWidth = canvas.width * 0.40;
          if (wmWidth > 800) wmWidth = 800; // max width
          if (wmWidth < 200) wmWidth = 200; // min width
          
          const aspectRatio = watermark.width / watermark.height;
          const wmHeight = wmWidth / aspectRatio;

          // Enable shadow for better visibility on all backgrounds
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // 70% opacity for center watermark (more transparent so it doesn't block the view)
          ctx.globalAlpha = 0.70;

          // Draw the watermark exactly in the CENTER of the image
          const x = (canvas.width - wmWidth) / 2;
          const y = (canvas.height - wmHeight) / 2;
          
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
