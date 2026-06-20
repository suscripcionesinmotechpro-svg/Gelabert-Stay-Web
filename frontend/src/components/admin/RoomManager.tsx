import React, { useState, useEffect } from 'react';
import { Plus, X, Upload, Video, Trash2, ShowerHead, Trees, Compass, Wind, Download, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadPropertyMedia } from '../../hooks/useProperties';
import { applyWatermark } from '../../utils/watermark';
import type { PropertyRoom } from '../../types/property';
import { SortableImageGallery } from './SortableImageGallery';
import { usePropertyContracts } from '../../hooks/useContracts';
import { toast } from 'react-hot-toast';
import { getVideoDuration, estimateVideoCost } from '../../utils/video';

interface RoomManagerProps {
  rooms: PropertyRoom[];
  onChange: (rooms: PropertyRoom[]) => void;
  propertyId?: string;
  autoEnhance?: boolean;
}

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const labelClass = "font-primary text-[10px] text-[#666666] uppercase tracking-wider mb-1 font-bold";

export const RoomManager: React.FC<RoomManagerProps> = ({ rooms, onChange, propertyId, autoEnhance = true }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [roomEnhance, setRoomEnhance] = useState<Record<string, boolean>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [processingVideo, setProcessingVideo] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'basic' | 'premium' | null>(null);
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

  const addRoom = () => {
    const newRoom: PropertyRoom = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Habitación ${rooms.length + 1}`,
      images: [],
      price: null,
      video: null,
      is_exterior: true
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

  const syncOriginalImages = (oldImages: string[], oldOriginals: string[], newImages: string[]) => {
    const newOriginals: string[] = [];
    newImages.forEach((url) => {
      const idx = oldImages.indexOf(url);
      if (idx !== -1 && oldOriginals && oldOriginals[idx]) {
        newOriginals.push(oldOriginals[idx]);
      } else {
        newOriginals.push(url);
      }
    });
    return newOriginals;
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;

    setUploading(`images-${index}`);
    try {
      const room = rooms[index];
      const roomLabel = room.name || `Habitación ${index + 1}`;
      const roomText = room.price ? `${roomLabel} - ${room.price}€` : roomLabel;
      const shouldEnhance = roomEnhance[room.id] ?? autoEnhance;

      const watermarkedUrls: string[] = [];
      const originalUrls: string[] = [];

      for (const f of files) {
        // 1. Upload original unwatermarked image
        const originalUrl = await uploadPropertyMedia(f, 'originals', undefined, undefined, shouldEnhance, true);
        
        // 2. Apply watermark locally
        const watermarkedFile = await applyWatermark(f, roomText, shouldEnhance);
        
        // 3. Upload watermarked image (skipping additional watermarking)
        const watermarkedUrl = await uploadPropertyMedia(watermarkedFile, 'gallery', undefined, undefined, shouldEnhance, true);
        
        watermarkedUrls.push(watermarkedUrl);
        originalUrls.push(originalUrl);
      }

      const currentImages = room.images || [];
      const currentOriginals = room.original_images || [];

      updateRoom(index, { 
        images: [...currentImages, ...watermarkedUrls],
        original_images: [...currentOriginals, ...originalUrls]
      });
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

  const handleEnhance = async (roomIdx: number, type: 'basic' | 'premium') => {
    const room = rooms[roomIdx];
    if (!room.video?.url) return;
    const url = room.video.url;
    const title = room.video.title || 'Tour Habitación';

    setProcessingVideo(url);
    setProcessingStatus(type === 'basic' ? 'Analizando con Gemini...' : 'Enviando a servidor premium...');

    try {
      const itemDuration = durations[url] || room.video.duration || 0;
      const costs = estimateVideoCost(itemDuration);
      const finalCost = type === 'basic' ? costs.basic : costs.premium;
      const log = type === 'basic'
        ? 'El vídeo original se descargó localmente en el servidor y fue analizado fotograma por fotograma con Gemini para evaluar iluminación, exposición y balance de blancos. Se aplicó una curva de compensación tonal localmente mediante filtros de color de FFmpeg. El archivo de vídeo original fue reemplazado por la versión optimizada.'
        : 'El vídeo original se envió al servicio de procesamiento en la nube con redes neuronales convolucionales. Se aplicó un proceso de estabilización digital de movimiento de cámara, reducción de ruido temporal e interpolación espacial para aumentar nitidez de bordes. El archivo original fue reemplazado por la versión premium.';

      if (type === 'basic') {
        const response = await fetch('/api/enhance-video-basic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: url, filename: url.split('/property-images/')[1] })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to enhance video basic');
        }
        const data = await response.json();
        updateRoom(roomIdx, { 
          video: { 
            url: data.enhancedUrl, 
            title,
            optimized: true,
            cost: finalCost,
            method: 'Ajuste de Luz (Gemini)',
            log,
            duration: itemDuration
          } 
        });
        toast.success('Vídeo optimizado con éxito');
      } else {
        const response = await fetch('/api/enhance-video-premium', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: url, filename: url.split('/property-images/')[1] })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to start premium enhance');
        }
        const data = await response.json();
        
        setProcessingStatus('Estabilizando y mejorando con IA...');
        let complete = false;
        let attempts = 0;
        const maxAttempts = 180; // 30 mins max (180 * 10s)
        
        while (!complete && attempts < maxAttempts) {
          attempts++;
          await new Promise(r => setTimeout(r, 10000));
          const checkRes = await fetch(`/api/enhance-video-premium?id=${data.id}&provider=${data.provider}&filename=${data.filename}`);
          if (!checkRes.ok) {
            throw new Error('Error al verificar estado de la optimización');
          }
          const checkData = await checkRes.json();
          if (checkData.status === 'succeeded') {
            updateRoom(roomIdx, { 
              video: { 
                url: checkData.enhancedUrl, 
                title,
                optimized: true,
                cost: finalCost,
                method: 'Ajuste Ultra Premium (IA)',
                log,
                duration: itemDuration
              } 
            });
            complete = true;
            toast.success('Vídeo de habitación estabilizado y mejorado con éxito');
          } else if (checkData.status === 'failed') {
            throw new Error(checkData.error || 'Fallo en el procesamiento premium');
          }
        }
        if (!complete) {
          throw new Error('El procesamiento tardó demasiado tiempo, inténtalo de nuevo.');
        }
      }
    } catch (e: any) {
      toast.error(`Error de optimización: ${e.message}`);
      console.error(e);
    } finally {
      setProcessingVideo(null);
      setProcessingStatus(null);
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
          {rooms.map((room, idx) => {
            const roomContracts = propertyId
              ? contracts.filter(c => c.room_id === room.id && c.status === 'active')
              : [];
            
            const activeContract = roomContracts.find(
              c => c.start_date <= today && c.end_date >= today
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

            return (
              <div key={room.id} className="relative group bg-[#0A0A0A] border border-[#1F1F1F] p-6 rounded-sm">
                <button
                  type="button"
                  onClick={() => removeRoom(idx)}
                  className="absolute top-4 right-4 text-[#444444] hover:text-red-500 transition-colors p-1"
                  title="Eliminar habitación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Precio mensual"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
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
                  </div>
                  {(room.status === 'alquilado' || room.status === 'reservado') && (
                    <div className="flex flex-col gap-2">
                      <label className={labelClass}>Próxima Disponibilidad (Manual)</label>
                      <input
                        type="date"
                        className={inputClass}
                        value={room.availability || ''}
                        onChange={(e) => updateRoom(idx, { availability: e.target.value || null })}
                      />
                    </div>
                  )}
                </div>

              {/* Private Bathroom, Terrace & Exterior/Interior Toggles */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#1F1F1F]">
                <button
                  type="button"
                  onClick={() => updateRoom(idx, { private_bathroom: !room.private_bathroom })}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all text-xs font-bold uppercase tracking-tight ${
                    room.private_bathroom
                      ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]'
                      : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#555] hover:border-[#444] hover:text-[#888]'
                  }`}
                >
                  <ShowerHead className="w-3.5 h-3.5" />
                  Baño privado
                  <span className={`ml-1 w-1.5 h-1.5 rounded-full ${room.private_bathroom ? 'bg-[#4ADE80]' : 'bg-[#333]'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => updateRoom(idx, { private_terrace: !room.private_terrace })}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all text-xs font-bold uppercase tracking-tight ${
                    room.private_terrace
                      ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]'
                      : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#555] hover:border-[#444] hover:text-[#888]'
                  }`}
                >
                  <Trees className="w-3.5 h-3.5" />
                  Terraza privada
                  <span className={`ml-1 w-1.5 h-1.5 rounded-full ${room.private_terrace ? 'bg-[#4ADE80]' : 'bg-[#333]'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => updateRoom(idx, { is_exterior: !room.is_exterior })}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all text-xs font-bold uppercase tracking-tight ${
                    room.is_exterior === true
                      ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]'
                      : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#555] hover:border-[#444] hover:text-[#888]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  {room.is_exterior === true ? 'Exterior' : 'Interior'}
                  <span className={`ml-1 w-1.5 h-1.5 rounded-full ${room.is_exterior === true ? 'bg-[#4ADE80]' : 'bg-[#333]'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => updateRoom(idx, { air_conditioning: !room.air_conditioning })}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all text-xs font-bold uppercase tracking-tight ${
                    room.air_conditioning
                      ? 'bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]'
                      : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#555] hover:border-[#444] hover:text-[#888]'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5" />
                  Aire acondicionado
                  <span className={`ml-1 w-1.5 h-1.5 rounded-full ${room.air_conditioning ? 'bg-[#4ADE80]' : 'bg-[#333]'}`} />
                </button>
              </div>

              {/* Room Gallery */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className={labelClass}>Fotos de la Habitación</label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={roomEnhance[room.id] ?? autoEnhance}
                        onChange={(e) => setRoomEnhance(prev => ({ ...prev, [room.id]: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded border-[#1F1F1F] bg-[#0A0A0A] text-[#C9A962] accent-[#C9A962] focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="font-primary text-[10px] text-[#FAF8F5]/60 hover:text-[#FAF8F5] transition-colors uppercase tracking-wider font-bold">
                        Embellecer con IA
                      </span>
                    </label>
                  </div>
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
                  onChange={(images) => {
                    const syncedOriginals = syncOriginalImages(room.images, room.original_images || [], images);
                    updateRoom(idx, { images, original_images: syncedOriginals });
                  }} 
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

                        {/* IA & Download actions */}
                        {(() => {
                          const url = room.video.url;
                          const duration = durations[url] || room.video.duration || 0;
                          const costs = estimateVideoCost(duration);

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

                                {processingVideo === url ? (
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#C9A962] font-primary uppercase tracking-wider font-bold animate-pulse select-none">
                                    <Loader2 className="w-3 h-3 animate-spin" /> {processingStatus || 'Procesando...'}
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedOption(null); setActiveMenu(activeMenu === url ? null : url); }}
                                      className="flex items-center gap-1 text-[10px] text-[#C9A962] hover:underline font-primary uppercase tracking-wider font-bold transition-all"
                                    >
                                      <Sparkles className="w-3 h-3" /> Optimizar con IA
                                    </button>
                                    
                                    {activeMenu === url && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                        <div className="absolute left-0 bottom-full mb-2 bg-[#0A0A0A] border border-[#1F1F1F] p-3 flex flex-col gap-2 w-64 z-20 shadow-xl rounded-sm">
                                          <p className="font-primary text-[9px] uppercase tracking-wider text-[#555] font-bold px-1 select-none">Seleccionar Tipo de Mejora</p>
                                          
                                          <button
                                            type="button"
                                            onClick={() => setSelectedOption('basic')}
                                            className={`w-full text-left p-2 transition-all flex flex-col rounded-sm border ${
                                              selectedOption === 'basic'
                                                ? 'border-[#C9A962] bg-[#C9A962]/10'
                                                : 'border-[#1F1F1F] hover:bg-[#1A1A1A] bg-transparent'
                                            }`}
                                          >
                                            <span className="font-primary text-[10px] text-[#FAF8F5] font-bold">A. Ajuste de Luz (Gemini)</span>
                                            <span className="font-primary text-[9px] text-[#666]">Luz y contraste optimizados • Coste: {costs.basic}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => setSelectedOption('premium')}
                                            className={`w-full text-left p-2 transition-all flex flex-col rounded-sm border ${
                                              selectedOption === 'premium'
                                                ? 'border-[#C9A962] bg-[#C9A962]/10'
                                                : 'border-[#1F1F1F] hover:bg-[#1A1A1A] bg-transparent'
                                            }`}
                                          >
                                            <span className="font-primary text-[10px] text-[#C9A962] font-bold">B. Ajuste Ultra Premium (IA)</span>
                                            <span className="font-primary text-[9px] text-[#666]">Estabilizado, nitidez y reducción de ruido • Coste: {costs.premium}</span>
                                          </button>

                                          <button
                                            type="button"
                                            disabled={!selectedOption}
                                            onClick={() => {
                                              if (selectedOption) {
                                                setActiveMenu(null);
                                                handleEnhance(idx, selectedOption);
                                                setSelectedOption(null);
                                              }
                                            }}
                                            className={`w-full py-1.5 mt-1 text-center font-primary text-[10px] uppercase tracking-wider font-bold rounded-sm transition-all ${
                                              selectedOption
                                                ? 'bg-[#C9A962] text-black hover:bg-[#FAF8F5] cursor-pointer'
                                                : 'bg-[#151515] text-[#444] cursor-not-allowed border border-[#1F1F1F]'
                                            }`}
                                          >
                                            Comenzar Optimización
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Check de Optimización y Detalles */}
                              {room.video.optimized && (
                                <div className="mt-1 p-2.5 bg-green-950/20 border border-green-500/30 rounded-sm flex flex-col gap-1.5 select-none text-left">
                                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                    Vídeo Optimizado con IA
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[9px] font-primary text-[#888]">
                                    <div>
                                      <span className="text-[#555] font-bold uppercase tracking-tight">Método:</span>{' '}
                                      <span className="text-[#FAF8F5]">{room.video.method}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#555] font-bold uppercase tracking-tight">Coste cobrado:</span>{' '}
                                      <span className="text-[#FAF8F5]">{room.video.cost}</span>
                                    </div>
                                  </div>
                                  {room.video.log && (
                                    <div className="text-[9px] font-primary text-[#777] leading-relaxed border-t border-[#1F1F1F] pt-1.5">
                                      <span className="text-[#555] font-bold uppercase tracking-tight block mb-0.5">Proceso de optimización:</span>
                                      {room.video.log}
                                    </div>
                                  )}
                                </div>
                              )}
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
