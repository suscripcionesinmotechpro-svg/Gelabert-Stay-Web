import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { type PropertyOperation, type PropertyType, type CommercialStatus, PROPERTY_TYPE_LABELS, COMMERCIAL_STATUS_LABELS } from '../types/property';
import { PropertyCard } from '../components/PropertyCard';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const inputClass = "h-11 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors";

export const Propiedades = () => {
  const { t, i18n } = useTranslation();

  const OPERATIONS: { value: PropertyOperation | ''; label: string }[] = [
    { value: '', label: t('property.labels.operation.all') },
    { value: 'alquiler', label: t('property.labels.operation.alquiler') },
    { value: 'venta', label: t('property.labels.operation.venta') },
    { value: 'traspaso', label: t('property.labels.operation.traspaso') },
  ];

  const PROPERTY_TYPES: { value: PropertyType | ''; label: string }[] = [
    { value: '', label: t('property.labels.type.all') },
    ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, labelKey]) => ({
      value: value as PropertyType,
      label: t(labelKey),
    })),
  ];

  const COMMERCIAL_STATUSES: { value: CommercialStatus | ''; label: string }[] = [
    { value: '', label: t('property.labels.commercial_status.all') },
    ...Object.entries(COMMERCIAL_STATUS_LABELS).map(([value, labelKey]) => ({
      value: value as CommercialStatus,
      label: t(labelKey),
    })),
  ];
  const [searchParams] = useSearchParams();
  const initialOperation = (searchParams.get('operation') as PropertyOperation) || '';
  const [operation, setOperation] = useState<PropertyOperation | ''>(initialOperation);
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [commercialStatus, setCommercialStatus] = useState<CommercialStatus | ''>('');
  const [zone, setZone] = useState('');
  const [keyword, setKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Características adicionales
  const [filtersBool, setFiltersBool] = useState({
    has_elevator: false,
    is_furnished: false,
    has_terrace: false,
    has_parking: false,
    has_pool: false,
    air_conditioning: false,
    pets_allowed: false,
    no_pets_allowed: false,
  });

  // Efecto para actualizar cuando cambian los query parameters estando ya en la página
  useEffect(() => {
    const op = searchParams.get('operation') as PropertyOperation | null;
    if (op) {
      setOperation(op);
    }
  }, [searchParams]);

  const toggleBool = (key: keyof typeof filtersBool) => {
    setFiltersBool(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setOperation(''); setPropertyType(''); setCommercialStatus('');
    setZone(''); setKeyword(''); setMinPrice(''); setMaxPrice('');
    setBedrooms(''); setBathrooms('');
    setFiltersBool({
      has_elevator: false, is_furnished: false, has_terrace: false,
      has_parking: false, has_pool: false, air_conditioning: false, pets_allowed: false, no_pets_allowed: false
    });
  };

  const { properties, loading, error } = useProperties({
    operation: operation || undefined,
    property_type: propertyType || undefined,
    commercial_status: commercialStatus || undefined,
    zone: zone || undefined,
    keyword: keyword || undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    bathrooms: bathrooms ? Number(bathrooms) : undefined,
    ...filtersBool
  });

  return (
    <div className="w-full pb-20">
      <Helmet>
        <title>{t('seo.properties_title')} | Gelabert Homes Real Estate</title>
        <meta name="description" content={t('seo.properties_description')} />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/propiedades/" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/propiedades/" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/propiedades/" />
      </Helmet>
      {/* Header */}
      <section className="w-full px-6 md:px-14 py-16 bg-[#0A0A0A] flex flex-col gap-4 border-b border-[#1F1F1F]">
        <h1 className="font-secondary text-5xl text-[#FAF8F5]">{t('nav.properties')}</h1>
            <p className="font-primary text-[#DFDFE6] text-xl md:text-2xl leading-relaxed max-w-4xl font-light">
              {t('seo.properties_description')}
            </p>
        {/* Tabs de Operación Visuales */}
        <div className="flex gap-1 mt-4 bg-[#0F0F0F] p-1 self-start border border-[#1F1F1F]">
          {OPERATIONS.map(op => (
            <button
              key={op.value}
              onClick={() => setOperation(op.value)}
              className={`px-6 py-2.5 font-primary text-sm transition-all font-bold tracking-wider ${
                operation === op.value ? 'bg-[#C9A962] text-[#0A0A0A]' : 'text-[#888888] hover:text-[#FAF8F5]'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </section>

      {/* Panel de Filtros */}
      <section className="w-full px-6 md:px-14 py-6 bg-[#0A0A0A] border-b border-[#1F1F1F] sticky top-0 z-20">
        <div className="flex flex-col gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Buscador Global (Ocupa 2 columnas en pantallas muy grandes) */}
            <div className="flex items-center gap-2 h-11 bg-[#161616] border border-[#1F1F1F] px-3 lg:col-span-2">
              <Search className="w-4 h-4 text-[#444444] shrink-0" />
              <input 
                className="flex-1 bg-transparent font-primary text-[#FAF8F5] text-sm outline-none placeholder:text-[#444444]"
                placeholder={t('property.labels.features.search_placeholder')}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            
            {/* Filtros Básicos Principales */}
            <select className={inputClass} value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType | '')}>
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            
            <input className={inputClass} placeholder={t('property.labels.features.city_placeholder')} value={zone} onChange={e => setZone(e.target.value)} />
            
            <input className={inputClass} placeholder={t('property.labels.features.min_price')} type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            
            <input className={inputClass} placeholder={t('property.labels.features.max_price')} type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className="flex items-center gap-2 font-primary text-[#C9A962] text-sm hover:text-[#D4B673] transition-colors font-bold tracking-widest uppercase"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showAdvanced ? t('property.labels.features.hide_advanced') : t('property.labels.features.show_advanced')}
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={clearFilters} className="font-primary text-[#666666] text-xs uppercase tracking-widest hover:text-[#FAF8F5] transition-colors">
              {t('property.labels.features.clear_filters')}
            </button>
          </div>

          {/* Panel Filtros Avanzados */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 mt-2 border-t border-[#1F1F1F] animate-fade-in">
              <div className="flex flex-col gap-4">
                <span className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.labels.features.additional_features')}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <input className={inputClass} placeholder={t('property.labels.features.min_bedrooms')} type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} />
                  <input className={inputClass} placeholder={t('property.labels.features.min_bathrooms')} type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} />
                  <select className={`${inputClass} sm:col-span-2`} value={commercialStatus} onChange={e => setCommercialStatus(e.target.value as CommercialStatus | '')}>
                    {COMMERCIAL_STATUSES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <span className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.labels.features.amenities')}</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'has_elevator', label: t('property.labels.features.has_elevator') },
                    { key: 'is_furnished', label: t('property.labels.features.is_furnished') },
                    { key: 'has_terrace', label: t('property.labels.features.has_terrace') },
                    { key: 'has_parking', label: t('property.labels.features.has_parking') },
                    { key: 'has_pool', label: t('property.labels.features.has_pool') },
                    { key: 'air_conditioning', label: t('property.labels.features.air_conditioning') },
                    { key: 'pets_allowed', label: t('property.labels.features.pets_allowed') },
                    { key: 'no_pets_allowed', label: t('property.labels.features.no_pets_allowed') },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        // Mutually exclusive toggle for pets
                        if (key === 'pets_allowed' && !filtersBool.pets_allowed) {
                          setFiltersBool(prev => ({ ...prev, pets_allowed: true, no_pets_allowed: false }));
                        } else if (key === 'no_pets_allowed' && !filtersBool.no_pets_allowed) {
                          setFiltersBool(prev => ({ ...prev, no_pets_allowed: true, pets_allowed: false }));
                        } else {
                          toggleBool(key as keyof typeof filtersBool);
                        }
                      }}
                      className={`px-4 py-2 font-primary text-xs transition-colors border ${
                        filtersBool[key as keyof typeof filtersBool] 
                          ? 'bg-[#C9A962]/20 border-[#C9A962] text-[#C9A962]' 
                          : 'bg-[#161616] border-[#1F1F1F] text-[#888888] hover:border-[#444444] hover:text-[#FAF8F5]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contenido / Listado de Propiedades */}
      <section className="w-full px-6 md:px-14 py-8 bg-[#0F0F0F]">
        {/* Count */}
        <p className="font-primary text-[#666666] text-sm mb-6 flex justify-between items-center">
          <span>{loading ? t('property.labels.features.loading') : error ? t('property.labels.features.error') : `${properties.length} ${t('property.labels.features.results')}`}</span>
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-primary text-red-400 text-sm">{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#161616] border border-[#1F1F1F] rounded-sm">
            <p className="font-primary text-[#888888] text-base">{t('property.labels.features.no_results')}</p>
            <button onClick={clearFilters} className="px-6 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm tracking-wider uppercase hover:bg-[#D4B673] transition-colors mt-2">
              {t('property.labels.features.clear_filters')}
            </button>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {properties.map(p => (
              <motion.div 
                key={p.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 20 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                }}
              >
              <PropertyCard
                title={p.title}
                title_en={p.title_en ?? undefined}
                price={p.price ?? 0}
                location={[p.zone, p.city].filter(Boolean).join(', ')}
                area={p.area_m2 ?? 0}
                bedrooms={p.bedrooms}
                bathrooms={p.bathrooms}
                operation={p.operation.toUpperCase() as 'ALQUILER' | 'VENTA' | 'TRASPASO'}
                isFeatured={p.is_featured}
                imageUrl={p.main_image ?? ''}
                linkTo={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${p.reference || p.slug || p.id}`}
                floor={p.floor}
                description={p.short_description ?? undefined}
                description_en={p.short_description_en ?? undefined}
                gallery={p.gallery}
                id={p.reference || p.id}
              />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <div className="text-center py-4">
        <Link to="/admin/login" className="font-primary text-xs text-[#333333] hover:text-[#666666] transition-colors">
          {t('property.labels.features.admin_panel')} →
        </Link>
      </div>
    </div>
  );
};
