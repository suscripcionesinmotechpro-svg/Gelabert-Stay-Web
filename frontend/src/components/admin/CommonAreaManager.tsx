import React, { useState } from 'react';
import { Plus, X, Upload, Trash2, Play } from 'lucide-react';
import { uploadPropertyMedia } from '../../hooks/useProperties';
import type { PropertyCommonArea } from '../../types/property';
import { SortableImageGallery } from './SortableImageGallery';

interface CommonAreaManagerProps {
  areas: PropertyCommonArea[];
  onChange: (areas: PropertyCommonArea[]) => void;
}

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const selectClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors";
const labelClass = "font-primary text-[10px] text-[#666666] uppercase tracking-wider mb-1 font-bold";

const COMMON_AREA_TYPES = [
  { value: 'baño', label: 'Baño' },
  { value: 'salon', label: 'Salón' },
  { value: 'terraza', label: 'Terraza' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'patio', label: 'Patio' },
  { value: 'trastero', label: 'Trastero' },
  { value: 'general', label: 'General / Todas las zonas' },
  { value: 'otro', label: 'Otro' }
];

export const CommonAreaManager: React.FC<CommonAreaManagerProps> = ({ areas, onChange }) => {
  const [uploading, setUploading] = useState<string | null>(null);

  const addArea = () => {
    const newArea: PropertyCommonArea = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'otro',
      name: '',
      images: [],
      is_private: false
    };
    onChange([...areas, newArea]);
  };

  const removeArea = (index: number) => {
    const newAreas = [...areas];
    newAreas.splice(index, 1);
    onChange(newAreas);
  };

  const updateArea = (index: number, updates: Partial<PropertyCommonArea>) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], ...updates };
    onChange(newAreas);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(`images-${index}`);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const url = await uploadPropertyMedia(f, 'gallery');
        urls.push(url);
      }
      const currentImages = areas[index].images || [];
      const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
      const combined = [...currentImages, ...urls];
      const seen = new Set();
      const unique = combined.filter((img: string) => {
        const n = normalize(img);
        if (seen.has(n)) return false;
        seen.add(n);
        return true;
      });
      updateArea(index, { images: unique });
    } catch (err) {
      console.error('Error uploading common area images:', err);
    } finally {
      setUploading(null);
    }
  };

  const handleVideoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(`video-${index}`);
    try {
      const url = await uploadPropertyMedia(file, 'video');
      const area = areas[index];
      const defaultTitle = `Tour ${area.name || area.type} ${ (area.videos?.length || 0) + 1 }`;
      const currentVideos = area.videos || [];
      updateArea(index, { videos: [...currentVideos, { url, title: defaultTitle }] });
    } catch (err) {
      console.error('Error uploading common area video:', err);
    } finally {
      setUploading(null);
    }
  };

  const removeVideo = (areaIdx: number, videoIdx: number) => {
    const currentVideos = [...(areas[areaIdx].videos || [])];
    currentVideos.splice(videoIdx, 1);
    updateArea(areaIdx, { videos: currentVideos });
  };

  const updateVideoTitle = (areaIdx: number, videoIdx: number, title: string) => {
    const currentVideos = [...(areas[areaIdx].videos || [])];
    const video = currentVideos[videoIdx];
    const url = typeof video === 'string' ? video : video.url;
    currentVideos[videoIdx] = { url, title };
    updateArea(areaIdx, { videos: currentVideos });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
        <h3 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">
          Gestión de Zonas Comunes
        </h3>
        <button
          type="button"
          onClick={addArea}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/20 rounded-sm hover:bg-[#C9A962]/20 transition-all text-xs font-bold uppercase tracking-tight"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir Zona Común
        </button>
      </div>

      {!areas.length ? (
        <div className="py-12 text-center border border-dashed border-[#1F1F1F] rounded-sm bg-[#070707]">
          <p className="text-[#444444] text-xs uppercase tracking-widest italic">
            No se han añadido zonas comunes todavía
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {areas.map((area, idx) => (
            <div key={area.id} className="relative group bg-[#0A0A0A] border border-[#1F1F1F] p-6 rounded-sm">
              <button
                type="button"
                onClick={() => removeArea(idx)}
                className="absolute top-4 right-4 text-[#444444] hover:text-red-500 transition-colors p-1"
                title="Eliminar zona"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Tipo de Zona</label>
                  <select
                    className={selectClass}
                    value={area.type}
                    onChange={(e) => updateArea(idx, { type: e.target.value as any })}
                  >
                    {COMMON_AREA_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Nombre / Descripción Corta</label>
                  <input
                    className={inputClass}
                    value={area.name}
                    onChange={(e) => updateArea(idx, { name: e.target.value })}
                    placeholder="Ej: Cocina principal"
                  />
                </div>
                {area.type === 'baño' && (
                  <div className="flex flex-col gap-2 justify-center pt-5">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div
                        onClick={() => updateArea(idx, { is_private: !area.is_private })}
                        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${area.is_private ? 'bg-[#C9A962]' : 'bg-[#2A2A2A]'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${area.is_private ? 'left-5.5' : 'left-0.5'}`} style={{ left: area.is_private ? '1.375rem' : '0.125rem' }} />
                      </div>
                      <span className="font-primary text-[10px] text-[#888888] uppercase tracking-wide font-bold">¿Es privado?</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Gallery */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Fotos de la Zona</label>
                  <label className="flex items-center gap-2 px-3 py-1 border border-[#1F1F1F] text-[#888888] font-primary text-[10px] uppercase tracking-wider cursor-pointer hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
                    <Upload className="w-3 h-3" />
                    Subir fotos
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(idx, e)} />
                  </label>
                </div>
                
                {uploading === `images-${idx}` && (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-3 h-3 border border-[#C9A962] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[#C9A962] uppercase tracking-widest animate-pulse font-bold">Subiendo imágenes...</span>
                  </div>
                )}

                <SortableImageGallery 
                  images={area.images} 
                  onChange={(images) => {
                    const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
                    const seen = new Set();
                    const unique = images.filter((img: string) => {
                      const n = normalize(img);
                      if (seen.has(n)) return false;
                      seen.add(n);
                      return true;
                    });
                    updateArea(idx, { images: unique });
                  }} 
                />
              </div>

              {/* Videos */}
              <div className="mt-8 pt-8 border-t border-[#1F1F1F]">
                <div className="flex items-center justify-between mb-4">
                  <label className={labelClass}>Vídeos de la Zona (Opcional)</label>
                  <label className="flex items-center gap-2 px-3 py-1 border border-[#1F1F1F] text-[#888888] font-primary text-[10px] uppercase tracking-wider cursor-pointer hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
                    <Upload className="w-3 h-3" />
                    Subir vídeo
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(idx, e)} />
                  </label>
                </div>

                {uploading === `video-${idx}` && (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-3 h-3 border border-[#C9A962] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[#C9A962] uppercase tracking-widest animate-pulse font-bold">Subiendo vídeo...</span>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {(area.videos || []).map((video, vIdx) => (
                    <div key={vIdx} className="flex gap-4 p-4 bg-[#070707] border border-[#1F1F1F] group/video">
                      <div className="relative w-32 aspect-video bg-black overflow-hidden shrink-0">
                        <video src={typeof video === 'string' ? video : video.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="w-6 h-6 text-white opacity-70" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <label className={labelClass}>Título del Vídeo {vIdx + 1}</label>
                          <button
                            type="button"
                            onClick={() => removeVideo(idx, vIdx)}
                            className="text-[#444444] hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          className={inputClass}
                          value={typeof video === 'string' ? '' : video.title}
                          onChange={(e) => updateVideoTitle(idx, vIdx, e.target.value)}
                          placeholder="Ej: Tour de la cocina"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
