"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth.tsx';
import { X, User, Briefcase, Phone, Calendar, Upload, Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form fields
  const [agentName, setAgentName] = useState('');
  const [lastName, setLastName] = useState('');
  const [office, setOffice] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (userProfile) {
      setAgentName(userProfile.agent_name || '');
      setLastName(userProfile.last_name || '');
      setOffice(userProfile.office || '');
      setPhone(userProfile.phone || '');
      setBirthday(userProfile.birthday || '');
      setAvatarUrl(userProfile.avatar_url || '');
    }
  }, [userProfile, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_avatar_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Foto de perfil cargada. Haz clic en guardar para aplicar.');
    } catch (error: any) {
      console.error('[Avatar Upload Error]:', error);
      toast.error(`Error al subir imagen: ${error.message || error}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          agent_name: agentName,
          last_name: lastName || null,
          office: office || null,
          phone: phone || null,
          birthday: birthday || null,
          avatar_url: avatarUrl || null
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Perfil actualizado correctamente');
      onClose();
    } catch (error: any) {
      console.error('[Save Profile Error]:', error);
      toast.error(`Error al guardar: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const initials = agentName
    ? agentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F] bg-[#0F0F0F]">
          <h2 className="font-primary text-xs font-bold uppercase tracking-widest text-[#FAF8F5]">
            Configuración del Perfil
          </h2>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-[#C9A962] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6">
          
          {/* Avatar Upload zone */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 rounded-full border border-[#C9A962]/40 bg-[#0F0F0F] flex items-center justify-center overflow-hidden group shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-primary text-xl font-bold text-[#C9A962]">{initials}</span>
              )}
              
              {/* Hover overlay */}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[10px] font-primary font-bold uppercase tracking-wider text-[#C9A962] gap-1">
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Subir Foto</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                  disabled={uploadingAvatar} 
                />
              </label>
            </div>
            <p className="font-primary text-[9px] text-zinc-500 uppercase tracking-widest">
              Foto del Agente / Administrador
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="font-primary text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Nombre
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors"
                  placeholder="Ej: José Carlos"
                />
              </div>
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-1.5">
              <label className="font-primary text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Apellidos
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors"
                  placeholder="Ej: Delgado Gelabert"
                />
              </div>
            </div>

            {/* Oficina */}
            <div className="flex flex-col gap-1.5">
              <label className="font-primary text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Oficina
              </label>
              <select
                value={office}
                onChange={e => setOffice(e.target.value)}
                className="w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors appearance-none"
              >
                <option value="">Selecciona oficina...</option>
                <option value="Málaga">Málaga</option>
                <option value="Marbella">Marbella</option>
                <option value="Torremolinos">Torremolinos</option>
                <option value="Benalmádena">Benalmádena</option>
                <option value="Estepona">Estepona</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Teléfono */}
              <div className="flex flex-col gap-1.5">
                <label className="font-primary text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Teléfono
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors"
                  placeholder="Ej: +34 600 000 000"
                />
              </div>

              {/* Cumpleaños */}
              <div className="flex flex-col gap-1.5">
                <label className="font-primary text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Cumpleaños
                </label>
                <input 
                  type="date" 
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  className="w-full h-10 bg-[#0F0F0F] border border-[#1F1F1F] px-3 font-primary text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-[#1F1F1F] text-zinc-400 hover:text-[#FAF8F5] hover:bg-[#151515] transition-colors font-primary text-xs uppercase tracking-widest font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-[#C9A962] text-[#0A0A0A] hover:bg-[#FAF8F5] transition-colors font-primary text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
