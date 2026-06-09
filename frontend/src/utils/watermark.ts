export const applyWatermark = async (file: File, roomText?: string): Promise<File> => {
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

        // ── Resize to max 2400px wide (keeps quality high, reduces file size) ──
        const MAX_WIDTH = 2400;
        const MAX_HEIGHT = 2400;
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original image (potentially scaled down)
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0, width, height);

        // Load watermark
        const watermark = new Image();
        watermark.crossOrigin = 'anonymous';
        watermark.src = '/watermark_exact_hd.png';

        watermark.onload = () => {
          let wmWidth = width * 0.40;
          if (wmWidth > 800) wmWidth = 800;
          if (wmWidth < 200) wmWidth = 200;

          const aspectRatio = watermark.width / watermark.height;
          const wmHeight = wmWidth / aspectRatio;

          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.globalAlpha = 0.90;

          const x = (width - wmWidth) / 2;
          const y = (height - wmHeight) / 2;
          ctx.drawImage(watermark, x, y, wmWidth, wmHeight);

          // ── Add Room Text Watermark in top-left corner if provided ──
          if (roomText) {
            const scale = width / 1200;
            const fontSize = Math.max(14, Math.min(56, Math.round(20 * scale)));
            ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
            
            const paddingX = Math.round(14 * scale);
            const paddingY = Math.round(8 * scale);
            const margin = Math.round(20 * scale);
            
            const textWidth = ctx.measureText(roomText).width;
            const textHeight = fontSize;
            
            const boxX = margin;
            const boxY = margin;
            const boxW = textWidth + paddingX * 2;
            const boxH = textHeight + paddingY * 2;
            const radius = Math.round(4 * scale);
            
            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.globalAlpha = 0.85;
            
            ctx.fillStyle = '#0A0A0A';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(boxX, boxY, boxW, boxH, radius);
            } else {
              ctx.rect(boxX, boxY, boxW, boxH);
            }
            ctx.fill();
            
            // Gold border
            ctx.strokeStyle = 'rgba(201, 169, 98, 0.8)';
            ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
            ctx.stroke();
            
            // Text drawing
            ctx.fillStyle = '#C9A962'; // Gold
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(roomText, boxX + paddingX, boxY + paddingY);
            ctx.restore();
          }

          // ── Always output as JPEG at 0.85 quality ──
          // PNG → JPEG saves ~60-80% size; JPEG stays high quality
          const outputType = 'image/jpeg';
          const outputQuality = 0.85;
          const outputName = file.name.replace(/\.[^.]+$/, '.jpg');

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const watermarkedFile = new File([blob], outputName, {
                  type: outputType,
                  lastModified: Date.now(),
                });
                resolve(watermarkedFile);
              } else {
                resolve(file); // Fallback to original
              }
            },
            outputType,
            outputQuality
          );
        };

        watermark.onerror = () => {
          // No watermark available — still compress and resize
          const outputType = 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: outputType,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                resolve(file);
              }
            },
            outputType,
            0.85
          );
        };
      };

      img.onerror = () => reject(new Error('Failed to load image for watermarking'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
