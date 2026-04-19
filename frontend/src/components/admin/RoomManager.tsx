import React, { useState } from 'react';
import { Plus, X, Upload, Video, Trash2 } from 'lucide-react';
import { uploadPropertyMedia } from '../../hooks/useProperties';
import type { PropertyRoom } from '../../types/property';
import { SortableImageGallery } from './SortableImageGallery';

interface RoomManagerProps {
  rooms: PropertyRoom[];
  onChange: (rooms: PropertyRoom[]) => void;
}

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const labelClass = "font-primary text-[10px] text-[#666666] uppercase tracking-wider mb-1 font-bold";

export const RoomManager: React.FC<RoomManagerProps> = ({ rooms, onChange }) => {
  const [uploading, setUploading] = useState<string | null>(null);

  const addRoom = () => {
    const newRoom: PropertyRoom = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Habitación ${rooms.length + 1}`,
      images: [],
      price: null,
      video: null
    };
    onChange([...rooms, newRoom]);
  };

  const removeRoom = (index: number) => {
    const newRooms = [...rooms];
    newRooms.splice(index, 1);
    onChange(newRooms);
  };

  const updateRoom = (index: number, updates: Partial<PropertyRoom>) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], ...updates };
    onChange(newRooms);
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
      const currentImages = rooms[index].images || [];
      updateRoom(index, { images: [...currentImages, ...urls] });
    } catch (err) {
      console.error('Error uploading room images:', err);
    } finally {
      setUploading(null);
    }
  };

  const handleVideoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(`video-${index}`);
    try {
      const url = await uploadPropertyMedia(file, 'videos');
      updateRoom(index, { 
        video: { url, title: rooms[index].video?.title || 'Tour Habitación' } 
      });
    } catch (err) {
      console.error('Error uploading room video:', err);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
        <h3 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">
          Gestión de Habitaciones
        </h3>
        <button
          type="button"
          onClick={addRoom}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A962]/10 text-[#C9A962] border border-[#C9A962]/20 rounded-sm hover:bg-[#C9A962]/20 transition-all text-xs font-bold uppercase tracking-tight"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir Habitación
        </button>
      </div>

      {!rooms.length ? (
        <div className="py-12 text-center border border-dashed border-[#1F1F1F] rounded-sm bg-[#070707]">
          <p className="text-[#444444] text-xs uppercase tracking-widest italic">
            No se han añadido habitaciones todavía
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {rooms.map((room, idx) => (
            <div key={room.id} className="relative group bg-[#0A0A0A] border border-[#1F1F1F] p-6 rounded-sm">
              <button
                type="button"
                onClick={() => removeRoom(idx)}
                className="absolute top-4 right-4 text-[#444444] hover:text-red-500 transition-colors p-1"
                title="Eliminar habitación"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Nombre de la Habitación</label>
                  <input
                    className={inputClass}
                    value={room.name}
                    onChange={(e) => updateRoom(idx, { name: e.target.value })}
                    placeholder="Ej: Habitación 1 - Exterior"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Precio Mensual (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#444444] font-bold">€</span>
                    <input
                      type="number"
                      className={`${inputClass} !pl-8`}
                      value={room.price ?? ''}
                      onChange={(e) => updateRoom(idx, { price: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Precio mensual"
                    />
                  </div>
                </div>
              </div>

              {/* Room Gallery */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Fotos de la Habitación</label>
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
                  images={room.images} 
                  onChange={(images) => updateRoom(idx, { images })} 
                />
              </div>

              {/* Room Video */}
              <div className="space-y-4 pt-6 border-t border-[#1F1F1F]">
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
                      <div className="relative w-40 aspect-video bg-black border border-[#1F1F1F] group/video">
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
          ))}
        </div>
      )}
    </div>
  );
};
