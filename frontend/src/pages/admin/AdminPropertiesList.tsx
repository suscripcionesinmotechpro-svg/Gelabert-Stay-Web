import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProperties, usePropertyMutations } from '../../hooks/useProperties';
import type { Property, PropertyStatus, CommercialStatus } from '../../types/property';
import { STATUS_LABELS, STATUS_COLORS, OPERATION_LABELS, COMMERCIAL_STATUS_LABELS, COMMERCIAL_STATUS_COLORS } from '../../types/property';
import { PlusCircle, Edit, Trash2, Star, Eye, EyeOff, ChevronDown, CheckCheck, LayoutGrid, FolderArchive, Loader2, Filter, CloudLightning, CloudOff, Cloud, X, Link2, Link2Off, RefreshCw, Sparkles, Share2, GripVertical, Images, Video } from 'lucide-react';

// Facebook & Instagram icons (SVG inline)
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
import { PropertyReference } from '../../components/PropertyReference';
import { getOptimizedImage } from '../../utils/images';
import { getCommunityShareMessage } from '../../utils/whatsapp';
import { downloadPropertyImagesAsZip } from '../../utils/downloadPropertyImages';
import { formatPropertyPrice } from '../../utils/textUtils';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const WhatsAppIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function buildSocialCopy(prop: Property): string {
  const lines: string[] = [];

  const typeEmojis: Record<string, string> = {
    piso: '🏢', casa: '🏡', atico: '✨', loft: '🎨', estudio: '🏠',
    local: '🏪', oficina: '💼', nave: '🏭', terreno: '🌳', negocio: '💰', otro: '🏠',
  };
  const typeLabels: Record<string, string> = {
    piso: 'Piso',
    casa: 'Casa',
    atico: 'Ático',
    loft: 'Loft',
    estudio: 'Estudio',
    local: 'Local Comercial',
    oficina: 'Oficina',
    nave: 'Nave Industrial',
    terreno: 'Terreno',
    negocio: 'Negocio',
    otro: 'Inmueble',
  };
  const opLabels: Record<string, string> = {
    venta: 'En Venta',
    alquiler: 'En Alquiler',
    traspaso: 'Traspaso',
  };
  const rentTypeLabels: Record<string, string> = {
    temporal: '🗓️ Alquiler Temporal',
    habitual: '🏠 Alquiler Habitual',
    vacacional: '☀️ Alquiler Vacacional',
    habitaciones: '🚪 Alquiler de Habitaciones',
    otros: '📋 Alquiler',
  };

  const emoji = typeEmojis[prop.property_type] || '🏠';
  const typeLabel = typeLabels[prop.property_type] || 'Inmueble';
  const opLabel = opLabels[prop.operation] || '';

  lines.push(`${emoji} ${typeLabel}${opLabel ? ' — ' + opLabel : ''}`);
  lines.push('');

  const title = prop.title;
  if (title) lines.push(title);

  const locationParts = [prop.urbanization, prop.zone, prop.city].filter(Boolean);
  if (locationParts.length > 0) lines.push(`📍 ${locationParts.join(', ')}`);

  if (prop.orientation && Array.isArray(prop.orientation) && prop.orientation.length > 0) {
    const orientMap: Record<string, string> = {
      norte: 'Norte ↑', sur: 'Sur ↓', este: 'Este →', oeste: 'Oeste ←',
      noreste: 'Noreste ↗', noroeste: 'Noroeste ↖', sureste: 'Sureste ↘', suroeste: 'Suroeste ↙',
    };
    const oVal = prop.orientation[0]?.toLowerCase();
    const orientLabel = orientMap[oVal] || prop.orientation[0];
    lines.push(`🧭 Orientación ${orientLabel}`);
  }

  lines.push('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: prop.currency || 'EUR', maximumFractionDigits: 0 }).format(n);

  if (prop.price) {
    let priceStr = fmt(prop.price);
    if (prop.operation === 'alquiler') priceStr += '/mes';
    if (prop.max_price && prop.max_price > prop.price) priceStr += ` – ${fmt(prop.max_price)}/mes`;
    lines.push(`💰 ${priceStr}`);

    if (prop.operation === 'venta') {
      const costs: string[] = [];
      if (prop.community_fees) costs.push(`Comunidad: ${fmt(prop.community_fees)}/mes`);
      if (prop.ibi) costs.push(`IBI: ${fmt(prop.ibi)}/año`);
      if (prop.parking_included) costs.push('Parking incluido ✔️');
      else if (prop.parking_price) costs.push(`Parking: ${fmt(prop.parking_price)}`);
      if (costs.length > 0) lines.push(`   └ ${costs.join(' · ')}`);
    }

    if (prop.operation === 'alquiler') {
      const rentCosts: string[] = [];
      if (prop.parking_included) rentCosts.push('Parking incluido ✔️');
      else if (prop.parking_price) rentCosts.push(`Parking: ${fmt(prop.parking_price)}/mes`);
      if (rentCosts.length > 0) lines.push(`   └ ${rentCosts.join(' · ')}`);
    }
  }

  const residential = ['piso', 'casa', 'atico', 'loft', 'estudio'];
  const commercial = ['local', 'oficina', 'nave'];
  const feats: string[] = [];

  if (residential.includes(prop.property_type)) {
    if (prop.area_m2) feats.push(`📐 ${prop.area_m2} m²`);
    if (prop.bedrooms > 0) feats.push(`🛏 ${prop.bedrooms} hab.`);
    if (prop.bathrooms > 0) feats.push(`🚿 ${prop.bathrooms} baños`);
    if (prop.floor) feats.push(`🏢 Planta ${prop.floor}`);
    if (prop.has_elevator) feats.push(`🛗 Ascensor`);
    if (prop.is_furnished) feats.push(`🛋 Amueblado`);
    if (prop.is_exterior) feats.push(`🌤 Exterior`);
    if (prop.has_terrace) feats.push(`🌿 Terraza`);
    if (prop.has_balcony) feats.push(`🪟 Balcón`);
  } else if (commercial.includes(prop.property_type)) {
    if (prop.area_m2) feats.push(`📐 ${prop.area_m2} m²`);
    if (prop.floor) feats.push(`🏢 Planta ${prop.floor}`);
    if (prop.has_elevator) feats.push(`🛗 Ascensor`);
    const state = prop.conservation_state || prop.property_condition;
    if (state) feats.push(`✅ ${state}`);
  } else if (prop.property_type === 'terreno') {
    if (prop.area_m2) feats.push(`📐 ${prop.area_m2} m²`);
  } else if (prop.property_type === 'negocio') {
    if (prop.area_m2) feats.push(`📐 ${prop.area_m2} m²`);
    if (prop.is_furnished) feats.push(`🛋 Equipado`);
  } else {
    if (prop.area_m2) feats.push(`📐 ${prop.area_m2} m²`);
    if (prop.bedrooms > 0) feats.push(`🛏 ${prop.bedrooms} hab.`);
    if (prop.bathrooms > 0) feats.push(`🚿 ${prop.bathrooms} baños`);
  }

  if (feats.length > 0) {
    lines.push('');
    lines.push(feats.join('  ·  '));
  }

  const premiumFeats: string[] = [];
  if (prop.sea_views) premiumFeats.push(`🌊 Vistas al mar`);
  if (prop.has_pool) premiumFeats.push(`🏊 Piscina`);
  if (prop.garden) premiumFeats.push(`🌳 Jardín`);
  if (prop.has_patio) premiumFeats.push(`🌺 Patio`);
  if (prop.has_storage) premiumFeats.push(`📦 Trastero`);
  if (prop.air_conditioning) premiumFeats.push(`❄️ A/C`);
  if (prop.heating) premiumFeats.push(`🔥 Calefacción`);
  if (prop.has_fireplace) premiumFeats.push(`🪵 Chimenea`);
  if (prop.has_wardrobes) premiumFeats.push(`🚪 Armarios empotrados`);
  if (prop.pets_allowed) premiumFeats.push(`🐾 Se admiten mascotas`);

  if (premiumFeats.length > 0) {
    lines.push('');
    lines.push(premiumFeats.join('  ·  '));
  }

  const hiList = prop.highlights;
  if (Array.isArray(hiList) && hiList.length > 0) {
    lines.push('');
    lines.push('✨ Puntos destacados:');
    hiList.slice(0, 4).forEach((h: string) => lines.push(`  → ${h}`));
  }

  const shortDesc = prop.short_description;
  if (shortDesc) {
    lines.push('');
    const desc = shortDesc.trim();
    lines.push(desc.length > 220 ? desc.slice(0, 220).trimEnd() + '…' : desc);
  }

  if (prop.operation === 'alquiler') {
    const rentInfo: string[] = [];
    if (prop.rent_type && rentTypeLabels[prop.rent_type]) rentInfo.push(rentTypeLabels[prop.rent_type]);
    if (rentInfo.length > 0) {
      lines.push('');
      lines.push(rentInfo.join('  ·  '));
    }
  }

  if (prop.availability) {
    lines.push('');
    lines.push(`📅 Disponibilidad: ${prop.availability}`);
  }

  if (prop.operation === 'venta' && prop.energy_rating &&
      !['en tramite', 'en trámite', '-', ''].includes(prop.energy_rating.toLowerCase())) {
    lines.push('');
    lines.push(`⚡ Calificación energética: ${prop.energy_rating.toUpperCase()}`);
  }

  if (prop.virtual_tour_url) {
    lines.push('');
    lines.push(`🎥 Tour virtual: ${prop.virtual_tour_url}`);
  }

  const link = `https://gelaberthomes.es/propiedades/${prop.reference || prop.slug || prop.id}`;
  lines.push('');
  lines.push(`👉 Ficha completa: ${link}`);
  lines.push(`📞 Llámanos o escríbenos para una visita`);

  lines.push('');
  const cityTag = prop.city ? `#${prop.city.replace(/\s+/g, '')}` : '#Málaga';
  const zoneTag = prop.zone ? `#${prop.zone.replace(/[\s\-]+/g, '')}` : '';
  const typeHashtags: Record<string, string> = {
    piso: '#Piso', casa: '#Casa', atico: '#Atico', loft: '#Loft', estudio: '#Estudio',
    local: '#LocalComercial', oficina: '#Oficina', nave: '#NaveIndustrial',
    terreno: '#Terreno', negocio: '#Traspaso', otro: '#Inmueble',
  };
  const opHashtags: Record<string, string> = {
    venta: '#EnVenta', alquiler: '#EnAlquiler', traspaso: '#Traspaso',
  };
  const specialTags: string[] = [];
  if (prop.sea_views) specialTags.push('#VistasAlMar');
  if (prop.has_pool) specialTags.push('#ConPiscina');
  if (prop.operation === 'alquiler' && prop.rent_type === 'vacacional') specialTags.push('#AlquilerVacacional');
  if (prop.operation === 'alquiler' && prop.rent_type === 'habitaciones') specialTags.push('#Habitaciones');

  const hashtags = [
    '#GelabertHomes', '#Inmobiliaria', '#RealEstate',
    opHashtags[prop.operation] || '',
    typeHashtags[prop.property_type] || '#Inmueble',
    cityTag, zoneTag,
    prop.operation === 'alquiler' ? '#AlquilerMalaga' : '#VentaMalaga',
    '#PropiedadesMalaga',
    ...specialTags,
  ].filter(Boolean).join(' ');

  const resultHashtags = hashtags.trim();
  if (resultHashtags) {
    lines.push(resultHashtags);
  }

  return lines.join('\n');
}

const StatusDropdown = ({ property, onStatusChange }: { property: Property; onStatusChange: () => void }) => {
  const [open, setOpen] = useState(false);
  const { changeStatus } = usePropertyMutations();
  const statuses: PropertyStatus[] = ['publicada', 'borrador', 'oculta'];

  const handleChange = async (status: PropertyStatus) => {
    await changeStatus(property.id, status);
    setOpen(false);
    onStatusChange();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-primary font-bold rounded-sm ${STATUS_COLORS[property.status]}`}
      >
        {STATUS_LABELS[property.status]}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-[#161616] border border-[#1F1F1F] min-w-[140px] shadow-lg">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className={`w-full text-left px-3 py-2 font-primary text-xs transition-colors ${
                property.status === s ? 'text-[#C9A962] bg-[#C9A962]/10' : 'text-[#888888] hover:text-[#FAF8F5] hover:bg-[#1F1F1F]'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CommercialStatusDropdown = ({ property, onStatusChange }: { property: Property; onStatusChange: () => void }) => {
  const [open, setOpen] = useState(false);
  const { changeCommercialStatus } = usePropertyMutations();
  const statuses: CommercialStatus[] = ['disponible', 'reservado', 'alquilado', 'vendido', 'traspasado'];

  const handleChange = async (status: CommercialStatus) => {
    await changeCommercialStatus(property.id, status);
    setOpen(false);
    onStatusChange();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-primary font-bold rounded-sm ${COMMERCIAL_STATUS_COLORS[property.commercial_status]}`}
      >
        {COMMERCIAL_STATUS_LABELS[property.commercial_status]}
        {property.is_manual_commercial_status && (
          <span className="ml-1 text-[8px] bg-white/20 px-1 rounded-full" title="Manual">M</span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-[#161616] border border-[#1F1F1F] min-w-[140px] shadow-lg">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className={`w-full text-left px-3 py-2 font-primary text-xs transition-colors ${
                property.commercial_status === s ? 'text-[#C9A962] bg-[#C9A962]/10' : 'text-[#888888] hover:text-[#FAF8F5] hover:bg-[#1F1F1F]'
              }`}
            >
              {COMMERCIAL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminPropertiesList = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [agents, setAgents] = useState<{ id: string; agent_name: string; role: string }[]>([]);

  useEffect(() => {
    supabase.from('user_profiles')
      .select('id, agent_name, role')
      .in('role', ['admin', 'agent'])
      .then(({ data }) => {
        if (data) setAgents(data);
      });
  }, []);

  const { properties, loading, error, refetch } = useProperties(
    undefined, 
    true, 
    selectedAgentId === 'all' ? undefined : selectedAgentId
  );
  const { deleteProperty, toggleFeatured } = usePropertyMutations();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCommercial, setFilterCommercial] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [downloadedZip, setDownloadedZip] = useState<string | null>(null);
  const [idealistaLoading, setIdealistaLoading] = useState<string | null>(null);
  const [idealistaStatuses, setIdealistaStatuses] = useState<Record<string, Property['idealista_status']>>({});
  const [facebookLoading, setFacebookLoading] = useState<string | null>(null);
  const [facebookStatuses, setFacebookStatuses] = useState<Record<string, Property['facebook_status']>>({});
  const [instagramLoading, setInstagramLoading] = useState<string | null>(null);
  const [instagramStatuses, setInstagramStatuses] = useState<Record<string, Property['instagram_status']>>({});

  // ── Social Publish Modal ──
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProperty, setSocialProperty] = useState<Property | null>(null);
  const [socialPlatforms, setSocialPlatforms] = useState<{ facebook: boolean; instagram: boolean }>({ facebook: true, instagram: true });
  const [socialCopyFb, setSocialCopyFb] = useState('');
  const [socialCopyIg, setSocialCopyIg] = useState('');
  const [activePlatformTab, setActivePlatformTab] = useState<'facebook' | 'instagram'>('facebook');
  const [socialEnhanceLoading, setSocialEnhanceLoading] = useState(false);
  const [socialPublishing, setSocialPublishing] = useState(false);
  const [socialTone, setSocialTone] = useState<'premium' | 'emocional' | 'moderno'>('premium');
  // Image selection & ordering for social publish
  const [socialSelectedImages, setSocialSelectedImages] = useState<string[]>([]);
  const [socialIncludeVideo, setSocialIncludeVideo] = useState(false);
  const [socialVideoUrl, setSocialVideoUrl] = useState('');
  const dragImageIdx = useRef<number | null>(null);
  const dragOverImageIdx = useRef<number | null>(null);

  const handleOpenSocialModal = (p: Property, preselectedPlatform: 'facebook' | 'instagram') => {
    setSocialProperty(p);
    setSocialPlatforms({
      facebook: preselectedPlatform === 'facebook',
      instagram: preselectedPlatform === 'instagram',
    });
    setActivePlatformTab(preselectedPlatform);
    
    const baseCopy = buildSocialCopy(p);
    setSocialCopyFb(baseCopy);
    setSocialCopyIg(baseCopy);

    // Build the initial image list: main_image first, then gallery (deduplicated)
    const allImgs: string[] = [];
    if (p.main_image) allImgs.push(p.main_image);
    (p.gallery || []).forEach(img => {
      if (img && !allImgs.includes(img)) allImgs.push(img);
    });
    // Add rooms images for room rental properties
    if (p.is_room_rental && p.rooms && Array.isArray(p.rooms)) {
      p.rooms.forEach(room => {
        if (room.images && Array.isArray(room.images)) {
          room.images.forEach(img => {
            if (img && !allImgs.includes(img)) allImgs.push(img);
          });
        }
      });
    }
    // Add common areas images
    if (p.common_areas && Array.isArray(p.common_areas)) {
      p.common_areas.forEach(area => {
        if (area.images && Array.isArray(area.images)) {
          area.images.forEach(img => {
            if (img && !allImgs.includes(img)) allImgs.push(img);
          });
        }
      });
    }
    // Pre-select images based on target platforms (Instagram -> 10, Facebook -> 30)
    const initialLimit = preselectedPlatform === 'instagram' ? 10 : 30;
    setSocialSelectedImages(allImgs.slice(0, initialLimit));

    // Video settings
    const hasVideo = !!p.video_url && p.video_url.trim().startsWith('http') && p.video_url.toLowerCase().includes('.mp4');
    setSocialIncludeVideo(hasVideo);
    setSocialVideoUrl(p.video_url || '');

    setSocialModalOpen(true);
  };

  // ── Image drag-and-drop helpers ──
  const handleImageDragStart = (idx: number) => {
    dragImageIdx.current = idx;
  };
  const handleImageDragEnter = (idx: number) => {
    dragOverImageIdx.current = idx;
  };
  const handleImageDragEnd = () => {
    const from = dragImageIdx.current;
    const to = dragOverImageIdx.current;
    if (from === null || to === null || from === to) {
      dragImageIdx.current = null;
      dragOverImageIdx.current = null;
      return;
    }
    setSocialSelectedImages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    dragImageIdx.current = null;
    dragOverImageIdx.current = null;
  };
  const toggleSocialImage = (url: string) => {
    setSocialSelectedImages(prev => {
      if (prev.includes(url)) {
        // Must keep at least 1 image
        if (prev.length === 1) return prev;
        return prev.filter(u => u !== url);
      }
      const maxLimit = socialPlatforms.facebook ? 30 : 10;
      if (prev.length >= maxLimit) {
        toast.error(`Máximo ${maxLimit} imágenes por publicación.`);
        return prev;
      }
      return [...prev, url];
    });
  };

  const handleSocialPublish = async () => {
    if (!socialProperty) return;
    if (!socialPlatforms.facebook && !socialPlatforms.instagram) {
      toast.error('Selecciona al menos una red social.');
      return;
    }

    setSocialPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const platformsToPublish: ('facebook' | 'instagram')[] = [];
      if (socialPlatforms.facebook) platformsToPublish.push('facebook');
      if (socialPlatforms.instagram) platformsToPublish.push('instagram');

      for (const platform of platformsToPublish) {
        const platformLabel = platform === 'facebook' ? 'Facebook' : 'Instagram';
        const setPlatformLoading = platform === 'facebook' ? setFacebookLoading : setInstagramLoading;
        const setPlatformStatuses = platform === 'facebook' ? setFacebookStatuses : setInstagramStatuses;

        setPlatformLoading(socialProperty.id);
        
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-to-community`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              propertyId: socialProperty.id,
              action: `publish_${platform}`,
              trigger: 'manual',
              customCopyFb: socialCopyFb,
              customCopyIg: socialCopyIg,
              selectedImages: socialSelectedImages,
              includeVideo: socialIncludeVideo,
              customVideoUrl: socialVideoUrl,
            }),
          }
        );

        const result = await res.json();
        setPlatformLoading(null);

        if (!res.ok || result.error) {
          const errMsg = result.error || 'Error desconocido del servidor.';
          toast.error(`${platformLabel}: ${errMsg}`);
          setPlatformStatuses(prev => ({ ...prev, [socialProperty.id]: 'error' }));
        } else {
          const platformResult = result[platform];
          if (platformResult?.error) {
            toast.error(`${platformLabel}: ${platformResult.error}`);
            setPlatformStatuses(prev => ({ ...prev, [socialProperty.id]: 'error' }));
          } else {
            setPlatformStatuses(prev => ({ ...prev, [socialProperty.id]: 'published' }));
            toast.success(`✅ Publicado en ${platformLabel}`);
          }
        }
      }
      setSocialModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
    } finally {
      setSocialPublishing(false);
    }
  };

  const handleSocialEnhanceCopy = async () => {
    if (!socialProperty) return;
    setSocialEnhanceLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentText = activePlatformTab === 'facebook' ? socialCopyFb : socialCopyIg;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-to-community`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: 'enhance_copy',
            text: currentText,
            tone: socialTone,
            platform: activePlatformTab,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) {
        toast.error(`Error de IA: ${result.error || 'No se pudo optimizar el texto.'}`);
      } else {
        if (activePlatformTab === 'facebook') {
          setSocialCopyFb(result.enhancedText);
        } else {
          setSocialCopyIg(result.enhancedText);
        }
        toast.success(`✨ Texto de ${activePlatformTab === 'facebook' ? 'Facebook' : 'Instagram'} optimizado con IA`);
      }
    } catch (err: any) {
      toast.error(`Error al conectar con la IA: ${err.message}`);
    } finally {
      setSocialEnhanceLoading(false);
    }
  };

  // ── Idealista Import Modal ──
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  type ImportMatch = {
    idealista: { idealista_id: string; code: string; type: string; status: string; address: string; price: number | null };
    crm: Pick<Property, 'id' | 'title' | 'reference' | 'idealista_id' | 'idealista_status' | 'property_type' | 'city' | 'price' | 'main_image'> | null;
    auto_matched: boolean;
  };
  const [importMatches, setImportMatches] = useState<ImportMatch[]>([]);
  const [crmProperties, setCrmProperties] = useState<Pick<Property, 'id' | 'title' | 'reference' | 'idealista_id' | 'idealista_status' | 'property_type' | 'city' | 'price' | 'main_image'>[]>([]);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});

  const handleDownloadZip = async (p: Property) => {
    setDownloadingZip(p.id);
    try {
      await downloadPropertyImagesAsZip(p);
      setDownloadedZip(p.id);
      setTimeout(() => setDownloadedZip(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el ZIP.';
      alert(msg);
    } finally {
      setDownloadingZip(null);
    }
  };

  const handleShareToChannel = (p: Property) => {
    const text = getCommunityShareMessage(p);
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 3000);
      window.open('https://whatsapp.com/channel/0029Vb7ZmzoJUM2Ugg1Tdt0m', '_blank');
    });
  };

  const filtered = properties.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterCommercial && p.commercial_status !== filterCommercial) return false;
    if (filterOp && p.operation !== filterOp) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.reference?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    await deleteProperty(id);
    setDeleting(null);
    refetch();
  };

  const handleToggleFeatured = async (p: Property) => {
    await toggleFeatured(p.id, !p.is_featured);
    refetch();
  };

  const handleIdealistaSync = async (p: Property) => {
    const isPublished = (idealistaStatuses[p.id] ?? p.idealista_status) === 'published';
    const action = isPublished ? 'deactivate' : 'publish';
    const confirmMsg = isPublished
      ? `¿Desactivar "${p.title}" en Idealista? El anuncio dejará de aparecer en el portal.`
      : `¿Publicar "${p.title}" en Idealista?`;
    if (!confirm(confirmMsg)) return;

    setIdealistaLoading(p.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ propertyId: p.id, action }),
        }
      );
      const result = await res.json();
      if (result.error) {
        toast.error(`Idealista: ${result.error}`);
        setIdealistaStatuses(prev => ({ ...prev, [p.id]: 'error' }));
      } else {
        const newStatus = action === 'publish' ? 'published' : 'not_published';
        setIdealistaStatuses(prev => ({ ...prev, [p.id]: newStatus }));
        toast.success(action === 'publish' ? '✅ Publicado en Idealista' : '☁️ Desactivado en Idealista');
      }
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
      setIdealistaStatuses(prev => ({ ...prev, [p.id]: 'error' }));
    } finally {
      setIdealistaLoading(null);
    }
  };

  const getIdealistaStatus  = (p: Property) => idealistaStatuses[p.id]  ?? p.idealista_status  ?? 'not_published';
  const getFacebookStatus   = (p: Property) => facebookStatuses[p.id]   ?? p.facebook_status   ?? 'not_published';
  const getInstagramStatus  = (p: Property) => instagramStatuses[p.id]  ?? p.instagram_status  ?? 'not_published';

  const handleSocialSync = async (
    p: Property,
    platform: 'facebook' | 'instagram',
    currentStatus: Property['facebook_status'],
    setLoading: (id: string | null) => void,
    setStatuses: React.Dispatch<React.SetStateAction<Record<string, any>>>
  ) => {
    const isPublished = currentStatus === 'published';
    const action = isPublished
      ? `unpublish_${platform}`
      : `publish_${platform}`;
    const platformLabel = platform === 'facebook' ? 'Facebook' : 'Instagram';
    const confirmMsg = isPublished
      ? `¿Desactivar "${p.title}" en ${platformLabel}?`
      : `¿Publicar "${p.title}" en ${platformLabel}?`;
    if (!confirm(confirmMsg)) return;

    setLoading(p.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-to-community`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ propertyId: p.id, action, trigger: 'manual' }),
        }
      );
      const result = await res.json();
      
      if (!res.ok || result.error) {
        const errMsg = result.error || 'Error desconocido del servidor.';
        toast.error(`${platformLabel}: ${errMsg}`);
        setStatuses(prev => ({ ...prev, [p.id]: 'error' }));
        return;
      }

      const platformResult = result[platform];
      if (platformResult?.error) {
        toast.error(`${platformLabel}: ${platformResult.error}`);
        setStatuses(prev => ({ ...prev, [p.id]: 'error' }));
      } else if (!isPublished && !platformResult?.postId) {
        toast.error(`${platformLabel}: No se pudo publicar. Verifique la configuración en Supabase.`);
        setStatuses(prev => ({ ...prev, [p.id]: 'error' }));
      } else {
        const newStatus = isPublished ? 'not_published' : 'published';
        setStatuses(prev => ({ ...prev, [p.id]: newStatus }));
        toast.success(isPublished ? `☁️ Desactivado en ${platformLabel}` : `✅ Publicado en ${platformLabel}`);
      }
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
      setStatuses(prev => ({ ...prev, [p.id]: 'error' }));
    } finally {
      setLoading(null);
    }
  };

  const handleFacebookSync  = (p: Property) => handleSocialSync(p, 'facebook',  getFacebookStatus(p),  setFacebookLoading,  setFacebookStatuses);
  const handleInstagramSync = (p: Property) => handleSocialSync(p, 'instagram', getInstagramStatus(p), setInstagramLoading, setInstagramStatuses);

  const handleOpenImportModal = async () => {
    setImportModalOpen(true);
    setImportLoading(true);
    setImportMatches([]);
    setManualSelections({});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'fetch' }),
        }
      );
      const result = await res.json();
      if (result.error) {
        toast.error(`Error: ${result.error}`);
        setImportModalOpen(false);
      } else {
        setImportMatches(result.matches || []);
        setCrmProperties(result.crm_properties || []);
      }
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
      setImportModalOpen(false);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveImport = async () => {
    const mappings: { crm_id: string; idealista_id: string }[] = [];

    importMatches.forEach((m, idx) => {
      const manualCrmId = manualSelections[String(idx)];
      const crmId = manualCrmId || m.crm?.id;
      if (crmId && m.idealista.idealista_id) {
        mappings.push({ crm_id: crmId, idealista_id: m.idealista.idealista_id });
      }
    });

    if (mappings.length === 0) {
      toast.error('No hay emparejamientos para guardar.');
      return;
    }

    setImportSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'save', mappings }),
        }
      );
      const result = await res.json();
      if (result.error) {
        toast.error(`Error guardando: ${result.error}`);
      } else {
        toast.success(`✅ ${result.saved} propiedades vinculadas con Idealista`);
        setImportModalOpen(false);
        refetch();
        // Update local statuses
        mappings.forEach(m => {
          setIdealistaStatuses(prev => ({ ...prev, [m.crm_id]: 'published' }));
        });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setImportSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Propiedades</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">
            {loading ? 'Cargando propiedades...' : (
              filtered.length === 1 
                ? '1 propiedad encontrada'
                : `${filtered.length} propiedades encontradas`
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start flex-wrap">
          <button
            onClick={handleOpenImportModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1F17] text-[#4ADE80] border border-[#4ADE80]/30 font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#4ADE80]/10 transition-colors"
            title="Importar y vincular propiedades ya publicadas en Idealista"
          >
            <Link2 className="w-4 h-4" />
            Vincular Idealista
          </button>
          <Link
            to="/admin/propiedades/organizar"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#161616] text-[#FAF8F5] border border-[#1F1F1F] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#1F1F1F] transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Organizar Listado
          </Link>
          <Link
            to="/admin/propiedades/nueva"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Propiedad
          </Link>
        </div>
      </div>

      {/* Agent Selector Dropdown */}
      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-2.5 self-start rounded-sm">
        <Filter className="w-4 h-4 text-[#C9A962]" />
        <span className="font-primary text-xs text-[#666] uppercase tracking-wider font-bold">Filtrar por Agente:</span>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="bg-transparent text-[#C9A962] font-primary text-xs uppercase tracking-wider font-bold outline-none cursor-pointer"
        >
          <option value="all">Todas las Propiedades</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>
              {a.agent_name} ({a.role === 'admin' ? 'Admin' : 'Agente'})
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-[#0A0A0A] border border-[#1F1F1F] p-4">
        <input
          type="text"
          placeholder="Buscar por título o referencia..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">Todos los estados</option>
          {(['publicada','borrador','oculta'] as PropertyStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterCommercial}
          onChange={e => setFilterCommercial(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">Todos los estados com.</option>
          {(['disponible','reservado','alquilado','vendido','traspasado'] as CommercialStatus[]).map(s => (
            <option key={s} value={s}>{COMMERCIAL_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterOp}
          onChange={e => setFilterOp(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">Todas las operaciones</option>
          <option value="alquiler">Alquiler</option>
          <option value="venta">Venta</option>
          <option value="traspaso">Traspaso</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4">
          <p className="font-primary text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] border border-[#1F1F1F] gap-4">
          <PlusCircle className="w-12 h-12 text-[#333333]" />
          <p className="font-primary text-[#666666] text-sm">No se han encontrado propiedades.</p>
          <Link to="/admin/propiedades/nueva" className="font-primary text-[#C9A962] text-sm hover:underline">
            Añadir tu primera propiedad
          </Link>
        </div>
      ) : (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-[#1F1F1F] min-w-[1140px]">
            {[
              { key: 'property', label: 'Propiedad' },
              { key: 'operation', label: 'Operación' },
              { key: 'price', label: 'Precio' },
              { key: 'status', label: 'Estado' },
              { key: 'commercial', label: 'Comercial' },
              { key: 'featured', label: 'Dest.' },
              { key: 'idealista', label: 'Idealista' },
              { key: 'facebook', label: 'Facebook' },
              { key: 'instagram', label: 'Instagram' },
              { key: 'actions', label: 'Acciones' }
            ].map(h => (
              <span key={h.key} className="font-primary text-xs text-[#444444] uppercase tracking-wider">{h.label}</span>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map(p => (
            <div
              key={p.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-4 border-b border-[#1F1F1F] items-center hover:bg-[#0F0F0F] transition-colors min-w-[1140px]"
            >
              {/* Title + ref */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-[#1A1A1A] shrink-0 overflow-hidden border border-[#1F1F1F]">
                  {p.main_image ? (
                    <img src={getOptimizedImage(p.main_image, { width: 100, height: 100, format: 'webp' })} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#333333]">
                      <Eye className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-primary text-[#FAF8F5] text-sm font-bold truncate">{p.title}</p>
                  <PropertyReference 
                    reference={p.reference || p.id.slice(0, 8)} 
                    variant="minimal" 
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Operation */}
              <span className="font-primary text-[#888888] text-sm">{OPERATION_LABELS[p.operation]}</span>

              {/* Price */}
              <span className="font-secondary text-[#C9A962] text-sm">
                {formatPropertyPrice(p.price, p.price_type, p.max_price, p.currency, 'es')}
              </span>

              {/* Status dropdown */}
              <div><StatusDropdown property={p} onStatusChange={refetch} /></div>
              
              {/* Commercial Status dropdown */}
              <div><CommercialStatusDropdown property={p} onStatusChange={refetch} /></div>

              {/* Featured toggle */}
              <button
                onClick={() => handleToggleFeatured(p)}
                className={`transition-colors ${p.is_featured ? 'text-[#C9A962]' : 'text-[#333333] hover:text-[#C9A962]'}`}
                title={p.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
              >
                <Star className="w-4 h-4" fill={p.is_featured ? 'currentColor' : 'none'} />
              </button>

              {/* Idealista sync */}
              {(() => {
                const ist = getIdealistaStatus(p);
                const isLoading = idealistaLoading === p.id;
                const isPublished = ist === 'published';
                const isError = ist === 'error';
                return (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleIdealistaSync(p)}
                      disabled={isLoading}
                      title={isPublished ? 'Publicado en Idealista — click para desactivar' : isError ? 'Error en Idealista — click para reintentar' : 'Publicar en Idealista'}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${
                        isLoading
                          ? 'text-[#C9A962] border-[#C9A962]/40 bg-[#C9A962]/5 cursor-wait'
                          : isPublished
                          ? 'text-[#4ADE80] border-[#4ADE80]/40 bg-[#4ADE80]/10 hover:bg-[#4ADE80]/20'
                          : isError
                          ? 'text-[#F87171] border-[#F87171]/40 bg-[#F87171]/10 hover:bg-[#F87171]/20'
                          : 'text-[#555] border-[#2A2A2A] hover:text-[#C9A962] hover:border-[#C9A962]/40'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isPublished ? (
                        <Cloud className="w-3 h-3" />
                      ) : isError ? (
                        <CloudOff className="w-3 h-3" />
                      ) : (
                        <CloudLightning className="w-3 h-3" />
                      )}
                      <span>{isLoading ? '...' : isPublished ? 'ON' : isError ? 'ERR' : 'OFF'}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Facebook sync */}
              {(() => {
                const fst = getFacebookStatus(p);
                const isLoading = facebookLoading === p.id;
                const isPublished = fst === 'published';
                const isError = fst === 'error';
                return (
                  <div className="flex items-center">
                    <button
                      onClick={() => isPublished ? handleFacebookSync(p) : handleOpenSocialModal(p, 'facebook')}
                      disabled={isLoading}
                      title={isPublished ? 'Publicado en Facebook — click para desactivar' : isError ? 'Error en Facebook — click para reintentar' : 'Publicar en Facebook'}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${
                        isLoading
                          ? 'text-[#1877F2] border-[#1877F2]/40 bg-[#1877F2]/5 cursor-wait'
                          : isPublished
                          ? 'text-[#1877F2] border-[#1877F2]/40 bg-[#1877F2]/10 hover:bg-[#1877F2]/20'
                          : isError
                          ? 'text-[#F87171] border-[#F87171]/40 bg-[#F87171]/10 hover:bg-[#F87171]/20'
                          : 'text-[#555] border-[#2A2A2A] hover:text-[#1877F2] hover:border-[#1877F2]/40'
                      }`}
                    >
                      {isLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <FacebookIcon className="w-3 h-3" />}
                      <span>{isLoading ? '...' : isPublished ? 'ON' : isError ? 'ERR' : 'OFF'}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Instagram sync */}
              {(() => {
                const ist = getInstagramStatus(p);
                const isLoading = instagramLoading === p.id;
                const isPublished = ist === 'published';
                const isError = ist === 'error';
                return (
                  <div className="flex items-center">
                    <button
                      onClick={() => isPublished ? handleInstagramSync(p) : handleOpenSocialModal(p, 'instagram')}
                      disabled={isLoading}
                      title={isPublished ? 'Publicado en Instagram — click para desactivar' : isError ? 'Error en Instagram — click para reintentar' : 'Publicar en Instagram'}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${
                        isLoading
                          ? 'text-[#E1306C] border-[#E1306C]/40 bg-[#E1306C]/5 cursor-wait'
                          : isPublished
                          ? 'text-[#E1306C] border-[#E1306C]/40 bg-[#E1306C]/10 hover:bg-[#E1306C]/20'
                          : isError
                          ? 'text-[#F87171] border-[#F87171]/40 bg-[#F87171]/10 hover:bg-[#F87171]/20'
                          : 'text-[#555] border-[#2A2A2A] hover:text-[#E1306C] hover:border-[#E1306C]/40'
                      }`}
                    >
                      {isLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <InstagramIcon className="w-3 h-3" />}
                      <span>{isLoading ? '...' : isPublished ? 'ON' : isError ? 'ERR' : 'OFF'}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/propiedades/${p.id}/editar`}
                  className="p-1.5 text-[#888888] hover:text-[#C9A962] border border-transparent hover:border-[#C9A962] transition-all"
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleShareToChannel(p)}
                  className={`p-1.5 border transition-all flex items-center justify-center gap-1 ${
                    copiedId === p.id 
                      ? 'text-[#4ADE80] border-[#4ADE80] bg-[#4ADE80]/10' 
                      : 'text-[#888888] hover:text-[#4ADE80] border-transparent hover:border-[#4ADE80]'
                  }`}
                  title="Compartir en Canal WhatsApp"
                >
                  {copiedId === p.id ? <CheckCheck className="w-3.5 h-3.5" /> : <WhatsAppIcon />}
                  {copiedId === p.id && <span className="text-[8px] font-bold uppercase tracking-tighter">Copiado</span>}
                </button>
                {/* ZIP download button */}
                <button
                  onClick={() => handleDownloadZip(p)}
                  disabled={downloadingZip === p.id}
                  className={`p-1.5 border transition-all disabled:opacity-50 ${
                    downloadedZip === p.id
                      ? 'text-[#4ADE80] border-[#4ADE80] bg-[#4ADE80]/10'
                      : 'text-[#888888] hover:text-[#C9A962] border-transparent hover:border-[#C9A962]'
                  }`}
                  title="Descargar fotos en ZIP"
                >
                  {downloadingZip === p.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : downloadedZip === p.id
                      ? <CheckCheck className="w-3.5 h-3.5" />
                      : <FolderArchive className="w-3.5 h-3.5" />}
                </button>
                {p.status === 'publicada' ? (
                  <a href={`/propiedades/${p.slug || p.id}`} target="_blank" className="p-1.5 text-[#888888] hover:text-[#FAF8F5] border border-transparent hover:border-[#1F1F1F] transition-all" title="Ver en la web">
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="p-1.5 text-[#333333]" title="No publicada">
                    <EyeOff className="w-3.5 h-3.5" />
                  </span>
                )}
                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  disabled={deleting === p.id}
                  className="p-1.5 text-[#888888] hover:text-red-400 border border-transparent hover:border-red-400 transition-all disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Idealista Import Modal ── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-[#4ADE80]" />
                <div>
                  <h2 className="font-secondary text-xl text-[#FAF8F5]">Vincular con Idealista</h2>
                  <p className="font-primary text-xs text-[#666] mt-0.5">
                    Importa el estado de tus propiedades ya publicadas en Idealista y vincula con el CRM.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-2 text-[#666] hover:text-[#FAF8F5] border border-transparent hover:border-[#1F1F1F] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {importLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-8 h-8 text-[#4ADE80] animate-spin" />
                  <p className="font-primary text-[#666] text-sm">Consultando Idealista API...</p>
                </div>
              ) : importMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Link2Off className="w-10 h-10 text-[#333]" />
                  <p className="font-primary text-[#666] text-sm">No se encontraron propiedades en Idealista.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 px-3 py-2">
                    <span className="font-primary text-[10px] text-[#444] uppercase tracking-wider">Idealista</span>
                    <span className="font-primary text-[10px] text-[#444] uppercase tracking-wider text-center">Vinculación</span>
                    <span className="font-primary text-[10px] text-[#444] uppercase tracking-wider">CRM</span>
                  </div>

                  {importMatches.map((m, idx) => {
                    const selectedCrmId = manualSelections[String(idx)] ?? m.crm?.id ?? '';
                    const selectedCrm = crmProperties.find(c => c.id === selectedCrmId) ?? m.crm;
                    const isAutoMatched = m.auto_matched && !manualSelections[String(idx)];
                    const alreadyLinked = !!m.crm?.idealista_id;

                    return (
                      <div
                        key={m.idealista.idealista_id}
                        className={`grid grid-cols-[1fr_auto_1fr] gap-4 items-center p-3 border transition-colors ${
                          alreadyLinked
                            ? 'border-[#4ADE80]/20 bg-[#4ADE80]/5'
                            : isAutoMatched
                            ? 'border-[#C9A962]/20 bg-[#C9A962]/5'
                            : 'border-[#1F1F1F] bg-[#0F0F0F]'
                        }`}
                      >
                        {/* Idealista property */}
                        <div className="min-w-0">
                          <p className="font-primary text-xs text-[#FAF8F5] font-bold truncate">{m.idealista.address}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-primary text-[10px] text-[#666] bg-[#1A1A1A] px-1.5 py-0.5 rounded-sm">{m.idealista.code}</span>
                            <span className="font-primary text-[10px] text-[#666]">{m.idealista.type}</span>
                            {m.idealista.price && (
                              <span className="font-primary text-[10px] text-[#C9A962]">{m.idealista.price.toLocaleString('es-ES')} €</span>
                            )}
                            <span className={`font-primary text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                              m.idealista.status === 'activo' ? 'text-[#4ADE80] bg-[#4ADE80]/10' : 'text-[#888] bg-[#1A1A1A]'
                            }`}>
                              {m.idealista.status}
                            </span>
                          </div>
                        </div>

                        {/* Arrow / status indicator */}
                        <div className="flex flex-col items-center gap-1">
                          {alreadyLinked ? (
                            <Link2 className="w-4 h-4 text-[#4ADE80]" />
                          ) : (
                            <Link2Off className="w-4 h-4 text-[#444]" />
                          )}
                          {isAutoMatched && !alreadyLinked && (
                            <span className="font-primary text-[8px] text-[#C9A962] uppercase tracking-wider">Auto</span>
                          )}
                        </div>

                        {/* CRM selector */}
                        <div className="min-w-0">
                          {alreadyLinked ? (
                            <div>
                              <p className="font-primary text-xs text-[#4ADE80] font-bold truncate">{selectedCrm?.title ?? '—'}</p>
                              <p className="font-primary text-[10px] text-[#666] mt-0.5">Ya vinculado</p>
                            </div>
                          ) : (
                            <select
                              value={selectedCrmId}
                              onChange={e => setManualSelections(prev => ({ ...prev, [String(idx)]: e.target.value }))}
                              className="w-full bg-[#161616] border border-[#2A2A2A] text-[#FAF8F5] font-primary text-xs px-2 py-1.5 outline-none focus:border-[#C9A962] transition-colors"
                            >
                              <option value="">— Sin vincular —</option>
                              {crmProperties.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.title} {c.reference ? `[${c.reference}]` : ''}
                                  {c.idealista_id ? ' ✓' : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            {!importLoading && importMatches.length > 0 && (
              <div className="px-6 py-4 border-t border-[#1F1F1F] flex items-center justify-between gap-4">
                <div className="font-primary text-xs text-[#666]">
                  <span className="text-[#C9A962] font-bold">
                    {importMatches.filter((m, idx) => {
                      const id = manualSelections[String(idx)] ?? m.crm?.id;
                      return !!id && !m.crm?.idealista_id;
                    }).length}
                  </span>
                  {' '}nuevos vínculos a guardar
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenImportModal}
                    className="flex items-center gap-2 px-4 py-2 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:border-[#333] hover:text-[#FAF8F5] transition-colors"
                    title="Recargar datos de Idealista"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recargar
                  </button>
                  <button
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:border-[#333] hover:text-[#FAF8F5] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveImport}
                    disabled={importSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#4ADE80] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#22C55E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        Guardar vínculos
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Social Publish Modal ── */}
      {socialModalOpen && socialProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-255">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-[#C9A962]" />
                <div>
                  <h2 className="font-secondary text-xl text-[#FAF8F5]">Publicar en Redes Sociales</h2>
                  <p className="font-primary text-xs text-[#666] mt-0.5">
                    Previsualiza y edita el anuncio antes de lanzarlo. ¡Optimízalo con Inteligencia Artificial!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSocialModalOpen(false)}
                className="p-2 text-[#666] hover:text-[#FAF8F5] border border-transparent hover:border-[#1F1F1F] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* ── Image Selector ── */}
              {(() => {
                const prop = socialProperty!;
                const allImgs: string[] = [];
                if (prop.main_image) allImgs.push(prop.main_image);
                (prop.gallery || []).forEach(img => {
                  if (img && !allImgs.includes(img)) allImgs.push(img);
                });
                // Add rooms images for room rental properties
                if (prop.is_room_rental && prop.rooms && Array.isArray(prop.rooms)) {
                  prop.rooms.forEach(room => {
                    if (room.images && Array.isArray(room.images)) {
                      room.images.forEach(img => {
                        if (img && !allImgs.includes(img)) allImgs.push(img);
                      });
                    }
                  });
                }
                // Add common areas images
                if (prop.common_areas && Array.isArray(prop.common_areas)) {
                  prop.common_areas.forEach(area => {
                    if (area.images && Array.isArray(area.images)) {
                      area.images.forEach(img => {
                        if (img && !allImgs.includes(img)) allImgs.push(img);
                      });
                    }
                  });
                }
                if (allImgs.length === 0) return null;
                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Images className="w-4 h-4 text-[#C9A962]" />
                        <span className="font-primary text-xs font-bold text-[#FAF8F5] uppercase tracking-wider">Imágenes de la Publicación</span>
                        <span className="font-primary text-xs text-[#AAA] bg-[#1A1A1A] px-2 py-0.5 rounded-full">
                          {socialSelectedImages.length} seleccionada{socialSelectedImages.length !== 1 ? 's' : ''} · máx. {socialPlatforms.facebook ? 30 : 10}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSocialSelectedImages(allImgs.slice(0, socialPlatforms.facebook ? 30 : 10))}
                          disabled={socialPublishing}
                          className="font-primary text-xs text-[#AAA] hover:text-[#C9A962] uppercase tracking-wider transition-colors disabled:opacity-50"
                        >Seleccionar todas</button>
                        <span className="text-[#555]">/</span>
                        <button
                          onClick={() => setSocialSelectedImages(socialSelectedImages.length > 0 ? [socialSelectedImages[0]] : [])}
                          disabled={socialPublishing}
                          className="font-primary text-xs text-[#AAA] hover:text-[#C9A962] uppercase tracking-wider transition-colors disabled:opacity-50"
                        >Solo portada</button>
                      </div>
                    </div>

                    <p className="font-primary text-xs text-[#999] leading-relaxed">
                      ☝️ Haz clic para seleccionar / deseleccionar. Arrastra las imágenes <strong className="text-[#CCC]">seleccionadas</strong> para cambiar el orden. La primera imagen será la portada del carrusel.
                    </p>

                    {socialPlatforms.instagram && socialSelectedImages.length > 10 && (
                      <div className="bg-[#C9A962]/10 border border-[#C9A962]/20 text-[#C9A962] px-3 py-2 rounded-sm text-xs font-primary leading-normal flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">⚠️</span>
                        <span>
                          <strong>Nota para Instagram:</strong> Has seleccionado {socialSelectedImages.length} imágenes. Como Instagram solo admite un máximo de 10 imágenes en publicaciones carrusel, **solo se publicará el primer bloque de 10 imágenes** (las numeradas del 1 al 10 en tu orden de publicación). Facebook sí incluirá las {socialSelectedImages.length} imágenes completas.
                        </span>
                      </div>
                    )}

                    {/* All available images – click to toggle */}
                    <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-3">
                      <p className="font-primary text-xs text-[#888] uppercase tracking-wider font-bold mb-2">Todas las fotos disponibles — clic para incluir/excluir</p>
                      <div className="flex flex-wrap gap-2">
                        {allImgs.map((img) => {
                          const selIdx = socialSelectedImages.indexOf(img);
                          const isSelected = selIdx !== -1;
                          return (
                            <button
                              key={img}
                              onClick={() => !socialPublishing && toggleSocialImage(img)}
                              disabled={socialPublishing}
                              title={isSelected ? `Posición ${selIdx + 1} · clic para quitar` : 'Clic para añadir'}
                              className={`relative w-16 h-16 shrink-0 overflow-hidden border-2 rounded-sm transition-all group ${
                                isSelected
                                  ? 'border-[#C9A962] opacity-100'
                                  : 'border-[#2A2A2A] opacity-50 hover:opacity-75 hover:border-[#444]'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              {isSelected && (
                                <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-[#C9A962] text-[#0A0A0A] text-[9px] font-bold flex items-center justify-center rounded-sm shadow">
                                  {selIdx + 1}
                                </span>
                              )}
                              {!isSelected && (
                                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">+ Añadir</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected images – drag to reorder */}
                    {socialSelectedImages.length > 0 && (
                      <div className="bg-[#0F0F0F] border border-[#C9A962]/20 rounded-sm p-3">
                        <p className="font-primary text-xs text-[#C9A962] uppercase tracking-wider font-bold mb-2">Orden de publicación — arrastra para reordenar</p>
                        <div className="flex flex-wrap gap-2">
                          {socialSelectedImages.map((img, idx) => (
                            <div
                              key={img}
                              draggable
                              onDragStart={() => handleImageDragStart(idx)}
                              onDragEnter={() => handleImageDragEnter(idx)}
                              onDragEnd={handleImageDragEnd}
                              onDragOver={(e) => e.preventDefault()}
                              className="relative w-20 h-20 shrink-0 overflow-hidden border-2 border-[#C9A962]/50 rounded-sm cursor-grab active:cursor-grabbing group hover:border-[#C9A962] transition-all select-none"
                              title="Arrastra para reordenar"
                            >
                              <img src={img} alt="" className="w-full h-full object-cover pointer-events-none" />
                              {/* Position badge */}
                              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-[#C9A962] text-[#0A0A0A] text-[10px] font-bold flex items-center justify-center rounded-sm shadow pointer-events-none">
                                {idx + 1}
                              </span>
                              {/* Drag handle hint */}
                              <span className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <GripVertical className="w-3 h-3 text-white drop-shadow" />
                              </span>
                              {/* Remove button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); if (!socialPublishing) toggleSocialImage(img); }}
                                disabled={socialPublishing || socialSelectedImages.length === 1}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 text-white flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Quitar imagen"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                              {idx === 0 && (
                                <span className="absolute bottom-0.5 left-0.5 bg-[#C9A962] text-[#0A0A0A] text-[9px] font-bold px-1 py-0.5 rounded uppercase leading-4 pointer-events-none">Portada</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Video Section ── */}
              <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#C9A962]" />
                    <span className="font-primary text-xs font-bold text-[#FAF8F5] uppercase tracking-wider">Vídeo de la Publicación</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={socialIncludeVideo}
                      onChange={(e) => setSocialIncludeVideo(e.target.checked)}
                      disabled={socialPublishing}
                      className="w-3.5 h-3.5 rounded-sm border-[#2A2A2A] bg-[#161616] accent-[#C9A962] cursor-pointer"
                    />
                    <span className="font-primary text-xs text-[#AAA] group-hover:text-[#FAF8F5] transition-colors font-bold">
                      Incluir vídeo en el anuncio
                    </span>
                  </label>
                </div>

                {socialIncludeVideo && (
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr] gap-4 items-start">
                    <div className="flex flex-col gap-2">
                      <label className="font-primary text-xs text-[#888] uppercase tracking-wider font-bold">
                        Enlace directo del vídeo (.mp4)
                      </label>
                      <input
                        type="text"
                        value={socialVideoUrl}
                        onChange={(e) => setSocialVideoUrl(e.target.value)}
                        placeholder="https://ejemplo.com/video.mp4"
                        disabled={socialPublishing}
                        className="w-full bg-[#161616] border border-[#2A2A2A] p-2 text-xs font-primary text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors rounded-sm placeholder:text-[#444]"
                      />
                      <p className="font-primary text-[11px] text-[#666] leading-normal">
                        ☝️ Meta requiere un enlace público directo a un archivo de vídeo. Debe empezar con <code className="text-[#888]">http/https</code> y terminar en <code className="text-[#888]">.mp4</code>.
                      </p>
                      {socialVideoUrl && !socialVideoUrl.toLowerCase().includes('.mp4') && (
                        <p className="text-[#C9A962] font-primary text-[11px] font-bold">
                          ⚠️ La URL no parece terminar en .mp4. La publicación podría fallar en Facebook/Instagram.
                        </p>
                      )}
                    </div>

                    <div className="bg-[#161616] border border-[#2A2A2A] rounded-sm p-2 flex flex-col gap-2 items-center justify-center min-h-[100px] w-full">
                      {socialVideoUrl && socialVideoUrl.toLowerCase().includes('.mp4') ? (
                        <div className="w-full aspect-video bg-black rounded-sm overflow-hidden flex items-center justify-center border border-[#1A1A1A]">
                          <video
                            src={socialVideoUrl}
                            controls
                            muted
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-4 px-2">
                          <p className="font-primary text-[11px] text-[#555] italic">
                            Introduce una URL de vídeo .mp4 válida para previsualizarlo aquí.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Copy + Platforms row ── */}
              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
                {/* Copy Area (Left) */}
                <div className="flex flex-col gap-4">
                  {/* Platform Tabs */}
                  <div className="flex border-b border-[#1F1F1F]">
                    <button
                      onClick={() => setActivePlatformTab('facebook')}
                      disabled={socialPublishing}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-primary font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activePlatformTab === 'facebook'
                          ? 'text-[#1877F2] border-[#1877F2]'
                          : 'text-[#666] border-transparent hover:text-[#FAF8F5]'
                      }`}
                    >
                      <FacebookIcon className="w-3.5 h-3.5" />
                      Borrador Facebook
                    </button>
                    <button
                      onClick={() => setActivePlatformTab('instagram')}
                      disabled={socialPublishing}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-primary font-bold uppercase tracking-wider transition-all border-b-2 ${
                        activePlatformTab === 'instagram'
                          ? 'text-[#E1306C] border-[#E1306C]'
                          : 'text-[#666] border-transparent hover:text-[#FAF8F5]'
                      }`}
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      Borrador Instagram
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-primary text-xs text-[#AAA] font-bold uppercase tracking-wider">
                      Personalizar texto para {activePlatformTab === 'facebook' ? 'Facebook' : 'Instagram'}
                    </span>
                    
                    {/* AI Options */}
                    <div className="flex items-center gap-2">
                      <select
                        value={socialTone}
                        onChange={(e: any) => setSocialTone(e.target.value)}
                        className="bg-[#161616] border border-[#2A2A2A] text-[#FAF8F5] font-primary text-xs uppercase tracking-wider font-bold px-2 py-1 outline-none focus:border-[#C9A962] cursor-pointer"
                      >
                        <option value="premium">✨ Premium y Elegante</option>
                        <option value="emocional">❤️ Emocional y Cercano</option>
                        <option value="moderno">⚡ Moderno y Dinámico</option>
                      </select>
                      <button
                        onClick={handleSocialEnhanceCopy}
                        disabled={socialEnhanceLoading || socialPublishing}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] font-primary font-bold text-xs uppercase tracking-wider hover:bg-[#C9A962]/20 transition-all disabled:opacity-50"
                        title="Utiliza Inteligencia Artificial para mejorar este texto"
                      >
                        {socialEnhanceLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 animate-pulse text-[#C9A962]" />
                        )}
                        <span>{socialEnhanceLoading ? 'Mejorando...' : 'Optimizar con IA'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={activePlatformTab === 'facebook' ? socialCopyFb : socialCopyIg}
                    onChange={(e) => {
                      if (activePlatformTab === 'facebook') {
                        setSocialCopyFb(e.target.value);
                      } else {
                        setSocialCopyIg(e.target.value);
                      }
                    }}
                    disabled={socialPublishing}
                    rows={14}
                    className="w-full bg-[#161616] border border-[#1F1F1F] p-4 text-sm font-primary text-[#FAF8F5] leading-relaxed resize-none outline-none focus:border-[#C9A962] transition-colors rounded-sm placeholder:text-[#444] text-[13px]"
                    placeholder="Escribe la descripción del anuncio..."
                  />
                </div>

                {/* Preview and Platforms (Right) */}
                <div className="flex flex-col gap-6 bg-[#0F0F0F] border border-[#1F1F1F] p-5 rounded-sm">
                  <div>
                    <span className="font-primary text-xs text-[#AAA] font-bold uppercase tracking-wider block mb-3">Plataformas de Publicación</span>
                    
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={socialPlatforms.facebook}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSocialPlatforms(prev => ({ ...prev, facebook: checked }));
                            if (!checked && socialPlatforms.instagram && socialSelectedImages.length > 10) {
                              toast('Instagram tiene un límite de 10 imágenes. Se ha ajustado la selección.', { icon: '⚠️' });
                              setSocialSelectedImages(prev => prev.slice(0, 10));
                            }
                          }}
                          disabled={socialPublishing}
                          className="w-4 h-4 rounded-sm border-[#2A2A2A] bg-[#161616] accent-[#1877F2] cursor-pointer"
                        />
                        <FacebookIcon className={`w-4 h-4 transition-colors ${socialPlatforms.facebook ? 'text-[#1877F2]' : 'text-[#444] group-hover:text-[#888]'}`} />
                        <span className={`font-primary text-xs font-bold transition-colors ${socialPlatforms.facebook ? 'text-[#FAF8F5]' : 'text-[#666] group-hover:text-[#FAF8F5]'}`}>
                          Página Oficial de Facebook
                        </span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={socialPlatforms.instagram}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSocialPlatforms(prev => ({ ...prev, instagram: checked }));
                            if (checked && !socialPlatforms.facebook && socialSelectedImages.length > 10) {
                              toast('Instagram tiene un límite de 10 imágenes. Se ha ajustado la selección.', { icon: '⚠️' });
                              setSocialSelectedImages(prev => prev.slice(0, 10));
                            }
                          }}
                          disabled={socialPublishing}
                          className="w-4 h-4 rounded-sm border-[#2A2A2A] bg-[#161616] accent-[#E1306C] cursor-pointer"
                        />
                        <InstagramIcon className={`w-4 h-4 transition-colors ${socialPlatforms.instagram ? 'text-[#E1306C]' : 'text-[#444] group-hover:text-[#888]'}`} />
                        <span className={`font-primary text-xs font-bold transition-colors ${socialPlatforms.instagram ? 'text-[#FAF8F5]' : 'text-[#666] group-hover:text-[#FAF8F5]'}`}>
                          Instagram Business Account
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-[#1F1F1F] pt-4">
                    <span className="font-primary text-xs text-[#AAA] font-bold uppercase tracking-wider block mb-3">Compartir en Redes Personales</span>
                    
                    <button
                      onClick={() => {
                        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://gelaberthomes.es/propiedades/' + (socialProperty.reference || socialProperty.slug || socialProperty.id))}`;
                        window.open(shareUrl, '_blank');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-[#1877F2]/30 hover:border-[#1877F2]/60 hover:bg-[#1877F2]/5 text-[#1877F2] font-primary font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      <FacebookIcon className="w-3.5 h-3.5" />
                      Perfil Personal de Facebook (Manual)
                    </button>
                    <p className="font-primary text-xs text-[#888] mt-2 leading-normal">
                      * Meta no permite la publicación automatizada en perfiles personales mediante su API desde 2018. Utiliza este botón para compartirlo de forma manual en tu biografía.
                    </p>
                  </div>

                  {/* Card Preview */}
                  <div className="border-t border-[#1F1F1F] pt-4 mt-auto">
                    <span className="font-primary text-xs text-[#AAA] font-bold uppercase tracking-wider block mb-3">Previsualización del Anuncio</span>
                    
                    <div className="bg-[#161616] border border-[#1F1F1F] rounded-sm overflow-hidden flex gap-3 p-3">
                      <div className="w-16 h-16 shrink-0 bg-[#0A0A0A] overflow-hidden border border-[#2A2A2A] rounded-sm">
                        {socialSelectedImages[0] ? (
                          <img
                            src={getOptimizedImage(socialSelectedImages[0], { width: 100, height: 100, format: 'webp' })}
                            alt={socialProperty.title}
                            className="w-full h-full object-cover"
                          />
                        ) : socialProperty.main_image ? (
                          <img
                            src={getOptimizedImage(socialProperty.main_image, { width: 100, height: 100, format: 'webp' })}
                            alt={socialProperty.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#333]">
                            <Eye className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <p className="font-primary text-[#FAF8F5] text-xs font-bold truncate leading-tight">{socialProperty.title}</p>
                        <p className="font-primary text-[#AAA] text-xs mt-1 uppercase tracking-wider font-bold">
                          {socialProperty.reference || socialProperty.id.slice(0, 8)} · {socialProperty.city}
                        </p>
                        <p className="font-secondary text-[#C9A962] text-xs font-bold mt-1.5">
                          {formatPropertyPrice(socialProperty.price, socialProperty.price_type, socialProperty.max_price, socialProperty.currency, 'es')}
                        </p>
                        {socialSelectedImages.length > 1 && (
                          <p className="font-primary text-[9px] text-[#555] mt-1">
                            +{socialSelectedImages.length - 1} foto{socialSelectedImages.length > 2 ? 's' : ''} más
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1F1F1F] flex items-center justify-end gap-3">
              <button
                onClick={() => setSocialModalOpen(false)}
                disabled={socialPublishing}
                className="px-5 py-2 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:border-[#333] hover:text-[#FAF8F5] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSocialPublish}
                disabled={socialPublishing || socialEnhanceLoading}
                className="flex items-center gap-2 px-6 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#D4B673] transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {socialPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Publicar Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
