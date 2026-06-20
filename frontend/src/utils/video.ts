/**
 * Helper utility to extract duration from a video file or public URL in the client-side
 */
export const getVideoDuration = (source: File | string): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    if (typeof source === 'string') {
      video.crossOrigin = 'anonymous';
    }

    const url = typeof source === 'string' ? source : URL.createObjectURL(source);

    const timeoutId = setTimeout(() => {
      resolve(0);
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
    }, 8000);

    video.src = url;

    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      resolve(video.duration || 0);
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      resolve(0);
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
    };
  });
};

/**
 * Helper utility to estimate cost based on video duration
 */
export const estimateVideoCost = (durationInSeconds: number) => {
  if (!durationInSeconds || durationInSeconds <= 0) {
    return { basic: '0,05 €', premium: '0,00 €' };
  }
  const basicCost = 0.05;
  const premiumCost = (durationInSeconds / 60) * 0.30;
  
  return {
    basic: `${basicCost.toFixed(2).replace('.', ',')} €`,
    premium: `${premiumCost.toFixed(2).replace('.', ',')} €`
  };
};
