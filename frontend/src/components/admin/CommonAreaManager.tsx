import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Trash2, Play, Download } from 'lucide-react';
import { uploadPropertyMedia } from '../../hooks/useProperties';
import type { PropertyCommonArea } from '../../types/property';
import { SortableImageGallery } from './SortableImageGallery';
import { toast } from 'react-hot-toast';
import { getVideoDuration } from '../../utils/video';

interface CommonAreaManagerProps {
  areas: PropertyCommonArea[];
  onChange: (areas: PropertyCommonArea[]) => void;
  autoEnhance?: boolean;
  propertyId?: string;
  propertyName?: string;
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

export const CommonAreaManager: React.FC<CommonAreaManagerProps> = ({ 
  areas, 
  onChange, 
  autoEnhance = true,
  propertyId,
  propertyName
}) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [areaEnhance, setAreaEnhance] = useState<Record<string, boolean>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});


  useEffect(() => {
    areas.forEach((area) => {
      (area.videos || []).forEach((video) => {
        const url = typeof video === 'string' ? video : video.url;
        if (url && !durations[url]) {
          getVideoDuration(url).then((d) => {
            if (d > 0) {
              setDurations((prev) => ({ ...prev, [url]: d }));
            }
          });
        }
      });
    });
  }, [areas]);

  // NOTE: Polling is handled globally by useGlobalVideoPolling hook (in AdminLayout / AgentLayout).
  // No local polling here to avoid race conditions.

  const addArea = () => {
    const newArea: PropertyCommonArea = {
      id: Math.random().toString(36).slice(2, 9),
      type: 'baño',
      name: '',
      images: [],
      videos: []
    };
    onChange([...areas, newArea]);
  };

  const removeArea = (idx: number) => {
    onChange(areas.filter((_, i) => i !== idx));
  };

  const updateArea = (idx: number, fields: Partial<PropertyCommonArea>) => {
    const updated = [...areas];
    updated[idx] = { ...updated[idx], ...fields };
    onChange(updated);
  };

  const handleVideoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(`video-${idx}`);
    try {
      const shouldEnhance = areaEnhance[areas[idx].id] ?? autoEnhance;
      const url = await uploadPropertyMedia(file, 'video', undefined, undefined, shouldEnhance);
      const currentVideos = areas[idx].videos ? [...areas[idx].videos] : [];
      currentVideos.push({
        url,
        title: `Vídeo ${currentVideos.length + 1}`
      });
      updateArea(idx, { videos: currentVideos });
      toast.success('Vídeo subido con éxito');
    } catch (err: any) {
      toast.error(`Error al subir vídeo: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const removeVideo = (areaIdx: number, videoIdx: number) => {
    const currentVideos = areas[areaIdx].videos ? [...areas[areaIdx].videos] : [];
    const filtered = currentVideos.filter((_, i) => i !== videoIdx);
    updateArea(areaIdx, { videos: filtered });
  };

  const updateVideoTitle = (areaIdx: number, videoIdx: number, title: string) => {
    const currentVideos = areas[areaIdx].videos ? [...areas[areaIdx].videos] : [];
    const video = currentVideos[videoIdx];
    if (typeof video === 'string') {
      currentVideos[videoIdx] = { url: video, title };
    } else {
      currentVideos[videoIdx] = { ...video, title };
    }
    updateArea(areaIdx, { videos: currentVideos });
  };



  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
        <div>
          <h4 className="font-secondary text-sm text-[#FAF8F5] uppercase tracking-wider">Zonas Comunes</h4>
          <p className="text-xs text-[#888888] font-primary mt-1">Configura las zonas compartidas del piso, añade fotos y vídeos específicos.</p>
        </div>
        <button
          type="button"
          onClick={addArea}
          className="bg-[#C9A962] text-black px-4 py-2 font-primary text-xs uppercase tracking-wider font-bold hover:bg-[#FAF8F5] transition-colors rounded-sm"
        >
          Agregar Zona Común
        </button>
      </div>

      {areas.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#1F1F1F] rounded-sm bg-[#070707]">
          <p className="font-primary text-xs text-[#666666] italic">No se han definido zonas comunes. Agrega una para comenzar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {areas.map((area, idx) => (
            <div key={area.id || idx} className="p-6 bg-[#090909] border border-[#1F1F1F] rounded-sm relative group">
              <button
                type="button"
                onClick={() => removeArea(idx)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors p-1"
                title="Eliminar esta zona común"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>Tipo de Zona Común</label>
                    <select
                      className={selectClass}
                      value={area.type}
                      onChange={(e) => updateArea(idx, { type: e.target.value as any })}
                    >
                      {COMMON_AREA_TYPES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Nombre / Etiqueta Personalizada (Opcional)</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={area.name || ''}
                      onChange={(e) => updateArea(idx, { name: e.target.value })}
                      placeholder="Ej: Cocina principal, Terraza ático..."
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Imágenes de la Zona
                  </label>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 font-primary text-[10px] text-[#888888] select-none cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] focus:ring-0"
                        checked={areaEnhance[area.id] ?? autoEnhance}
                        onChange={(e) => setAreaEnhance(prev => ({ ...prev, [area.id]: e.target.checked }))}
                      />
                      Mejorar fotos automáticamente con IA (Iluminación y color)
                    </label>
                  </div>
                  <SortableImageGallery
                    images={area.images || []}
                    onChange={(imgs) => updateArea(idx, { images: imgs })}
                    onUpload={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setUploading(`images-${idx}`);
                      try {
                        const shouldEnhance = areaEnhance[area.id] ?? autoEnhance;
                        const urls = [];
                        for (const f of files) {
                          const url = await uploadPropertyMedia(f, 'gallery', undefined, undefined, shouldEnhance);
                          urls.push(url);
                        }
                        updateArea(idx, { images: [...(area.images || []), ...urls] });
                        toast.success('Imágenes subidas con éxito');
                      } catch (err: any) {
                        toast.error(`Error al subir imágenes: ${err.message}`);
                      } finally {
                        setUploading(null);
                      }
                    }}
                    uploading={uploading === `images-${idx}`}
                  />
                </div>
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
                  {(area.videos || []).map((video, vIdx) => {
                    const isProcessing = typeof video === 'object' && video !== null && video.processing;
                    const url = typeof video === 'string' ? video : video.url;
                    
                    return (
                      <div key={vIdx} className="flex gap-4 p-4 bg-[#070707] border border-[#1F1F1F] group/video animate-fadeIn">
                        <div className="relative w-32 aspect-video bg-black overflow-hidden shrink-0">
                          <video src={url} className="w-full h-full object-cover" />
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

                          {/* IA & Download actions */}
                          {(() => {
                            const duration = durations[url] || (typeof video === 'object' && video.duration) || 0;

                            return (
                              <div className="flex flex-col gap-2 mt-1.5 border-t border-[#111] pt-1.5">
                                <div className="flex flex-wrap items-center gap-3">
                                  {duration > 0 && (
                                    <span className="font-primary text-[10px] text-[#666] select-none">
                                      Duración: {Math.floor(duration / 60)}m {Math.round(duration % 60)}s
                                    </span>
                                  )}

                                  <a
                                    href={url}
                                    download={`video_${vIdx + 1}.mp4`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] text-[#FAF8F5] hover:text-[#C9A962] font-primary uppercase tracking-wider font-bold transition-colors select-none"
                                  >
                                    <Download className="w-3 h-3" /> Descargar (Máx. Calidad)
                                  </a>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
