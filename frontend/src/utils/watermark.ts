// Helper to get enhancement parameters from Gemini
const getEnhancementParameters = async (
  file: File,
  onProgress?: (status: string) => void
): Promise<{ brightness: number; contrast: number; saturation: number }> => {
  try {
    onProgress?.('Analizando imagen con IA...');
    // Create a tiny version of the image (e.g., max 400px width/height) to send to Gemini
    const tempImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image for Gemini analysis'));
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context for temporary canvas');

    const MAX_DIM = 400;
    let { width, height } = tempImg;
    if (width > MAX_DIM || height > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(tempImg, 0, 0, width, height);

    // Convert to base64 (without the prefix data:image/jpeg;base64,)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64Data = dataUrl.split(',')[1];

    // Call our NextJS api route
    const response = await fetch('/api/enhance-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: 'image/jpeg',
      }),
    });

    if (!response.ok) {
      throw new Error(`API response error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      brightness: data.brightness ?? 1.0,
      contrast: data.contrast ?? 1.0,
      saturation: data.saturation ?? 1.0,
    };
  } catch (err) {
    console.warn('[Enhancement AI] Failed to get parameters from Gemini, using default fallback:', err);
    // Safe subtle fallback enhancement
    return {
      brightness: 1.06,
      contrast: 1.03,
      saturation: 1.04,
    };
  }
};

export const applyWatermark = async (
  file: File,
  roomText?: string,
  autoEnhance = true,
  onProgress?: (status: string) => void
): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    // Return videos, pdfs directly
    return file;
  }

  // 1. Get enhancement parameters from Gemini if autoEnhance is true
  let filters = { brightness: 1.0, contrast: 1.0, saturation: 1.0 };
  if (autoEnhance) {
    filters = await getEnhancementParameters(file, onProgress);
    console.log('[AI Enhancement Parameters Applied]:', filters);
  }

  return new Promise((resolve, reject) => {
    onProgress?.('Preparando imagen...');
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

        // Apply Gemini filters ONLY to the property image
        ctx.save();
        if (autoEnhance) {
          ctx.filter = `brightness(${filters.brightness}) contrast(${filters.contrast}) saturate(${filters.saturation})`;
        }

        // Draw original image (potentially scaled down, with filters applied)
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore(); // Reset filters so that watermark and text are not affected!

        onProgress?.('Aplicando marca de agua...');

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

          onProgress?.('Guardando cambios...');

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
          onProgress?.('Guardando cambios (sin logo)...');
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
