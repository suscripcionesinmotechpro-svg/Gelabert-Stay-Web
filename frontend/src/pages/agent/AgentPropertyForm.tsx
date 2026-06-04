import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useProperty, usePropertyMutations, uploadPropertyMedia, deletePropertyMedia } from '../../hooks/useProperties';
import { useAuth } from '../../hooks/useAuth.tsx';
import { usePropertyContracts } from '../../hooks/useContracts';
import { supabase } from '../../lib/supabase';
import type { PropertyInsert, PropertyOperation, PropertyType, PropertyStatus, CommercialStatus } from '../../types/property';
import { AVAILABLE_TAGS } from '../../types/property';
import { ChevronLeft, Save, Eye, Plus, X, ExternalLink, Sparkles } from 'lucide-react';
import { SortableImageGallery } from '../../components/admin/SortableImageGallery';
import { SortableVideoGallery } from '../../components/admin/SortableVideoGallery';
import { SortableFloorPlansGallery } from '../../components/admin/SortableFloorPlansGallery';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { PropertyMap } from '../../components/PropertyMap';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { RoomManager } from '../../components/admin/RoomManager';
import { CommonAreaManager } from '../../components/admin/CommonAreaManager';
import type { PropertyVideo } from '../../types/property';
import { triggerNetlifyBuild } from '../../utils/triggerBuild';

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const selectClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors";
const labelClass = "font-primary text-xs text-[#666666] uppercase tracking-wider mb-1";
const sectionClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5";
const sectionHeaderClass = "font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]";

// Helpers para SEO
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')     // Quitar caracteres no alfanuméricos
    .replace(/^-+|-+$/g, '');       // Limpiar guiones al inicio/final
};

const stripHTML = (html: string) => {
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

const ToggleField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-4 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#C9A962]' : 'bg-[#2A2A2A]'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} style={{ left: checked ? '1.375rem' : '0.125rem' }} />
    </div>
    <span className="font-primary text-xs text-[#888888] uppercase tracking-wide">{label}</span>
  </label>
);

const ContractHistory = ({ propertyId }: { propertyId: string }) => {
  const { contracts, loading } = usePropertyContracts(propertyId);

  if (loading) return <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!contracts.length) return <div className="py-8 text-center text-[#666666] text-xs italic bg-[#0A0A0A] border border-[#1F1F1F]">No hay historial de contratos para esta propiedad.</div>;

  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-[#1F1F1F] min-w-[600px]">
        <span className="text-[10px] text-[#444444] uppercase font-bold tracking-wider">Inquilino</span>
        <span className="text-[10px] text-[#444444] uppercase font-bold tracking-wider">Inicio</span>
        <span className="text-[10px] text-[#444444] uppercase font-bold tracking-wider">Fin</span>
        <span className="text-[10px] text-[#444444] uppercase font-bold tracking-wider">Renta</span>
        <span className="text-[10px] text-[#444444] uppercase font-bold tracking-wider">Estado</span>
      </div>
      {contracts.map(c => (
        <div key={c.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-4 border-b border-[#1F1F1F] items-center hover:bg-[#0F0F0F] transition-colors min-w-[600px]">
          <Link to={`/agente/inquilinos/${c.tenant_id}`} className="text-sm font-bold text-[#FAF8F5] hover:text-[#C9A962] transition-colors truncate">
            {c.tenant?.first_name} {c.tenant?.last_name}
          </Link>
          <span className="text-xs text-[#888888]">{new Date(c.start_date).toLocaleDateString()}</span>
          <span className="text-xs text-[#888888]">{new Date(c.end_date).toLocaleDateString()}</span>
          <span className="text-xs text-[#C9A962] font-secondary">€{c.monthly_rent}</span>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm w-fit ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
            {c.status === 'active' ? 'Activo' : 'Finalizado'}
          </span>
        </div>
      ))}
    </div>
  );
};


const DEFAULT_FORM: Partial<PropertyInsert> = {
  title: '', operation: 'alquiler', property_type: 'piso',
  price: undefined, max_price: undefined, price_type: 'exact', currency: 'EUR', city: '', zone: '', address: '',
  postal_code: '', street_number: '', door_number: '', 
  area_m2: undefined, bedrooms: 0, bathrooms: 0, floor: '',
  has_elevator: false, is_furnished: false, has_terrace: false, has_balcony: false,
  has_parking: false, parking_included: true, parking_price: undefined,
  has_storage: false, has_pool: false,
  heating: false, has_patio: false, is_exterior: false, sea_views: false, pets_allowed: false,
  air_conditioning: false, garden: false, has_wardrobes: false, has_fireplace: false,
  property_condition: '', availability: '',
  short_description: '', description: '', highlights: [], 
  tags: [],
  main_image: '', gallery: [], video_url: '', videos: [], videos_metadata: [], floor_plan: '', floor_plans: [], virtual_tour_url: '',
  slug: '', meta_title: '', meta_description: '',
  status: 'borrador', commercial_status: 'disponible', is_manual_commercial_status: false, is_featured: false,
  rent_type: null, reference: '',
  latitude: undefined, longitude: undefined,
  orientation: [], energy_rating: '', energy_consumption: undefined,
  emissions_rating: '', emissions_value: undefined,
  conservation_state: '', community_fees: undefined, ibi: undefined,
  block_staircase: '', urbanization: '',
  is_room_rental: false,
  rooms: [],
  common_areas: [],
};


export const AgentPropertyForm = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== 'nueva';
  const navigate = useNavigate();
  const { property, loading: loadingProp } = useProperty(isEditing ? id : undefined, true);
  const { createProperty, updateProperty } = usePropertyMutations();

  const [form, setForm] = useState<Partial<PropertyInsert>>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');
  const [latStr, setLatStr] = useState('');
  const [lonStr, setLonStr] = useState('');
  const [generatingAIDesc, setGeneratingAIDesc] = useState(false);
  const [formReady, setFormReady] = useState(!isEditing); // true immediately for new props
  const [initialMedia, setInitialMedia] = useState<Set<string>>(new Set());
  const [lastAutoGenerated, setLastAutoGenerated] = useState({
    slug: '',
    meta_title: '',
    meta_description: ''
  });

  useEffect(() => {
    setFormReady(false);
    if (isEditing && property) {
      const newForm = {
        title: property.title, operation: property.operation, property_type: property.property_type,
        price: property.price ?? undefined, max_price: property.max_price ?? undefined, price_type: property.price_type ?? 'exact', currency: property.currency, city: property.city ?? '',
        zone: property.zone ?? '', address: property.address ?? '', postal_code: property.postal_code ?? '',
        street_number: property.street_number ?? '', door_number: property.door_number ?? '',
        area_m2: property.area_m2 ?? undefined, bedrooms: property.bedrooms, bathrooms: property.bathrooms,
        floor: property.floor ?? '', has_elevator: property.has_elevator, is_furnished: property.is_furnished,
        has_terrace: property.has_terrace, has_balcony: property.has_balcony, 
        has_parking: property.has_parking, parking_included: property.parking_included ?? true, 
        parking_price: property.parking_price ?? undefined,
        has_storage: property.has_storage, has_pool: property.has_pool,
        heating: property.heating ?? false, has_patio: property.has_patio ?? false, is_exterior: property.is_exterior ?? false,
        sea_views: property.sea_views ?? false, pets_allowed: property.pets_allowed ?? false,
        air_conditioning: property.air_conditioning ?? false, garden: property.garden ?? false,
        has_wardrobes: property.has_wardrobes ?? false, has_fireplace: property.has_fireplace ?? false,
        property_condition: property.property_condition ?? '', availability: property.availability ?? '',
        short_description: property.short_description ?? '', description: property.description ?? '',
        highlights: property.highlights ?? [],
        tags: property.tags ?? [],
        main_image: property.main_image ?? '', gallery: property.gallery ?? [],
        video_url: property.video_url ?? '', videos: property.videos ?? [], floor_plan: property.floor_plan ?? '',
        floor_plans: property.floor_plans ?? [], virtual_tour_url: property.virtual_tour_url ?? '',
        slug: property.slug ?? '', meta_title: property.meta_title ?? '',
        meta_description: property.meta_description ?? '', status: property.status,
        commercial_status: property.commercial_status ?? 'disponible', 
        is_manual_commercial_status: property.is_manual_commercial_status ?? false,
        is_featured: property.is_featured,
        rent_type: property.rent_type, reference: property.reference ?? '',
        latitude: property.latitude ?? undefined,
        longitude: property.longitude ?? undefined,
        orientation: property.orientation ?? [],
        energy_rating: property.energy_rating ?? '',
        energy_consumption: property.energy_consumption ?? undefined,
        emissions_rating: property.emissions_rating ?? '',
        emissions_value: property.emissions_value ?? undefined,
        conservation_state: property.conservation_state ?? '',
        community_fees: property.community_fees ?? undefined,
        ibi: property.ibi ?? undefined,
        block_staircase: property.block_staircase ?? '',
        urbanization: property.urbanization ?? '',
        is_room_rental: property.is_room_rental ?? false,
        rooms: property.rooms ?? [],
        common_areas: property.common_areas ?? [],
        videos_metadata: property.videos_metadata ?? [],
      };
      setForm(newForm);
      setLatStr(property.latitude?.toString() || '');
      setLonStr(property.longitude?.toString() || '');

      // Capture all initial media URLs to track deletions
      const allInit = [
        ...(property.main_image ? [property.main_image] : []),
        ...(property.gallery || []),
        ...(property.video_url ? [property.video_url] : []),
        ...(property.videos || []),
        ...(property.videos_metadata || []).map((v: any) => v.url),
        ...(property.floor_plan ? [property.floor_plan] : []),
        ...(property.floor_plans || []),
        ...(property.common_areas || []).flatMap((ca: any) => ca.images || []),
        ...(property.rooms || []).flatMap((r: any) => r.images || [])
      ].filter(Boolean);
      setInitialMedia(new Set(allInit));

      setFormReady(true);
    }
  }, [isEditing, property]);

  // Sync string coords when form coords change (e.g. from auto-geocoding)
  useEffect(() => {
    if (form.latitude !== undefined && form.latitude !== null && Number(latStr) !== form.latitude) {
      setLatStr(form.latitude.toString());
    }
    if (form.longitude !== undefined && form.longitude !== null && Number(lonStr) !== form.longitude) {
      setLonStr(form.longitude.toString());
    }
  }, [form.latitude, form.longitude]);
  
  // Auto-sync SEO Metadata
  useEffect(() => {
    // Solo auto-generamos si el formulario ya está cargado, hay un título 
    // y si los campos están vacíos o si coinciden con lo generado anteriormente.
    if (formReady && form.title) {
      generateSEOMetadata(false);
    }
  }, [formReady, form.title, form.city, form.short_description, form.description]);

  // Google Maps Loader
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        console.log("No geometry found for this place");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      set('latitude', lat);
      set('longitude', lng);
      set('address', place.formatted_address || place.name);
      
      // Extract components like postal code and city
      const components = place.address_components;
      if (components) {
        const pc = components.find(c => c.types.includes('postal_code'))?.long_name;
        const city = components.find(c => c.types.includes('locality'))?.long_name;
        const streetNum = components.find(c => c.types.includes('street_number'))?.long_name;
        
        if (pc) set('postal_code', pc);
        if (city) set('city', city);
        if (streetNum) set('street_number', streetNum);
      }
    }
  };

  const set = (field: keyof PropertyInsert, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const allImages = useMemo(() => {
    const main = form.main_image;
    const gallery = form.gallery || [];
    
    const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
    const mainNorm = main ? normalize(main) : '';
    
    const combined = [
      ...(main ? [main] : []),
      ...gallery.filter((img: string) => normalize(img) !== mainNorm)
    ];
    
    const seen = new Set();
    return combined.filter((img: string) => {
      const n = normalize(img);
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [form.main_image, form.gallery]);

  const handleImagesChange = (newImages: string[]) => {
    // Normalización robusta para evitar duplicados visuales (mismo archivo, distinta URL/token)
    const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
    const seen = new Set();
    const unique = newImages.filter((img: string) => {
      const n = normalize(img);
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });

    if (unique.length === 0) {
      setForm(prev => ({ ...prev, main_image: '', gallery: [] }));
    } else {
      setForm(prev => ({ ...prev, main_image: unique[0], gallery: unique.slice(1) }));
    }
  };

  const handleUnifiedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImages(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const processed = await uploadPropertyMedia(f, 'gallery');
        urls.push(processed);
      }
      handleImagesChange([...allImages, ...urls]);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Error subiendo imágenes'); 
    } finally { 
      setUploadingImages(false); 
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    
    setUploadingVideo(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        // Validate video size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('El vídeo supera los 50MB (límite del plan gratuito de Supabase). Por favor, intenta comprimirlo.');
        }
        const url = await uploadPropertyMedia(file, 'videos');
        urls.push(url);
      }
      
      const currentVideos = form.videos_metadata || [];
      const newVids: PropertyVideo[] = urls.map(url => ({ url, title: 'Vídeo' }));
      handleVideosChange([...currentVideos, ...newVids]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo vídeo');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideosChange = (vids: PropertyVideo[]) => {
    set('videos_metadata', vids);
    set('videos', vids.map(v => v.url));
    // Para retrocompatibilidad y visualización simple, mantendremos video_url 
    // como el primer vídeo de la lista si existe
    set('video_url', vids.length > 0 ? vids[0].url : '');
  };

  const generateSEOMetadata = (force = true) => {
    if (!form.title) return;
    
    // 1. Slug: Titulo + Ciudad
    const finalSlug = slugify(`${form.title} ${form.city || ''}`);
    
    // 2. Meta Title: [Titulo] en [Ciudad] | Gelabert Homes
    const brandSuffix = " | Gelabert Homes Real Estate";
    const citySuffix = form.city ? ` en ${form.city}` : "";
    const finalMetaTitle = `${form.title}${citySuffix}${brandSuffix}`;
    
    // 3. Meta Description: Short desc o stripping main desc
    let finalMetaDesc = "";
    if (form.short_description) {
      finalMetaDesc = form.short_description;
    } else if (form.description) {
      finalMetaDesc = stripHTML(form.description);
    } else {
      finalMetaDesc = `Descubre esta exclusiva propiedad: ${form.title}${citySuffix}. Contacta con Gelabert Homes para más información.`;
    }
    
    // Truncar si es necesario
    if (finalMetaDesc.length > 155) {
      finalMetaDesc = finalMetaDesc.substring(0, 152) + "...";
    }

    setForm(prev => {
      // Logic: Update if forced OR if current value matches last auto-generated value OR if empty
      const shouldUpdateSlug = force || !prev.slug || prev.slug === lastAutoGenerated.slug;
      const shouldUpdateTitle = force || !prev.meta_title || prev.meta_title === lastAutoGenerated.meta_title;
      const shouldUpdateDesc = force || !prev.meta_description || prev.meta_description === lastAutoGenerated.meta_description;

      const newSlug = shouldUpdateSlug ? finalSlug : prev.slug;
      const newTitle = shouldUpdateTitle ? finalMetaTitle : prev.meta_title;
      const newDesc = shouldUpdateDesc ? finalMetaDesc : prev.meta_description;

      // Update the "last auto-generated" tracking state
      setLastAutoGenerated({
        slug: newSlug || '',
        meta_title: newTitle || '',
        meta_description: newDesc || ''
      });

      return {
        ...prev,
        slug: newSlug,
        meta_title: newTitle,
        meta_description: newDesc
      };
    });
  };

  const allFloorPlans = useMemo(() => {
    const main = form.floor_plan;
    const list = form.floor_plans || [];
    const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
    const mainNorm = main ? normalize(main) : '';
    const combined = [
      ...(main ? [main] : []),
      ...list.filter((img: string) => normalize(img) !== mainNorm)
    ];
    const seen = new Set();
    return combined.filter((img: string) => {
      const n = normalize(img);
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [form.floor_plan, form.floor_plans]);

  const handleFloorPlansChange = (newPlans: string[]) => {
    const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
    const seen = new Set();
    const unique = newPlans.filter((img: string) => {
      const n = normalize(img);
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });

    if (unique.length === 0) {
      setForm(prev => ({ ...prev, floor_plan: '', floor_plans: [] }));
    } else {
      setForm(prev => ({ ...prev, floor_plan: unique[0], floor_plans: unique.slice(1) }));
    }
  };

  const handleFloorPlansUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingFloorPlan(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`El plano ${file.name} es demasiado grande (máximo 20MB)`);
        }
        const url = await uploadPropertyMedia(file, 'floor-plans');
        urls.push(url);
      }
      handleFloorPlansChange([...allFloorPlans, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo plano');
    } finally {
      setUploadingFloorPlan(false);
    }
  };

  const toggleTag = (tag: string) => {
    const tags = form.tags ?? [];
    set('tags', tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    set('highlights', [...(form.highlights ?? []), newHighlight.trim()]);
    setNewHighlight('');
  };

  const removeHighlight = (i: number) => {
    const h = [...(form.highlights ?? [])];
    h.splice(i, 1);
    set('highlights', h);
  };

  const handleGenerateAIDescription = async () => {
    if (!form.title) {
      alert('Por favor, introduce al menos un título para que la IA tenga contexto.');
      return;
    }
    
    setGeneratingAIDesc(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { form }
      });
      
      if (error) throw error;
      if (data?.description) {
        set('description', data.description);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error('Error generando descripción con IA:', err);
      alert('Hubo un error al generar la descripción: ' + (err.message || err));
    } finally {
      setGeneratingAIDesc(false);
    }
  };

  const translateToEnglish = async () => {
    if (!form.title && !form.description) return;
    
    const translateChunk = async (text: string) => {
      if (!text || text.length < 3) return text;
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) return text;
        const data = await response.json();
        return (data && data[0]) ? data[0].map((item: any) => item[0]).join("") : text;
      } catch (error) {
        console.error('Translation Error:', error);
        return text;
      }
    };

    const translateLongText = async (text: string) => {
      if (!text || text.length <= 1500) return translateChunk(text);
      // Split by chunks while trying to keep HTML tags somewhat whole
      const chunks = text.match(/[\s\S]{1,1500}(?=\s|$)/g) || [text];
      const translatedChunks = await Promise.all(chunks.map(chunk => translateChunk(chunk)));
      return translatedChunks.join("");
    };

    const [titleEn, shortDescEn, descEn, highlightsEn] = await Promise.all([
      translateChunk(form.title || ''),
      translateLongText(form.short_description || ''),
      translateLongText(form.description || ''),
      Promise.all((form.highlights || []).map(h => translateChunk(h)))
    ]);

    setForm(prev => ({
      ...prev,
      title_en: titleEn,
      short_description_en: shortDescEn,
      description_en: descEn,
      highlights_en: highlightsEn
    }));
    
    // Switch view to English if you have tabs? Property form is long, maybe just notify?
    // Actually, let's switch any tab if exists.
    alert('Traducción completada. Revisa los campos en inglés al final de cada sección.');
  };

  const handleSave = async (targetStatus?: PropertyStatus) => {
    if (!form.title?.trim()) { setError('El título es obligatorio'); return; }
    if (!form.operation) { setError('El tipo de operación es obligatorio'); return; }
    
    setSaving(true);
    setError(null);
    
    try {
      // 1. Clonar el estado para limpieza
      const data: any = { ...form };

      // Asignar el agente actual a la propiedad si es nueva
      if (!isEditing && user?.id) {
        data.agent_id = user.id;
      }
      
      // Auto-generar SEO si faltan datos críticos
      if (!data.slug && data.title) {
        data.slug = slugify(`${data.title} ${data.city || ''}`);
      }
      // Auto-generate missing SEO data
      if (!data.meta_title && data.title) {
        data.meta_title = `${data.title}${data.city ? ` en ${data.city}` : ""} | Gelabert Homes Real Estate`;
      }
      if (!data.meta_description) {
        const descSource = data.short_description || stripHTML(data.description || '');
        if (descSource) {
          data.meta_description = descSource.length > 155 ? descSource.substring(0, 152) + "..." : descSource;
        }
      }
      if (!data.slug && data.title) {
        data.slug = slugify(`${data.title} ${data.city || ''}`);
      }

      // 2. Establecer el estado de publicación si se ha pasado
      if (targetStatus) data.status = targetStatus;
      
      // 3. Limpiar strings vacíos para evitar conflictos en UNIQUE (reference, slug)
      // y para que se guarden como NULL en Postgres
      const nullableFields = ['reference', 'slug', 'meta_title', 'meta_description', 'street_number', 'door_number', 'parking_price', 'short_description', 'description', 'video_url', 'floor_plan', 'virtual_tour_url', 'availability', 'property_condition', 'energy_rating', 'emissions_rating', 'conservation_state', 'block_staircase', 'urbanization'];
      
      nullableFields.forEach(field => {
        if (data[field] === undefined || (typeof data[field] === 'string' && data[field].trim() === '')) {
          data[field] = null;
        }
      });

      // 4. Asegurar que los campos numéricos son números o null
      const numericFields = ['price', 'max_price', 'energy_consumption', 'emissions_value', 'community_fees', 'ibi'];
      numericFields.forEach(field => {
        if (data[field] !== null && data[field] !== undefined) {
          const p = Number(data[field]);
          data[field] = isNaN(p) ? null : p;
        } else {
          data[field] = null;
        }
      });

      // 5. Limpieza de video_url por si el usuario pega un iframe
      if (data.video_url && data.video_url.includes('<iframe')) {
        const srcMatch = data.video_url.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
          data.video_url = srcMatch[1];
        }
      }

      // 6. Desduplicar imágenes (asegurar que main_image no esté en gallery y que gallery sea única)
      const mainImg = data.main_image;
      const rawGallery = Array.isArray(data.gallery) ? data.gallery : [];
      const normalize = (u: string) => u.split('?')[0].split('#')[0].trim();
      const mainNorm = mainImg ? normalize(mainImg) : '';
      
      const uniqueGallery = rawGallery.filter((img: string) => img && normalize(img) !== mainNorm);
      const seenGallery = new Set();
      data.gallery = uniqueGallery.filter((img: string) => {
        const n = normalize(img);
        if (seenGallery.has(n)) return false;
        seenGallery.add(n);
        return true;
      });

      // 7. Eliminar campos que NO deben ir en la mutación o que Postgres genera
      delete data.created_at;
      delete data.updated_at;
      
      console.log('[DEBUG] Enviando datos a Supabase:', data);

      if (isEditing && id) {
        delete data.id; 
        await updateProperty(id, data);
      } else {
        delete data.id;
        await createProperty(data);
      }

      // 8. Cleanup orphaned media from storage AFTER successful DB save
      if (isEditing && initialMedia.size > 0) {
        // Collect all final media URLs
        const finalMedia = new Set([
          ...(data.main_image ? [data.main_image] : []),
          ...(data.gallery || []),
          ...(data.video_url ? [data.video_url] : []),
          ...(data.videos || []),
          ...(data.floor_plan ? [data.floor_plan] : []),
          ...(data.floor_plans || []),
          ...(data.videos_metadata || []).map((v: any) => v.url),
          ...(data.common_areas || []).flatMap((ca: any) => ca.images || []),
          ...(data.rooms || []).flatMap((r: any) => r.images || [])
        ].filter(Boolean));

        // Identify URLs that were present but are now gone
        const toDelete = Array.from(initialMedia).filter(url => !finalMedia.has(url));
        
        if (toDelete.length > 0) {
          console.log(`[Admin] Cleaning up ${toDelete.length} orphaned files from storage...`);
          // Use Promise.allSettled to not block navigation if some deletions fail
          await Promise.allSettled(toDelete.map(url => deletePropertyMedia(url)));
        }
      }
      
      // Trigger a Netlify build so static pages (and OG tags) update
      await triggerNetlifyBuild();
      
      setSaving(false);
      navigate('/agente/propiedades');
    } catch (err: any) {
      console.error('[DATABASE_ERROR] Error al guardar propiedad:', err);
      if (err.code === '42703') {
        console.error('[CRITICAL] Columna inexistente en la base de datos. Por favor, ejecuta el script de migración SQL proporcionado.');
      }
      
      // Control de errores de duplicados (23505)
      if (err.code === '23505' && (err.message?.includes('properties_reference_key') || err.details?.includes('properties_reference_key'))) {
        setError('El número de referencia introducido ya está en uso por otra propiedad. Por favor, especifica una referencia única o añade una variación (ej. GEL-102-01).');
      } else {
        const errorMessage = err.message || err.details || 'Error al guardar';
        const errorCode = err.code ? ` (${err.code})` : '';
        setError(`${errorMessage}${errorCode}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && loadingProp) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/agente/propiedades`)} className="text-[#888888] hover:text-[#FAF8F5] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-secondary text-3xl text-[#FAF8F5]">
              {isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'}
            </h1>
            <p className="font-primary text-[#666666] text-sm mt-1">
              {isEditing ? `Editando: ${property?.title}` : 'Completa los datos del inmueble'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleSave('borrador')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar Borrador
          </button>
          {isEditing && property?.status === 'publicada' && (
            <a
              href={`/propiedades/${property.reference || property.slug || property.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Ver en web
            </a>
          )}
          <button
            onClick={() => handleSave('publicada')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#D4B673] transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Publicar'}
          </button>
          <button
            type="button"
            onClick={translateToEnglish}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#C9A962]/20 bg-[#C9A962]/5 text-[#C9A962] font-primary text-sm hover:bg-[#C9A962]/10 transition-all rounded-sm"
            title="Traducir contenido al inglés automáticamente"
          >
            <Sparkles className="w-4 h-4" />
            Traducir al Inglés
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 p-4"><p className="font-primary text-red-400 text-sm">{error}</p></div>}

      {/* INFORMACIÓN PRINCIPAL */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>Información Principal</h2>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Título *</label>
          <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Villa Panorámica en Marbella" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Tipo de Operación *</label>
            <select className={selectClass} value={form.operation} onChange={e => set('operation', e.target.value as PropertyOperation)}>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="traspaso">Traspaso</option>
            </select>
          </div>
          {form.operation === 'alquiler' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Tipo de Alquiler</label>
              <select className={selectClass} value={form.rent_type || ''} onChange={e => set('rent_type', e.target.value || null)}>
                <option value="">No especificado</option>
                <option value="habitual">Habitual (Larga temporada)</option>
                <option value="temporal">Temporal (Meses)</option>
                <option value="vacacional">Vacacional (Días/Semanas)</option>
                <option value="habitaciones">Por habitaciones</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          )}
          {form.operation === 'alquiler' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Modo de Alquiler</label>
              <div className="flex items-center h-10">
                <ToggleField 
                  label="Alquiler por habitaciones" 
                  checked={form.is_room_rental ?? false} 
                  onChange={v => set('is_room_rental', v)} 
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Referencia</label>
            <input className={inputClass} placeholder="Ej: REF123" value={form.reference} onChange={e => set('reference', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Tipo de Inmueble *</label>
            <select className={selectClass} value={form.property_type} onChange={e => set('property_type', e.target.value as PropertyType)}>
              <option value="piso">Piso / Apartamento</option>
              <option value="casa">Casa / Chalet</option>
              <option value="habitacion">Habitación</option>
              <option value="local">Local comercial</option>
              <option value="oficina">Oficina</option>
              <option value="terreno">Terreno / Parcela</option>
              <option value="garaje">Garaje</option>
              <option value="trastero">Trastero</option>
              <option value="edificio">Edificio</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Estado Comercial</label>
            <div className="flex flex-col gap-2">
              <select className={selectClass} value={form.commercial_status} onChange={e => {
                const val = e.target.value as CommercialStatus;
                set('commercial_status', val);
                set('is_manual_commercial_status', true);
              }}>
                <option value="disponible">Disponible</option>
                <option value="reservado">Reservado</option>
                <option value="alquilado">Alquilado</option>
                <option value="vendido">Vendido</option>
                <option value="no_disponible">No Disponible</option>
              </select>
              <div className="flex items-center gap-2">
                <ToggleField 
                  label="Estado Manual (ignorar contratos)" 
                  checked={form.is_manual_commercial_status ?? false} 
                  onChange={v => set('is_manual_commercial_status', v)} 
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Estado Publicación</label>
            <select className={selectClass} value={form.status} onChange={e => set('status', e.target.value as PropertyStatus)}>
              <option value="publicada">Publicada</option>
              <option value="borrador">Borrador</option>
              <option value="archivada">Archivada</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Tipo de Precio</label>
            <select className={selectClass} value={form.price_type} onChange={e => {
              set('price_type', e.target.value);
              if (e.target.value !== 'range') {
                set('max_price', undefined);
              }
            }}>
              <option value="exact">Precio Exacto</option>
              <option value="from">Precio Desde</option>
              <option value="range">Rango de Precios</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              {form.price_type === 'from' ? 'Precio Inicial *' : form.price_type === 'range' ? 'Precio Mínimo *' : 'Precio *'}
            </label>
            <input type="number" className={inputClass} placeholder="Ej: 350000" value={form.price ?? ''} onChange={e => set('price', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          {form.price_type === 'range' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Precio Máximo *</label>
              <input type="number" className={inputClass} placeholder="Ej: 450000" value={form.max_price ?? ''} onChange={e => set('max_price', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Moneda</label>
            <select className={selectClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
            <label className={labelClass}>Destacada</label>
            <div className="flex items-center h-10">
              <ToggleField label="Marcar como destacada" checked={form.is_featured ?? false} onChange={v => set('is_featured', v)} />
            </div>
          </div>
        </div>

        {/* Community Fees & IBI (Solo Venta) */}
        {form.operation === 'venta' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1F1F1F]">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Gastos de Comunidad</label>
              <input type="number" className={inputClass} value={form.community_fees ?? ''} onChange={e => set('community_fees', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>IBI</label>
              <input type="number" className={inputClass} value={form.ibi ?? ''} onChange={e => set('ibi', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        )}
      </div>

      {/* UBICACIÓN */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>Ubicación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Ciudad</label>
            <input className={inputClass} placeholder="Málaga, Marbella..." value={form.city ?? ''} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Zona / Barrio</label>
            <input className={inputClass} placeholder="Ej: Centro Histórico, El Limonar..." value={form.zone ?? ''} onChange={e => set('zone', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className={labelClass}>Dirección</label>
            {isLoaded ? (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  componentRestrictions: { country: "es" },
                  fields: ["address_components", "geometry", "formatted_address", "name"],
                }}
              >
                <input 
                  className={inputClass} 
                  placeholder="Escribe la dirección..." 
                  value={form.address ?? ''} 
                  onChange={e => set('address', e.target.value)}
                />
              </Autocomplete>
            ) : (
              <input 
                className={inputClass} 
                placeholder="Escribe la dirección..." 
                value={form.address ?? ''} 
                onChange={e => set('address', e.target.value)}
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Código Postal</label>
            <input className={inputClass} placeholder="29000" value={form.postal_code ?? ''} onChange={e => set('postal_code', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Número</label>
            <input className={inputClass} value={form.street_number ?? ''} onChange={e => set('street_number', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Puerta / Piso</label>
            <input className={inputClass} value={form.door_number ?? ''} onChange={e => set('door_number', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Bloque / Escalera</label>
            <input className={inputClass} value={form.block_staircase ?? ''} onChange={e => set('block_staircase', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className={labelClass}>Urbanización</label>
            <input className={inputClass} value={form.urbanization ?? ''} onChange={e => set('urbanization', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 pt-2 border-t border-[#1F1F1F]">
            <label className={labelClass}>Coordenadas (Opcional)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666666] font-bold">LAT</span>
                <input 
                  className={`${inputClass} !pl-10`} 
                  placeholder="36.721..." 
                  value={latStr} 
                  onChange={e => {
                    const val = e.target.value;
                    setLatStr(val);
                    if (val === '' || val === '-' || val === '.') {
                      set('latitude', undefined);
                    } else {
                      const num = Number(val);
                      if (!isNaN(num)) set('latitude', num);
                    }
                  }} 
                />
              </div>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#666666] font-bold">LON</span>
                <input 
                  className={`${inputClass} !pl-10`} 
                  placeholder="-4.421..." 
                  value={lonStr} 
                  onChange={e => {
                    const val = e.target.value;
                    setLonStr(val);
                    if (val === '' || val === '-' || val === '.') {
                      set('longitude', undefined);
                    } else {
                      const num = Number(val);
                      if (!isNaN(num)) set('longitude', num);
                    }
                  }} 
                />
              </div>
            </div>
            <p className="text-[10px] text-[#666666] mt-1 italic">
              Si dejas las coordenadas vacías, intentaremos geolocalizar la dirección automáticamente.
            </p>
          </div>
          
          {/* Vista previa del mapa */}
          <div className="sm:col-span-2 mt-4 space-y-2">
            <label className={labelClass}>Vista previa del Mapa</label>
            <div className="h-[350px] w-full border border-[#1F1F1F] overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all">
              <PropertyMap 
                lat={Number(form.latitude || 0)} 
                lng={Number(form.longitude || 0)} 
                address={form.address || undefined}
                editable={true}
                onChange={(lat, lng) => {
                  set('latitude', lat);
                  set('longitude', lng);
                }}
              />
            </div>
            <p className="text-[11px] text-[#C9A962] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Arrastra el marcador para ajustar la ubicación exacta.
            </p>
            <p className="text-[10px] text-[#666666] italic">
              La dirección textual no se cambiará automáticamente al mover el marcador.
            </p>
          </div>
        </div>
      </div>

      {/* ALQUILER POR HABITACIONES (PISO/CASA) */}
      {form.is_room_rental && form.property_type !== 'habitacion' && (
        <div className={sectionClass}>
          <RoomManager 
            rooms={form.rooms || []} 
            onChange={(rooms: any[]) => set('rooms', rooms)}
            propertyId={isEditing ? id : undefined}
          />
        </div>
      )}

      {/* ZONAS COMUNES (HABITACIÓN INDIVIDUAL) */}
      {form.property_type === 'habitacion' && (
        <div className={sectionClass}>
          <CommonAreaManager 
            areas={form.common_areas || []} 
            onChange={(areas: any[]) => set('common_areas', areas)}
          />
        </div>
      )}

      {/* CARACTERÍSTICAS */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>Características</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Superficie (m²)</label>
            <input type="number" className={inputClass} placeholder="Ej: 85" value={form.area_m2 ?? ''} onChange={e => set('area_m2', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Habitaciones</label>
            <input type="number" className={inputClass} placeholder="Ej: 3" value={form.bedrooms} onChange={e => set('bedrooms', Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Baños</label>
            <input type="number" className={inputClass} placeholder="Ej: 2" value={form.bathrooms} onChange={e => set('bathrooms', Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Planta / Altura</label>
            <input className={inputClass} placeholder="Ej: 3º B, Bajo, Ático..." value={form.floor ?? ''} onChange={e => set('floor', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Estado de Conservación</label>
            <select 
              className={selectClass} 
              value={form.conservation_state ?? ''} 
              onChange={e => set('conservation_state', e.target.value)}
            >
              <option value="">Selecciona estado...</option>
              <option value="Reformado">Reformado</option>
              <option value="A reformar">A reformar</option>
              <option value="Buen estado">Buen estado</option>
              <option value="Obra nueva">Obra nueva</option>
              <option value="A estrenar">A estrenar</option>
              <option value="En construcción">En construcción</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Disponibilidad</label>
            <input 
              className={inputClass} 
              placeholder="Ej: Inmediata, Mayo 2024..."
              value={form.availability ?? ''} 
              onChange={e => set('availability', e.target.value)}
            />
          </div>
        </div>

        {/* Orientación (Multiple selection) */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#1F1F1F]">
          <label className={labelClass}>Orientación</label>
          <div className="flex flex-wrap gap-4">
            {['Norte', 'Sur', 'Este', 'Oeste'].map(o => (
              <label key={o} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={(form.orientation ?? []).includes(o)}
                  onChange={() => {
                    const current = form.orientation ?? [];
                    set('orientation', current.includes(o) ? current.filter(x => x !== o) : [...current, o]);
                  }}
                />
                <div className={`w-4 h-4 rounded-sm border ${ (form.orientation ?? []).includes(o) ? 'bg-[#C9A962] border-[#C9A962]' : 'border-[#444444] group-hover:border-[#666666]' } transition-colors flex items-center justify-center`}>
                  {(form.orientation ?? []).includes(o) && <X className="w-3 h-3 text-[#0A0A0A]" />}
                </div>
                <span className="font-primary text-xs text-[#888888] uppercase tracking-wide group-hover:text-[#FAF8F5] transition-colors">
                  {o}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Eficiencia Energética */}
        <div className="flex flex-col gap-5 pt-4 border-t border-[#1F1F1F]">
          <h3 className="font-primary text-[#FAF8F5] font-bold text-xs uppercase tracking-wider">
            Eficiencia Energética
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Calificación Energética</label>
                <select className={selectClass} value={form.energy_rating ?? ''} onChange={e => set('energy_rating', e.target.value)}>
                  <option value="">-</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Exento', 'En trámite'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Consumo de Energía (kWh/m² año)</label>
                <input type="number" className={inputClass} value={form.energy_consumption ?? ''} onChange={e => set('energy_consumption', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Calificación de Emisiones</label>
                <select className={selectClass} value={form.emissions_rating ?? ''} onChange={e => set('emissions_rating', e.target.value)}>
                  <option value="">-</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Exento', 'En trámite'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Emisiones (kg CO₂/m² año)</label>
                <input type="number" className={inputClass} value={form.emissions_value ?? ''} onChange={e => set('emissions_value', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 pt-2">
          <ToggleField label="Ascensor" checked={form.has_elevator ?? false} onChange={v => set('has_elevator', v)} />
          <ToggleField label="Amueblado" checked={form.is_furnished ?? false} onChange={v => set('is_furnished', v)} />
          <ToggleField label="Terraza" checked={form.has_terrace ?? false} onChange={v => set('has_terrace', v)} />
          <ToggleField label="Balcón" checked={form.has_balcony ?? false} onChange={v => set('has_balcony', v)} />
          <ToggleField label="Garaje" checked={form.has_parking ?? false} onChange={v => set('has_parking', v)} />
          {form.has_parking && (
            <div className="flex flex-col gap-3 p-3 bg-[#111111] border border-[#1F1F1F] rounded-sm sm:col-span-2 lg:col-span-3">
              <ToggleField 
                label="Plaza de garaje incluida" 
                checked={form.parking_included ?? true} 
                onChange={v => set('parking_included', v)} 
              />
              {form.parking_included === false && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#1F1F1F]">
                  <label className={labelClass}>Precio de la plaza (Si no incluida)</label>
                  <input 
                    type="number" 
                    className={`${inputClass} max-w-[200px]`} 
                    value={form.parking_price ?? ''} 
                    onChange={e => set('parking_price', e.target.value ? Number(e.target.value) : undefined)} 
                  />
                </div>
              )}
            </div>
          )}
          <ToggleField label="Trastero" checked={form.has_storage ?? false} onChange={v => set('has_storage', v)} />
          <ToggleField label="Piscina" checked={form.has_pool ?? false} onChange={v => set('has_pool', v)} />
          <ToggleField label="Calefacción" checked={form.heating ?? false} onChange={v => set('heating', v)} />
          <ToggleField label="Aire Acondicionado" checked={form.air_conditioning ?? false} onChange={v => set('air_conditioning', v)} />
          <ToggleField label="Exterior" checked={form.is_exterior ?? false} onChange={v => set('is_exterior', v)} />
          <ToggleField label="Jardín" checked={form.garden ?? false} onChange={v => set('garden', v)} />
          <ToggleField label="Patio" checked={form.has_patio ?? false} onChange={v => set('has_patio', v)} />
          <ToggleField label="Mascotas permitidas" checked={form.pets_allowed ?? false} onChange={v => set('pets_allowed', v)} />
          <ToggleField label="Vistas al mar" checked={form.sea_views ?? false} onChange={v => set('sea_views', v)} />
          <ToggleField label="Armarios Empotrados" checked={form.has_wardrobes ?? false} onChange={v => set('has_wardrobes', v)} />
          <ToggleField label="Chimenea" checked={form.has_fireplace ?? false} onChange={v => set('has_fireplace', v)} />
        </div>

      </div>

      {/* CONTENIDO COMERCIAL */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
          <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">Contenido Comercial</h2>
          <button 
            type="button"
            onClick={handleGenerateAIDescription}
            disabled={generatingAIDesc}
            className="flex items-center gap-2 text-[10px] text-[#C9A962] uppercase font-bold hover:text-[#FAF8F5] transition-colors bg-[#C9A962]/5 px-3 py-1.5 border border-[#C9A962]/20 rounded-full disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            {generatingAIDesc ? 'Generando...' : 'Generar con IA'}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Descripción Larga (HTML)</label>
          <RichTextEditor
            key={formReady ? 'ready' : 'loading'}
            content={form.description ?? ''}
            onChange={(v: string) => set('description', v)}
            placeholder="Describe la propiedad en detalle..."
          />
        </div>
        {/* Highlights */}
        <div className="grid grid-cols-1 gap-6 pb-4 border-b border-[#1F1F1F]">
          <div className="flex flex-col gap-3">
            <label className={labelClass}>Puntos Destacados (Highlights)</label>
            <div className="flex gap-2">
              <input className={`${inputClass} flex-1`} placeholder="Ej: Vistas frontales al mar, Reforma integral 2023..." value={newHighlight} onChange={e => setNewHighlight(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())} />
              <button type="button" onClick={addHighlight} className="flex items-center gap-1 px-3 h-10 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] text-sm hover:bg-[#C9A962]/20 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            {(form.highlights ?? []).map((h, i) => (
              <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-[#161616] border border-[#1F1F1F]">
                <span className="font-primary text-sm text-[#FAF8F5]">• {h}</span>
                <button onClick={() => removeHighlight(i)} className="text-[#444444] hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
        {/* Tags */}
        <div className="flex flex-col gap-3">
          <label className={labelClass}>Etiquetas de Filtro</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-xs font-primary border transition-colors ${(form.tags ?? []).includes(tag) ? 'bg-[#C9A962]/20 border-[#C9A962] text-[#C9A962]' : 'bg-transparent border-[#1F1F1F] text-[#666666] hover:border-[#888888] hover:text-[#888888]'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MULTIMEDIA */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          {form.property_type === 'habitacion'
            ? 'La Habitación (Fotos)'
            : form.is_room_rental
              ? 'Zonas Comunes (Fotos)'
              : "Multimedia"}
        </h2>

        <SortableImageGallery 
          images={allImages}
          onChange={handleImagesChange}
          onUpload={handleUnifiedUpload}
          uploading={uploadingImages}
        />

        {/* Galería de Vídeos */}
        <div className="mt-6 pt-6 border-t border-[#1F1F1F]">
          <h3 className="font-primary text-[#FAF8F5] font-bold text-xs uppercase tracking-wider mb-4">
            {form.property_type === 'habitacion'
              ? 'La Habitación (Vídeos)'
              : form.is_room_rental
                ? 'Zonas Comunes (Vídeos)'
                : 'Galería de Vídeos'}
          </h3>
          <SortableVideoGallery 
            videos={form.videos_metadata || []}
            onChange={handleVideosChange}
            onUpload={handleVideoUpload}
            uploading={uploadingVideo}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[#1F1F1F]">
          {/* Planos de la Propiedad */}
          <div className="flex flex-col gap-3">
            <label className={labelClass}>Planos de la Propiedad</label>
            <SortableFloorPlansGallery 
              plans={allFloorPlans}
              onChange={handleFloorPlansChange}
              onUpload={handleFloorPlansUpload}
              uploading={uploadingFloorPlan}
            />
          </div>

          {/* Tour Virtual */}
          <div className="flex flex-col gap-3">
            <label className={labelClass}>Tour Virtual 360°</label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input 
                  className={`${inputClass} flex-1`} 
                  placeholder="Ej: https://my.matterport.com/show/?m=..." 
                  value={form.virtual_tour_url ?? ''} 
                  onChange={e => set('virtual_tour_url', e.target.value)} 
                />
                {form.virtual_tour_url && (
                  <a 
                    href={form.virtual_tour_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center h-10 px-4 bg-[#161616] border border-[#1F1F1F] text-[#C9A962] hover:border-[#C9A962] transition-colors"
                    title="Probar enlace del tour virtual"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-[10px] text-[#666666] italic">
                Introduce el enlace al tour virtual 360° de la propiedad (ej. Matterport, Floorfy, etc.).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE ALQUILERES */}
      {isEditing && (
        <div className="flex flex-col gap-5">
          <h2 className={sectionHeaderClass}>Historial de Alquileres / Reservas</h2>
          <ContractHistory propertyId={id!} />
        </div>
      )}

      {/* SEO */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-3">
          <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">SEO & Posicionamiento</h2>
          <button 
            type="button"
            onClick={() => generateSEOMetadata()}
            className="flex items-center gap-2 text-[10px] text-[#C9A962] uppercase font-bold hover:text-[#FAF8F5] transition-colors bg-[#C9A962]/5 px-3 py-1.5 border border-[#C9A962]/20 rounded-full"
          >
            <Sparkles className="w-3 h-3" />
            Auto-generar SEO
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Slug (URL amigable) (Único, sin espacios)</label>
          <input className={inputClass} placeholder="ej-villa-marbella" value={form.slug ?? ''} onChange={e => set('slug', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Meta Título (SEO)</label>
          <input className={inputClass} placeholder="Título para buscadores..." value={form.meta_title ?? ''} onChange={e => set('meta_title', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Meta Descripción (SEO)</label>
          <textarea className={`${inputClass} h-20 py-2.5 resize-none`} placeholder="Breve descripción para Google..." value={form.meta_description ?? ''} onChange={e => set('meta_description', e.target.value)} />
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="sticky bottom-0 bg-[#0A0A0A] p-4 border-t border-[#1F1F1F] z-50 flex items-center justify-between gap-4 -mx-6 md:-mx-10 px-6 md:px-10 mt-8">
        <button onClick={() => navigate(`/agente/propiedades`)} className="font-primary text-sm text-[#888888] hover:text-[#FAF8F5] transition-colors">
          ← Cancelar
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('borrador')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar Borrador
          </button>
          <button
            onClick={() => handleSave('publicada')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#D4B673] transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(201,169,98,0.2)]"
          >
            <Eye className="w-4 h-4" />
            {saving ? "Guardando..." : (isEditing ? "Actualizar Propiedad" : "Publicar Propiedad")}
          </button>
        </div>
      </div>
    </div>
  );
};
