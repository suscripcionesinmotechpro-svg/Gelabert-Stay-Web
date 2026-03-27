import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProperty, usePropertyMutations, uploadPropertyMedia } from '../../hooks/useProperties';
import type { PropertyInsert, PropertyOperation, PropertyType, PropertyStatus, CommercialStatus } from '../../types/property';
import { AVAILABLE_TAGS, OPERATION_LABELS, PROPERTY_TYPE_LABELS, COMMERCIAL_STATUS_LABELS, STATUS_LABELS } from '../../types/property';
import { X, Save, Eye, ChevronLeft, Plus, Upload } from 'lucide-react';
import { SortableImageGallery } from '../../components/admin/SortableImageGallery';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { PropertyMap } from '../../components/PropertyMap';

const inputClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]";
const selectClass = "w-full h-10 bg-[#0A0A0A] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors";
const labelClass = "font-primary text-xs text-[#666666] uppercase tracking-wider mb-1";
const sectionClass = "bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-5";
const sectionHeaderClass = "font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider pb-3 border-b border-[#1F1F1F]";

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


const DEFAULT_FORM: Partial<PropertyInsert> = {
  title: '', operation: 'alquiler', property_type: 'piso',
  price: undefined, currency: 'EUR', city: '', zone: '', address: '',
  postal_code: '', street_number: '', door_number: '', 
  area_m2: undefined, bedrooms: 0, bathrooms: 0, floor: '',
  has_elevator: false, is_furnished: false, has_terrace: false, has_balcony: false,
  has_parking: false, parking_included: true, parking_price: undefined,
  has_storage: false, has_pool: false,
  heating: false, has_patio: false, is_exterior: false, sea_views: false, pets_allowed: false,
  air_conditioning: false, garden: false,
  property_condition: '', availability: '',
  short_description: '', description: '', highlights: [], 
  tags: [],
  main_image: '', gallery: [], video_url: '', floor_plan: '',
  slug: '', meta_title: '', meta_description: '',
  status: 'borrador', commercial_status: 'disponible', is_featured: false,
  rent_type: null, reference: '',
  latitude: undefined, longitude: undefined,
  orientation: [], energy_rating: '', energy_consumption: undefined,
  emissions_rating: '', emissions_value: undefined,
  conservation_state: '', community_fees: undefined, ibi: undefined,
  block_staircase: '', urbanization: '',
};


export const AdminPropertyForm = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== 'nueva';
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  useEffect(() => {
    if (isEditing && property) {
      const newForm = {
        title: property.title, operation: property.operation, property_type: property.property_type,
        price: property.price ?? undefined, currency: property.currency, city: property.city ?? '',
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
        property_condition: property.property_condition ?? '', availability: property.availability ?? '',
        short_description: property.short_description ?? '', description: property.description ?? '',
        highlights: property.highlights ?? [],
        tags: property.tags ?? [],
        main_image: property.main_image ?? '', gallery: property.gallery ?? [],
        video_url: property.video_url ?? '', floor_plan: property.floor_plan ?? '',
        slug: property.slug ?? '', meta_title: property.meta_title ?? '',
        meta_description: property.meta_description ?? '', status: property.status,
        commercial_status: property.commercial_status ?? 'disponible', is_featured: property.is_featured,
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
      };
      setForm(newForm);
      setLatStr(property.latitude?.toString() ?? '');
      setLonStr(property.longitude?.toString() ?? '');
    }
  }, [property, isEditing]);

  // Sync string coords when form coords change (e.g. from auto-geocoding)
  useEffect(() => {
    if (form.latitude !== undefined && form.latitude !== null && Number(latStr) !== form.latitude) {
      setLatStr(form.latitude.toString());
    }
    if (form.longitude !== undefined && form.longitude !== null && Number(lonStr) !== form.longitude) {
      setLonStr(form.longitude.toString());
    }
  }, [form.latitude, form.longitude]);

  // Geolocalización automática con debounce
  useEffect(() => {
    if (!form.address || !form.city) return;
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const queryParts = [form.address, form.city, "Málaga", "España"].filter(Boolean);
        const query = encodeURIComponent(queryParts.join(', '));
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        
        if (data && data[0]) {
          const newLat = Number(data[0].lat);
          const newLon = Number(data[0].lon);
          
          // Solo actualizar si las coordenadas son significativamente diferentes
          if (Math.abs((form.latitude || 0) - newLat) > 0.0001 || Math.abs((form.longitude || 0) - newLon) > 0.0001) {
            set('latitude', newLat);
            set('longitude', newLon);
          }
        }
      } catch (err) {
        console.error('Error en geolocalización automática:', err);
      }
    }, 2000); // 2 segundos de debounce para no saturar la API

    return () => clearTimeout(delayDebounceFn);
  }, [form.address, form.city, form.postal_code]);

  const set = (field: keyof PropertyInsert, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const allImages = [form.main_image, ...(form.gallery ?? [])].filter(Boolean) as string[];

  const handleImagesChange = (newImages: string[]) => {
    if (newImages.length === 0) {
      setForm(prev => ({ ...prev, main_image: '', gallery: [] }));
    } else {
      setForm(prev => ({ ...prev, main_image: newImages[0], gallery: newImages.slice(1) }));
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
        // Validate image size (e.g., 20MB for photos is plenty)
        if (f.size > 20 * 1024 * 1024) {
          throw new Error(t('admin.form.errors.image_too_large', { name: f.name }));
        }
        const url = await uploadPropertyMedia(f, 'gallery');
        urls.push(url);
      }
      handleImagesChange([...allImages, ...urls]);
    } catch (err) { 
      setError(err instanceof Error ? err.message : t('admin.form.errors.image_upload_error')); 
    } finally { 
      setUploadingImages(false); 
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate video size (Supabase Free plan limit is 50MB per file)
    if (file.size > 50 * 1024 * 1024) {
      setError(t('admin.form.errors.video_too_large'));
      return;
    }

    setUploadingVideo(true);
    setError(null);
    try {
      const url = await uploadPropertyMedia(file, 'videos');
      set('video_url', url);
    } catch (err) {
      setError(err instanceof Error ? `${t('admin.form.errors.video_upload_error')}: ${err.message}` : t('admin.form.errors.video_upload_error'));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError(t('admin.form.errors.floor_plan_too_large'));
      return;
    }

    setUploadingFloorPlan(true);
    setError(null);
    try {
      const url = await uploadPropertyMedia(file, 'floor-plans');
      set('floor_plan', url);
    } catch (err) {
      setError(err instanceof Error ? `${t('admin.form.errors.floor_plan_upload_error')}: ${err.message}` : t('admin.form.errors.floor_plan_upload_error'));
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

  const handleSave = async (targetStatus?: PropertyStatus) => {
    if (!form.title?.trim()) { setError(t('admin.form.errors.title_required')); return; }
    if (!form.operation) { setError(t('admin.form.errors.operation_required')); return; }
    
    setSaving(true);
    setError(null);
    
    try {
      // 1. Clonar el estado para limpieza
      const data: any = { ...form };
      
      // Auto-generar slug si no hay uno
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
          .replace(/[^a-z0-9]+/g, '-')     // Quitar caracteres no alfanuméricos
          .replace(/^-+|-+$/g, '');       // Limpiar guiones al inicio/final
      }

      // 2. Establecer el estado de publicación si se ha pasado
      if (targetStatus) data.status = targetStatus;
      
      // 3. Limpiar strings vacíos para evitar conflictos en UNIQUE (reference, slug)
      // y para que se guarden como NULL en Postgres
      const nullableFields = ['reference', 'slug', 'meta_title', 'meta_description', 'street_number', 'door_number', 'parking_price', 'short_description', 'description', 'video_url', 'floor_plan', 'availability', 'property_condition', 'energy_rating', 'emissions_rating', 'conservation_state', 'block_staircase', 'urbanization'];
      
      nullableFields.forEach(field => {
        if (typeof data[field] === 'string' && data[field].trim() === '') {
          data[field] = null;
        }
      });

      // 4. Asegurar que los campos numéricos son números o null
      const numericFields = ['price', 'energy_consumption', 'emissions_value', 'community_fees', 'ibi'];
      numericFields.forEach(field => {
        if (data[field] !== null && data[field] !== undefined) {
          const p = Number(data[field]);
          data[field] = isNaN(p) ? null : p;
        } else {
          data[field] = null;
        }
      });

      // 5. Eliminar campos que NO deben ir en la mutación o que Postgres genera
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
      
      setSaving(false);
      navigate('/admin/propiedades');
    } catch (err: any) {
      console.error('[DATABASE_ERROR] Error al guardar propiedad:', err);
      if (err.code === '42703') {
        console.error('[CRITICAL] Columna inexistente en la base de datos. Por favor, ejecuta el script de migración SQL proporcionado.');
      }
      const errorMessage = err.message || err.details || t('admin.form.errors.save_error');
      const errorCode = err.code ? ` (${err.code})` : '';
      setError(`${errorMessage}${errorCode}`);
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
          <button onClick={() => navigate(`/admin/propiedades`)} className="text-[#888888] hover:text-[#FAF8F5] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-secondary text-3xl text-[#FAF8F5]">
              {isEditing ? t('admin.form.edit_title') : t('admin.form.new_title')}
            </h1>
            <p className="font-primary text-[#666666] text-sm mt-1">
              {isEditing ? t('admin.form.editing', { title: property?.title }) : t('admin.form.complete_data')}
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
            {t('admin.form.save_draft')}
          </button>
          <button
            onClick={() => handleSave('publicada')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#D4B673] transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            {saving ? t('admin.form.saving') : t('admin.form.publish')}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 p-4"><p className="font-primary text-red-400 text-sm">{error}</p></div>}

      {/* INFORMACIÓN PRINCIPAL */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>{t('admin.form.sections.primary')}</h2>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('admin.form.fields.title')}</label>
          <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} placeholder={t('admin.form.fields.title_placeholder')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.operation')}</label>
            <select className={selectClass} value={form.operation} onChange={e => set('operation', e.target.value as PropertyOperation)}>
              {(Object.entries(OPERATION_LABELS) as [PropertyOperation, string][]).map(([val, label]) => (
                <option key={val} value={val}>{t(label)}</option>
              ))}
            </select>
          </div>
          {form.operation === 'alquiler' && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('admin.form.fields.rent_type')}</label>
              <select className={selectClass} value={form.rent_type || ''} onChange={e => set('rent_type', e.target.value || null)}>
                <option value="">{t('admin.form.fields.rent_type_not_specified')}</option>
                <option value="habitual">{t('search.rent_type.habitual')}</option>
                <option value="temporal">{t('search.rent_type.temporal')}</option>
                <option value="vacacional">{t('search.rent_type.vacacional')}</option>
                <option value="otros">{t('search.rent_type.otros')}</option>
              </select>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.reference')}</label>
            <input className={inputClass} placeholder={t('admin.form.fields.reference_placeholder')} value={form.reference} onChange={e => set('reference', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.type')}</label>
            <select className={selectClass} value={form.property_type} onChange={e => set('property_type', e.target.value as PropertyType)}>
              {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{t(label)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.commercial_status')}</label>
            <select className={selectClass} value={form.commercial_status} onChange={e => set('commercial_status', e.target.value as CommercialStatus)}>
              {(Object.entries(COMMERCIAL_STATUS_LABELS) as [CommercialStatus, string][]).map(([val, label]) => (
                <option key={val} value={val}>{t(label)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.public_status')}</label>
            <select className={selectClass} value={form.status} onChange={e => set('status', e.target.value as PropertyStatus)}>
              {(Object.entries(STATUS_LABELS) as [PropertyStatus, string][]).map(([val, label]) => (
                <option key={val} value={val}>{t(label)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.price')}</label>
            <input type="number" className={inputClass} placeholder={t('admin.form.fields.price_placeholder')} value={form.price ?? ''} onChange={e => set('price', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.currency')}</label>
            <select className={selectClass} value={form.currency} onChange={e => set('currency', e.target.value)}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.featured')}</label>
            <div className="flex items-center h-10">
              <ToggleField label={t('admin.form.fields.featured_label')} checked={form.is_featured ?? false} onChange={v => set('is_featured', v)} />
            </div>
          </div>
        </div>

        {/* Community Fees & IBI (Solo Venta) */}
        {form.operation === 'venta' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1F1F1F]">
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('admin.form.fields.community_fees')}</label>
              <input type="number" className={inputClass} value={form.community_fees ?? ''} onChange={e => set('community_fees', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass}>{t('admin.form.fields.ibi')}</label>
              <input type="number" className={inputClass} value={form.ibi ?? ''} onChange={e => set('ibi', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        )}
      </div>

      {/* UBICACIÓN */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>{t('admin.form.sections.location')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.city')}</label>
            <input className={inputClass} placeholder={t('admin.form.fields.city_placeholder')} value={form.city ?? ''} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.zone')}</label>
            <input className={inputClass} placeholder={t('admin.form.fields.zone_placeholder')} value={form.zone ?? ''} onChange={e => set('zone', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className={labelClass}>{t('admin.form.fields.address')}</label>
            <input 
              className={inputClass} 
              placeholder={t('admin.form.fields.address_placeholder')} 
              value={form.address ?? ''} 
              onChange={e => set('address', e.target.value)}
              onBlur={() => {
                // Auto-buscar coordenadas si no están presentes y hay dirección
                if (form.address && !form.latitude && !form.longitude) {
                  // Pequeño delay para no interrumpir el flujo si el usuario va rápido
                  setTimeout(() => {
                    const btn = document.getElementById('search-map-btn');
                    if (btn) btn.click();
                  }, 500);
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.postal_code')}</label>
            <input className={inputClass} placeholder={t('admin.form.fields.postal_code_placeholder')} value={form.postal_code ?? ''} onChange={e => set('postal_code', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.street_number')}</label>
            <input className={inputClass} value={form.street_number ?? ''} onChange={e => set('street_number', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.door_number')}</label>
            <input className={inputClass} value={form.door_number ?? ''} onChange={e => set('door_number', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.block')}</label>
            <input className={inputClass} value={form.block_staircase ?? ''} onChange={e => set('block_staircase', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className={labelClass}>{t('admin.form.fields.urbanization')}</label>
            <input className={inputClass} value={form.urbanization ?? ''} onChange={e => set('urbanization', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 pt-2 border-t border-[#1F1F1F]">
            <label className={labelClass}>{t('admin.form.fields.coordinates')}</label>
            <div className="flex gap-2">
              <input 
                className={inputClass} 
                placeholder={t('admin.form.fields.lat_placeholder')} 
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
              <input 
                className={inputClass} 
                placeholder={t('admin.form.fields.lon_placeholder')} 
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
              <button
                id="search-map-btn"
                type="button"
                onClick={async () => {
                  if (!form.address || !form.city) {
                    setError(t('admin.form.errors.address_city_required'));
                    return;
                  }
                  try {
                    const queryParts = [form.address, form.city, "Málaga", "España"].filter(Boolean);
                    const query = encodeURIComponent(queryParts.join(', '));
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
                    const data = await res.json();
                    if (data && data[0]) {
                      set('latitude', Number(data[0].lat));
                      set('longitude', Number(data[0].lon));
                    } else {
                      setError(t('admin.form.errors.geo_not_found'));
                    }
                  } catch {
                    setError(t('admin.form.errors.geo_service_error'));
                  }
                }}
                className="px-4 bg-[#161616] border border-[#1F1F1F] text-[#FAF8F5] text-xs hover:border-[#C9A962] transition-colors whitespace-nowrap"
              >
                {t('admin.form.fields.search_map')}
              </button>
            </div>
            <p className="text-[10px] text-[#666666] mt-1 italic">
              {t('admin.form.fields.map_hint')}
            </p>
          </div>
          
          {/* Vista previa del mapa */}
          {form.latitude && form.longitude && (
            <div className="sm:col-span-2 mt-4 space-y-2">
              <label className={labelClass}>{t('admin.form.fields.map_preview')}</label>
              <div className="h-[300px] w-full border border-[#1F1F1F] overflow-hidden grayscale-[0.5] hover:grayscale-0 transition-all">
                <PropertyMap 
                  lat={Number(form.latitude)} 
                  lng={Number(form.longitude)} 
                  address={form.address || undefined}
                />
              </div>
              <p className="text-[10px] text-[#C9A962] italic">
                {t('admin.form.fields.map_exact_hint')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CARACTERÍSTICAS */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>{t('admin.form.sections.features')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.m2')}</label>
            <input type="number" className={inputClass} placeholder={t('admin.form.fields.m2_placeholder')} value={form.area_m2 ?? ''} onChange={e => set('area_m2', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.bedrooms')}</label>
            <input type="number" className={inputClass} placeholder={t('admin.form.fields.bedrooms_placeholder')} value={form.bedrooms} onChange={e => set('bedrooms', Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.bathrooms')}</label>
            <input type="number" className={inputClass} placeholder={t('admin.form.fields.bathrooms_placeholder')} value={form.bathrooms} onChange={e => set('bathrooms', Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.floor')}</label>
            <input className={inputClass} placeholder={t('admin.form.fields.floor_placeholder')} value={form.floor ?? ''} onChange={e => set('floor', e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.conservation_state')}</label>
            <select 
              className={selectClass} 
              value={form.conservation_state ?? ''} 
              onChange={e => set('conservation_state', e.target.value)}
            >
              <option value="">{t('admin.form.fields.condition_placeholder')}</option>
              <option value="Reformado">{t('property_conditions.Reformado')}</option>
              <option value="A reformar">{t('property_conditions.A reformar')}</option>
              <option value="Buen estado">{t('property_conditions.Buen estado')}</option>
              <option value="Obra nueva">{t('property_conditions.Obra nueva')}</option>
              <option value="A estrenar">{t('property_conditions.A estrenar')}</option>
              <option value="En construcción">{t('property_conditions.En construcción')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.availability')}</label>
            <input 
              className={inputClass} 
              placeholder={t('admin.form.fields.availability_placeholder')}
              value={form.availability ?? ''} 
              onChange={e => set('availability', e.target.value)}
            />
          </div>
        </div>

        {/* Orientación (Multiple selection) */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#1F1F1F]">
          <label className={labelClass}>{t('admin.form.fields.orientation')}</label>
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
                  {t(`admin.form.fields.orientation_${o.charAt(0).toLowerCase()}`)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Eficiencia Energética */}
        <div className="flex flex-col gap-5 pt-4 border-t border-[#1F1F1F]">
          <h3 className="font-primary text-[#FAF8F5] font-bold text-xs uppercase tracking-wider">
            {t('admin.form.fields.energy_efficiency')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>{t('admin.form.fields.energy_rating')}</label>
                <select className={selectClass} value={form.energy_rating ?? ''} onChange={e => set('energy_rating', e.target.value)}>
                  <option value="">-</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Exento', 'En trámite'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>{t('admin.form.fields.energy_consumption')} (kWh/m² año)</label>
                <input type="number" className={inputClass} value={form.energy_consumption ?? ''} onChange={e => set('energy_consumption', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>{t('admin.form.fields.emissions_rating')}</label>
                <select className={selectClass} value={form.emissions_rating ?? ''} onChange={e => set('emissions_rating', e.target.value)}>
                  <option value="">-</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Exento', 'En trámite'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>{t('admin.form.fields.emissions')} (kg CO₂/m² año)</label>
                <input type="number" className={inputClass} value={form.emissions_value ?? ''} onChange={e => set('emissions_value', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 pt-2">
          <ToggleField label={t('property.labels.features.has_elevator')} checked={form.has_elevator ?? false} onChange={v => set('has_elevator', v)} />
          <ToggleField label={t('property.labels.features.is_furnished')} checked={form.is_furnished ?? false} onChange={v => set('is_furnished', v)} />
          <ToggleField label={t('property.labels.features.has_terrace')} checked={form.has_terrace ?? false} onChange={v => set('has_terrace', v)} />
          <ToggleField label={t('property.labels.features.has_balcony')} checked={form.has_balcony ?? false} onChange={v => set('has_balcony', v)} />
          <ToggleField label={t('property.labels.features.has_parking')} checked={form.has_parking ?? false} onChange={v => set('has_parking', v)} />
          {form.has_parking && (
            <div className="flex flex-col gap-3 p-3 bg-[#111111] border border-[#1F1F1F] rounded-sm sm:col-span-2 lg:col-span-3">
              <ToggleField 
                label={t('admin.form.fields.parking_included')} 
                checked={form.parking_included ?? true} 
                onChange={v => set('parking_included', v)} 
              />
              {form.parking_included === false && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#1F1F1F]">
                  <label className={labelClass}>{t('admin.form.fields.parking_price')}</label>
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
          <ToggleField label={t('property.labels.features.has_storage')} checked={form.has_storage ?? false} onChange={v => set('has_storage', v)} />
          <ToggleField label={t('property.labels.features.has_pool')} checked={form.has_pool ?? false} onChange={v => set('has_pool', v)} />
          <ToggleField label={t('property.labels.features.heating')} checked={form.heating ?? false} onChange={v => set('heating', v)} />
          <ToggleField label={t('property.labels.features.air_conditioning')} checked={form.air_conditioning ?? false} onChange={v => set('air_conditioning', v)} />
          <ToggleField label={t('property.labels.features.is_exterior')} checked={form.is_exterior ?? false} onChange={v => set('is_exterior', v)} />
          <ToggleField label={t('property.labels.features.garden')} checked={form.garden ?? false} onChange={v => set('garden', v)} />
          <ToggleField label={t('property.labels.features.has_patio')} checked={form.has_patio ?? false} onChange={v => set('has_patio', v)} />
          <ToggleField label={t('property.labels.features.pets_allowed')} checked={form.pets_allowed ?? false} onChange={v => set('pets_allowed', v)} />
          <ToggleField label={t('property.labels.features.sea_views')} checked={form.sea_views ?? false} onChange={v => set('sea_views', v)} />
        </div>

      </div>

      {/* CONTENIDO COMERCIAL */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>{t('admin.form.sections.commercial')}</h2>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('admin.form.fields.long_desc')}</label>
          <RichTextEditor 
            content={form.description ?? ''} 
            onChange={v => set('description', v)} 
            placeholder={t('admin.form.fields.long_desc_placeholder')}
          />
        </div>
        {/* Highlights */}
        <div className="grid grid-cols-1 gap-6 pb-4 border-b border-[#1F1F1F]">
          <div className="flex flex-col gap-3">
            <label className={labelClass}>{t('admin.form.fields.highlights')}</label>
            <div className="flex gap-2">
              <input className={`${inputClass} flex-1`} placeholder={t('admin.form.fields.highlights_placeholder')} value={newHighlight} onChange={e => setNewHighlight(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())} />
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
          <label className={labelClass}>{t('admin.form.fields.tags_label')}</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-xs font-primary border transition-colors ${(form.tags ?? []).includes(tag) ? 'bg-[#C9A962]/20 border-[#C9A962] text-[#C9A962]' : 'bg-transparent border-[#1F1F1F] text-[#666666] hover:border-[#888888] hover:text-[#888888]'}`}
              >
                {t(`tags.${tag}`, { defaultValue: tag })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MULTIMEDIA */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>{t('admin.form.sections.multimedia')}</h2>

        <SortableImageGallery 
          images={allImages}
          onChange={handleImagesChange}
          onUpload={handleUnifiedUpload}
          uploading={uploadingImages}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.video')}</label>
            <div className="flex gap-2">
              <input className={`${inputClass} flex-1`} placeholder={t('admin.form.fields.video_placeholder')} value={form.video_url ?? ''} onChange={e => set('video_url', e.target.value)} />
              <div className="relative flex-shrink-0">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleVideoUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingVideo}
                  title={t('admin.form.fields.upload')}
                />
                <button 
                  type="button" 
                  className="flex items-center justify-center h-10 px-4 bg-[#161616] border border-[#1F1F1F] text-[#FAF8F5] text-sm hover:border-[#C9A962] transition-colors disabled:opacity-50"
                  disabled={uploadingVideo}
                >
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{uploadingVideo ? t('admin.form.fields.uploading') : t('admin.form.fields.upload')}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>{t('admin.form.fields.floor_plan')}</label>
            <div className="flex gap-2">
              <input className={`${inputClass} flex-1`} placeholder={t('admin.form.fields.floor_plan_placeholder')} value={form.floor_plan ?? ''} onChange={e => set('floor_plan', e.target.value)} />
              <div className="relative flex-shrink-0">
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleFloorPlanUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingFloorPlan}
                  title={t('admin.form.fields.upload')}
                />
                <button 
                  type="button" 
                  className="flex items-center justify-center h-10 px-4 bg-[#161616] border border-[#1F1F1F] text-[#FAF8F5] text-sm hover:border-[#C9A962] transition-colors disabled:opacity-50"
                  disabled={uploadingFloorPlan}
                >
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{uploadingFloorPlan ? t('admin.form.fields.uploading') : t('admin.form.fields.upload')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className={sectionClass}>
        <h2 className={sectionHeaderClass}>{t('admin.form.sections.seo')}</h2>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('admin.form.fields.slug')} ({t('admin.form.fields.slug_hint')})</label>
          <input className={inputClass} placeholder={t('admin.form.fields.slug_placeholder')} value={form.slug ?? ''} onChange={e => set('slug', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('admin.form.fields.meta_title')}</label>
          <input className={inputClass} placeholder={t('admin.form.fields.meta_title_placeholder')} value={form.meta_title ?? ''} onChange={e => set('meta_title', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>{t('admin.form.fields.meta_desc')}</label>
          <textarea className={`${inputClass} h-20 py-2.5 resize-none`} placeholder={t('admin.form.fields.meta_desc_placeholder')} value={form.meta_description ?? ''} onChange={e => set('meta_description', e.target.value)} />
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="sticky bottom-0 bg-[#0A0A0A] p-4 border-t border-[#1F1F1F] z-50 flex items-center justify-between gap-4 -mx-6 md:-mx-10 px-6 md:px-10 mt-8">
        <button onClick={() => navigate(`/admin/propiedades`)} className="font-primary text-sm text-[#888888] hover:text-[#FAF8F5] transition-colors">
          ← {t('admin.form.cancel')}
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('borrador')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {t('admin.form.save_draft')}
          </button>
          <button
            onClick={() => handleSave('publicada')}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#D4B673] transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(201,169,98,0.2)]"
          >
            <Eye className="w-4 h-4" />
            {saving ? t('admin.form.saving') : (isEditing ? t('admin.form.update_publish') : t('admin.form.publish_property'))}
          </button>
        </div>
      </div>
    </div>
  );
};
