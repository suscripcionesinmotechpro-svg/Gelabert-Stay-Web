import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion } from 'framer-motion';
import { X, Check, RotateCcw } from 'lucide-react';
import { getCroppedImg } from '../../utils/imageCrop';

interface ImageCropperModalProps {
  image: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
}

export const ImageCropperModal = ({ 
  image, 
  onClose, 
  onCropComplete, 
  aspectRatio = 2 / 3 
}: ImageCropperModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) {
      console.warn('Crop area not yet defined');
      return;
    }
    
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-4xl bg-[#0F0F0F] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-secondary text-white uppercase tracking-widest">Ajustar Imagen</h3>
            <p className="text-xs text-[#888] font-primary uppercase tracking-wider mt-1">Formato Vertical Recomendado (2:3)</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 text-[#888] hover:text-white transition-colors rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative flex-1 min-h-[400px] md:min-h-[500px] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            style={{
              containerStyle: { background: '#000' },
              cropAreaStyle: { border: '2px solid #C9A962' }
            }}
          />
        </div>

        {/* Footer Controls */}
        <div className="p-8 bg-[#0F0F0F] border-t border-white/5 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-[#888] font-primary font-bold">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-white/10 appearance-none rounded-full accent-[#C9A962] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => {
                setZoom(1);
                setCrop({ x: 0, y: 0 });
              }}
              className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white font-primary text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Resetear
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-white/50 font-primary text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex items-center gap-2 px-10 py-3 bg-[#C9A962] text-black font-primary font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#D4B673] transition-all disabled:opacity-50 shadow-lg shadow-[#C9A962]/20"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirmar Recorte
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
