import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Video, Trash2, ShowerHead, Trees, Compass, Wind, Download } from 'lucide-react';
import { uploadPropertyMedia } from '../../hooks/useProperties';
import { applyWatermark } from '../../utils/watermark';
import type { PropertyRoom } from '../../types/property';
import { SortableImageGallery } from './SortableImageGallery';
import { usePropertyContracts } from '../../hooks/useContracts';
import { toast } from 'react-hot-toast';
import { getVideoDuration } from '../../utils/video';

interface RoomManagerProps {
  rooms: PropertyRoom[];
  onChange: (rooms: PropertyRoom[]) => void;
  propertyId?: string;
  autoEnhance?: boolean;
  propertyName?: string;
}

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const labelClass = "font-primary text-[10px] text-[#666666] uppercase tracking-wider mb-1 font-bold";

export const RoomManager: React.FC<RoomManagerProps> = ({ 
  rooms, 
  onChange, 
  propertyId, 
  autoEnhance = true,
  propertyName
}) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [roomEnhance, setRoomEnhance] = useState<Record<string, boolean>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});

  const { contracts } = usePropertyContracts(propertyId);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    rooms.forEach((room) => {
      if (room.video?.url && !durations[room.video.url]) {
        getVideoDuration(room.video.url).then((d) => {
          if (d > 0) {
            setDurations((prev) => ({ ...prev, [room.video!.url]: d }));
          }
        });
      }
    });
  }, [rooms]);

  // Background Polling Effect to check state of asynchronous room video optimizations
  // NOTE: Polling is handled globally by useGlobalVideoPolling hook (in AdminLayout / AgentLayout).
  // No local polling here to avoid race conditions.

  const addRoom = () => {
    const newRoom: PropertyRoom = {
      id: Math.random().toString(36).slice(2, 9),
      name: '',
      images: [],
      video: null,
      price: undefined,
      private_bathroom: false,
      private_terrace: false,
      is_exterior: false,
      air_conditioning: false,
      has_ac: false,
      status: 'disponible',
      availability: null
    };
    onChange([...rooms, newRoom]);
  };

  const removeRoom = (idx: number) => {
    onChange(rooms.filter((_, i) => i !== idx));
  };

  const updateRoom = (idx: number, fields: Partial<PropertyRoom>) => {
    const updated = [...rooms];
    updated[idx] = { ...updated[idx], ...fields };
    onChange(updated);
  };

  const handleVideoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(`video-${idx}`);
    try {
      const shouldEnhance = roomEnhance[rooms[idx].id] ?? autoEnhance;
      const url = await uploadPropertyMedia(file, 'videos', undefined, undefined, shouldEnhance);
      updateRoom(idx, {
        video: {
          url,
          title: 'Tour Habitación'
        }
      });
      toast.success('Vídeo subido con éxito');
    } catch (err: any) {
      toast.error(`Error al subir vídeo: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };



  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4">
        <div>
          <h4 className="font-secondary text-sm text-[#FAF8F5] uppercase tracking-wider">Gestión de Habitaciones</h4>
          <p className="text-xs text-[#888888] font-primary mt-1">Configura las habitaciones individuales, sus precios, contratos y multimedia.</p>
        </div>
        <button
          type="button"
          onClick={addRoom}
          className="bg-[#C9A962] text-black px-4 py-2 font-primary text-xs uppercase tracking-wider font-bold hover:bg-[#FAF8F5] transition-colors rounded-sm"
        >
          Agregar Habitación
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#1F1F1F] rounded-sm bg-[#070707]">
          <p className="font-primary text-xs text-[#666666] italic">No se han definido habitaciones. Agrega una para comenzar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {rooms.map((room, idx) => {
            const roomContracts = propertyId
              ? contracts.filter(c => c.room_id === room.id && c.status === 'active')
              : [];
            
            const activeContract = roomContracts.find(
              c => c.start_date <= today && (!c.end_date || c.end_date >= today)
            );
            const upcomingContract = !activeContract
              ? roomContracts.find(c => c.start_date > today)
              : null;

            const activeTenantName = activeContract?.tenant
              ? `${activeContract.tenant.first_name} ${activeContract.tenant.last_name}`
              : '';
            const upcomingTenantName = upcomingContract?.tenant
              ? `${upcomingContract.tenant.first_name} ${upcomingContract.tenant.last_name}`
              : '';

            const tenantName = activeTenantName || upcomingTenantName || null;
            const tenantId = activeContract?.tenant_id || upcomingContract?.tenant_id || null;

            return (
              <div key={room.id || idx} className="p-6 bg-[#090909] border border-[#1F1F1F] rounded-sm relative group animate-fadeIn">
                <button
                  type="button"
                  onClick={() => removeRoom(idx)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors p-1"
                  title="Eliminar esta habitación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Nombre de la Habitación</label>
                        <input
                          type="text"
                          className={inputClass}
                          value={room.name}
                          onChange={(e) => updateRoom(idx, { name: e.target.value })}
                          placeholder="Ej: Habitación 1 - Exterior"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Precio Mensual (€)</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={room.price || ''}
                          onChange={(e) => updateRoom(idx, { price: e.target.value ? Number(e.target.value) : null })}
                          placeholder="Ej: 450"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Estado de la Habitación</label>
                        <select
                          className={inputClass}
                          value={room.status || 'disponible'}
                          onChange={(e) => updateRoom(idx, { status: e.target.value as any })}
                        >
                          <option value="disponible">
                            {activeContract
                              ? 'Alquilado (Automático)'
                              : upcomingContract
                                ? 'Reservado (Automático)'
                                : 'Disponible (Automático)'}
                          </option>
                          <option value="reservado">Reservado (Manual)</option>
                          <option value="alquilado">Alquilado (Manual)</option>
                        </select>
                      </div>
                      {(room.status === 'alquilado' || room.status === 'reservado') ? (
                        <div>
                          <label className={labelClass}>Próxima Disponibilidad (Manual)</label>
                          <input
                            type="date"
                            className={inputClass}
                            value={room.availability || ''}
                            onChange={(e) => updateRoom(idx, { availability: e.target.value || null })}
                          />
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    {activeContract && (
                      <p className="text-[10px] text-[#A78BFA] leading-tight font-semibold mt-1">
                        ⚠️ Alquilada automáticamente por contrato activo con {activeTenantName || 'inquilino'} (hasta {new Date(activeContract.end_date).toLocaleDateString()}).
                      </p>
                    )}
                    {upcomingContract && (
                      <p className="text-[10px] text-[#FB923C] leading-tight font-semibold mt-1">
                        ⚠️ Reservada automáticamente por contrato futuro con {upcomingTenantName || 'inquilino'} (desde {new Date(upcomingContract.start_date).toLocaleDateString()}).
                      </p>
                    )}

                    <div className="flex flex-col gap-2 bg-[#0A0A0A] p-4 border border-[#1F1F1F] rounded-sm">
                      <span className="font-primary text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1 block">Características</span>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 font-primary text-xs text-[#FAF8F5] cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] focus:ring-0 w-4 h-4"
                            checked={room.private_bathroom || false}
                            onChange={(e) => updateRoom(idx, { private_bathroom: e.target.checked })}
                          />
                          <ShowerHead className="w-3.5 h-3.5 text-[#C9A962]/70" /> Baño Privado
                        </label>

                        <label className="flex items-center gap-2 font-primary text-xs text-[#FAF8F5] cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] focus:ring-0 w-4 h-4"
                            checked={room.private_terrace || false}
                            onChange={(e) => updateRoom(idx, { private_terrace: e.target.checked })}
                          />
                          <Trees className="w-3.5 h-3.5 text-[#C9A962]/70" /> Terraza Privada
                        </label>

                        <label className="flex items-center gap-2 font-primary text-xs text-[#FAF8F5] cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] focus:ring-0 w-4 h-4"
                            checked={room.is_exterior || false}
                            onChange={(e) => updateRoom(idx, { is_exterior: e.target.checked })}
                          />
                          <Compass className="w-3.5 h-3.5 text-[#C9A962]/70" /> Exterior
                        </label>

                        <label className="flex items-center gap-2 font-primary text-xs text-[#FAF8F5] cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] focus:ring-0 w-4 h-4"
                            checked={room.air_conditioning || room.has_ac || false}
                            onChange={(e) => updateRoom(idx, { air_conditioning: e.target.checked, has_ac: e.target.checked })}
                          />
                          <Wind className="w-3.5 h-3.5 text-[#C9A962]/70" /> A/A Individual
                        </label>
                      </div>
                    </div>

                    {tenantName && (
                      <div className="bg-[#C9A962]/5 border border-[#C9A962]/20 rounded-sm p-3 flex flex-col gap-1">
                        <span className="font-primary text-[9px] text-[#C9A962] uppercase tracking-wider font-bold">Estado de Ocupación</span>
                        <p className="font-primary text-xs text-[#FAF8F5]">
                          {activeContract ? 'Alquilada a: ' : 'Reservada para: '}
                          <span className="font-bold text-[#C9A962]">{tenantName}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Imágenes de la Habitación</label>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="flex items-center gap-2 font-primary text-[10px] text-[#888888] select-none cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] focus:ring-0"
                          checked={roomEnhance[room.id] ?? autoEnhance}
                          onChange={(e) => setRoomEnhance(prev => ({ ...prev, [room.id]: e.target.checked }))}
                        />
                        Mejorar fotos automáticamente con IA (Iluminación y color)
                      </label>
                    </div>
                    <SortableImageGallery
                      images={room.images || []}
                      onChange={(imgs) => updateRoom(idx, { images: imgs })}
                      onUpload={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setUploading(`images-${idx}`);
                        try {
                          const shouldEnhance = roomEnhance[room.id] ?? autoEnhance;
                          const label = room.name || `Habitación ${idx + 1}`;
                          const roomText = room.price ? `${label} - ${room.price}€` : label;
                          const urls = [];
                          for (const f of files) {
                            const originalUrl = await uploadPropertyMedia(f, 'originals', undefined, undefined, shouldEnhance, true);
                            const watermarkedFile = await applyWatermark(f, roomText, shouldEnhance);
                            const watermarkedUrl = await uploadPropertyMedia(watermarkedFile, 'gallery', undefined, undefined, shouldEnhance, true);
                            urls.push(watermarkedUrl);
                          }
                          updateRoom(idx, { images: [...(room.images || []), ...urls] });
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

                {/* Room Video */}
                <div className="space-y-4 pt-6 border-t border-[#1F1F1F] mt-6">
                  <label className={labelClass}>Vídeo de la Habitación</label>
                  
                  {!room.video?.url ? (
                    <label className="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-[#1F1F1F] rounded-sm cursor-pointer hover:bg-[#0F0F0F] hover:border-[#444444] transition-all">
                      <Video className="w-6 h-6 text-[#444444]" />
                      <span className="text-[10px] text-[#666666] uppercase tracking-widest font-bold">Subir vídeo de la habitación</span>
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideoUpload(idx, e)} />
                    </label>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="relative w-40 aspect-video bg-black border border-[#1F1F1F] group/video rounded-sm overflow-hidden">
                          <video src={room.video.url} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateRoom(idx, { video: null })}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover/video:scale-100 transition-transform"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <label className={labelClass}>Título del Vídeo</label>
                          <input
                            className={inputClass}
                            value={room.video.title}
                            onChange={(e) => updateRoom(idx, { video: { ...room.video!, title: e.target.value } })}
                            placeholder="Ej: Tour de la habitación"
                          />
                          <p className="text-[10px] text-[#444444] italic">Este título se mostrará en el reproductor de vídeo.</p>

                          {/* IA & Download actions */}
                          {(() => {
                            const url = room.video.url;
                            const duration = durations[url] || room.video.duration || 0;

                            return (
                              <div className="flex flex-col gap-2 mt-2.5 border-t border-[#111] pt-2">
                                <div className="flex flex-wrap items-center gap-3">
                                  {duration > 0 && (
                                    <span className="font-primary text-[10px] text-[#666] select-none">
                                      Duración: {Math.floor(duration / 60)}m {Math.round(duration % 60)}s
                                    </span>
                                  )}

                                  <a
                                    href={url}
                                    download={`video_room_${idx + 1}.mp4`}
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
                    </div>
                  )}
                  
                  {uploading === `video-${idx}` && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-[#C9A962] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-[#C9A962] uppercase tracking-widest animate-pulse font-bold">Subiendo vídeo...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
