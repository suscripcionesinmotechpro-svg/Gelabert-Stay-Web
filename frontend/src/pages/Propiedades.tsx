import { useState, useEffect } from 'react'; 
import { Link, useSearchParams } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { type PropertyOperation, type PropertyType, type CommercialStatus, PROPERTY_TYPE_LABELS, COMMERCIAL_STATUS_LABELS } from '../types/property';
import { PropertyCard } from '../components/PropertyCard';
import { PropertySkeleton } from '../components/PropertySkeleton';
import { cn } from '../lib/utils';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, Heart, Map as MapIcon, List as ListIcon } from 'lucide-react';
import { PropertiesMap } from '../components/PropertiesMap';
import { useFavorites } from '../hooks/useFavorites';
import { useComparator } from '../hooks/useComparator';
import { PropertyComparator } from '../components/PropertyComparator';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const inputClass = "h-11 bg-white/[0.03] border border-white/10 px-4 font-primary text-white/70 text-sm outline-none focus:border-[#C9A962] focus:bg-white/[0.05] transition-all rounded-sm placeholder:text-white/20";

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
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [operation, setOperation] = useState<PropertyOperation | ''>((searchParams.get('operation') as PropertyOperation) || '');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>((searchParams.get('property_type') as PropertyType) || '');
  const [commercialStatus, setCommercialStatus] = useState<CommercialStatus | ''>((searchParams.get('commercial_status') as CommercialStatus) || '');
  const [zone, setZone] = useState(searchParams.get('zone') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') || '');
  const [reference, setReference] = useState(searchParams.get('reference') || '');
  const [showFavorites, setShowFavorites] = useState(searchParams.get('favorites') === 'true');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, canAdd } = useComparator();

  // Características adicionales
  const [filtersBool, setFiltersBool] = useState({
    has_elevator: searchParams.get('has_elevator') === 'true',
    is_furnished: searchParams.get('is_furnished') === 'true',
    has_terrace: searchParams.get('has_terrace') === 'true',
    has_parking: searchParams.get('has_parking') === 'true',
    has_pool: searchParams.get('has_pool') === 'true',
    air_conditioning: searchParams.get('air_conditioning') === 'true',
    pets_allowed: searchParams.get('pets_allowed') === 'true',
    no_pets_allowed: searchParams.get('no_pets_allowed') === 'true',
  });

  // Efecto para sincronizar filtros hacia la URL
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (operation) params.set('operation', operation);
      if (propertyType) params.set('property_type', propertyType);
      if (commercialStatus) params.set('commercial_status', commercialStatus);
      if (zone) params.set('zone', zone);
      if (keyword) params.set('keyword', keyword);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (bedrooms) params.set('bedrooms', bedrooms);
      if (bathrooms) params.set('bathrooms', bathrooms);
      if (reference) params.set('reference', reference);
      if (showFavorites) params.set('favorites', 'true');
      Object.entries(filtersBool).forEach(([k, v]) => {
        if (v) params.set(k, 'true');
      });
      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    operation, propertyType, commercialStatus, zone, keyword, minPrice, maxPrice,
    bedrooms, bathrooms, reference, showFavorites, filtersBool, setSearchParams
  ]);

  const toggleBool = (key: keyof typeof filtersBool) => {
    setFiltersBool(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setOperation(''); setPropertyType(''); setCommercialStatus('');
    setZone(''); setKeyword(''); setReference(''); setMinPrice(''); setMaxPrice('');
    setBedrooms(''); setBathrooms(''); setShowFavorites(false);
    setFiltersBool({
      has_elevator: false, is_furnished: false, has_terrace: false,
      has_parking: false, has_pool: false, air_conditioning: false, pets_allowed: false, no_pets_allowed: false
    });
  };

  const { properties, loading, loadingMore, hasMore, loadMore, error } = useProperties({
    operation: operation || undefined,
    property_type: propertyType || undefined,
    commercial_status: commercialStatus || undefined,
    zone: zone || undefined,
    keyword: keyword || undefined,
    reference: reference || undefined,
    saved_ids: showFavorites ? favorites : undefined,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    bathrooms: bathrooms ? Number(bathrooms) : undefined,
    ...filtersBool
  });

  return (
    <div className="w-full bg-[#050505] min-h-screen">
      <Helmet>
        <title>{t('seo.properties_title')} | Gelabert Homes Real Estate</title>
        <meta name="description" content={t('seo.properties_description')} />
        <meta name="keywords" content="propiedades en venta málaga, alquiler pisos málaga, casas en venta costa del sol, apartamentos málaga, inmuebles málaga gelabert homes" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/propiedades' : 'https://gelaberthomes.es/propiedades'} />
        <link rel="alternate" hrefLang="es" href="https://gelaberthomes.es/propiedades" />
        <link rel="alternate" hrefLang="en" href="https://gelaberthomes.es/en/propiedades" />
        <link rel="alternate" hrefLang="x-default" href="https://gelaberthomes.es/propiedades" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gelabert Homes Real Estate" />
        <meta property="og:url" content={i18n.language.startsWith('en') ? 'https://gelaberthomes.es/en/propiedades' : 'https://gelaberthomes.es/propiedades'} />
        <meta property="og:title" content={`${t('seo.properties_title')} | Gelabert Homes`} />
        <meta property="og:description" content={t('seo.properties_description')} />
        <meta property="og:image" content="https://gelaberthomes.es/sharing-logo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Catálogo de propiedades - Gelabert Homes" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${t('seo.properties_title')} | Gelabert Homes`} />
        <meta name="twitter:description" content={t('seo.properties_description')} />
        <meta name="twitter:image" content="https://gelaberthomes.es/sharing-logo.jpg" />
        {/* JSON-LD: CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": i18n.language.startsWith('en') ? "Properties in Malaga | Gelabert Homes" : "Propiedades en Málaga | Gelabert Homes",
            "description": t('seo.properties_description'),
            "url": i18n.language.startsWith('en') ? "https://gelaberthomes.es/en/propiedades/" : "https://gelaberthomes.es/propiedades/",
            "publisher": {
              "@type": "Organization",
              "name": "Gelabert Homes Real Estate",
              "url": "https://gelaberthomes.es/"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://gelaberthomes.es/" },
                { "@type": "ListItem", "position": 2, "name": "Propiedades", "item": "https://gelaberthomes.es/propiedades/" }
              ]
            }
          })}
        </script>
      </Helmet>
      
      {/* Premium Mesh Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C9A962]/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#C9A962]/5 blur-[150px] rounded-full mix-blend-screen animation-delay-2000" />
      </div>

      {/* Header / Hero Section */}
      <section className="relative h-[40vh] min-h-[400px] flex items-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center brightness-[0.45] transform scale-105 transition-transform duration-1000 ease-in-out"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/30 via-[#050505]/70 to-[#050505]" />
        </div>

        <div className="relative z-10 w-full px-6 md:px-14 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-secondary text-5xl md:text-7xl text-[#FAF8F5] leading-tight mb-4">
              {t('nav.properties')}
            </h1>
            <p className="font-primary text-[#DFDFE6]/60 text-lg md:text-xl leading-relaxed max-w-2xl font-light">
              {t('seo.properties_description')}
            </p>
            
            {/* Tabs de Operación Visuales */}
            <div className="flex flex-wrap md:flex-nowrap gap-1 mt-8 bg-white/5 p-1 self-start border border-white/10 backdrop-blur-md rounded-sm w-full md:w-auto">
              {OPERATIONS.map(op => (
                <button
                  key={op.label}
                  onClick={() => setOperation(op.value)}
                  className={`flex-1 sm:flex-none px-4 md:px-8 py-3 font-primary text-[9px] md:text-[10px] transition-all font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-sm ${
                    operation === op.value 
                      ? 'bg-[#C9A962] text-[#0A0A0A] shadow-[0_0_20px_rgba(201,169,98,0.2)]' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Panel de Filtros Sticky */}
      <section className="sticky top-24 z-30 w-full px-6 md:px-14 py-4 md:py-6 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Buscador Global */}
            <div className="flex items-center gap-3 h-11 bg-white/[0.03] border border-white/10 px-4 lg:col-span-2 rounded-sm focus-within:border-[#C9A962] transition-colors">
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input 
                className="flex-1 bg-transparent font-primary text-white text-sm outline-none placeholder:text-white/20"
                placeholder={t('property.labels.features.search_placeholder')}
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>
            
            {/* Filtros Básicos */}
            <select className={inputClass} value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType | '')}>
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0A0A0A]">{t.label}</option>)}
            </select>
            
            <input className={inputClass} placeholder={t('property.labels.features.city_placeholder')} value={zone} onChange={e => setZone(e.target.value)} />
            
            <input className={inputClass} placeholder={t('property.labels.features.min_price')} type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            
            <input className={inputClass} placeholder={t('property.labels.features.max_price')} type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            
            <input className={inputClass} placeholder={t('property.labels.features.reference_placeholder') || 'REF: GEL-XXX'} value={reference} onChange={e => setReference(e.target.value)} />

            <button 
              onClick={() => setShowFavorites(!showFavorites)}
              className={cn(inputClass, "flex items-center justify-center gap-2 transition-all", showFavorites ? "bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]" : "")}
            >
              <Heart className={cn("w-4 h-4", showFavorites && "fill-current")} />
              <span className="hidden sm:inline">{t('property.labels.features.favorites')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)} 
              className="flex items-center gap-2 font-primary text-[#C9A962] text-[10px] hover:text-[#D4B673] transition-colors font-bold tracking-[0.2em] uppercase"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvanced ? t('property.labels.features.hide_advanced') : t('property.labels.features.show_advanced')}
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-sm border border-white/10">
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-sm transition-all", viewMode === 'list' ? "bg-[#C9A962] text-black" : "text-white/40 hover:text-white")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={cn("p-2 rounded-sm transition-all", viewMode === 'map' ? "bg-[#C9A962] text-black" : "text-white/40 hover:text-white")}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Panel Filtros Avanzados */}
          {showAdvanced && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 mt-2 border-t border-white/5"
            >
              <div className="flex flex-col gap-6">
                <span className="font-primary text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">{t('property.labels.features.additional_features')}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input className={inputClass} placeholder={t('property.labels.features.min_bedrooms')} type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} />
                  <input className={inputClass} placeholder={t('property.labels.features.min_bathrooms')} type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} />
                  <select className={`${inputClass} sm:col-span-2`} value={commercialStatus} onChange={e => setCommercialStatus(e.target.value as CommercialStatus | '')}>
                    {COMMERCIAL_STATUSES.map(t => <option key={t.value} value={t.value} className="bg-[#0A0A0A]">{t.label}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-6">
                <span className="font-primary text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">{t('property.labels.features.amenities')}</span>
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
                        if (key === 'pets_allowed' && !filtersBool.pets_allowed) {
                          setFiltersBool(prev => ({ ...prev, pets_allowed: true, no_pets_allowed: false }));
                        } else if (key === 'no_pets_allowed' && !filtersBool.no_pets_allowed) {
                          setFiltersBool(prev => ({ ...prev, no_pets_allowed: true, pets_allowed: false }));
                        } else {
                          toggleBool(key as keyof typeof filtersBool);
                        }
                      }}
                      className={`px-4 py-2 font-primary text-[10px] uppercase font-bold tracking-widest transition-all border rounded-sm ${
                        filtersBool[key as keyof typeof filtersBool] 
                          ? 'bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contenido / Listado de Propiedades */}
      <section className="relative z-10 w-full px-6 md:px-14 py-16 max-w-[1600px] mx-auto">
        {/* Count */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
          <p className="font-primary text-white/40 text-xs font-bold tracking-widest uppercase">
            {loading ? t('property.labels.features.loading') : error ? t('property.labels.features.error') : `${properties.length} ${t('property.labels.features.results')}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-primary text-red-400 text-sm">{error}</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/[0.02] border border-white/5 rounded-sm">
            <p className="font-primary text-white/40 text-lg">{t('property.labels.features.no_results')}</p>
            <button onClick={clearFilters} className="px-10 py-4 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-[#D4B673] transition-all shadow-[0_0_20px_rgba(201,169,98,0.1)]">
              {t('property.labels.features.clear_filters')}
            </button>
          </div>
        ) : viewMode === 'map' ? (
          <PropertiesMap properties={properties} />
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { 
                  staggerChildren: 0.05,
                  delayChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {properties.map((p, index) => (
              <motion.div 
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { 
                    opacity: 1, 
                    y: 0, 
                    transition: { 
                      duration: 0.6, 
                      ease: [0.16, 1, 0.3, 1] 
                    } 
                  }
                }}
                layout
              >
              <PropertyCard
                index={index}
                title={p.title}
                title_en={p.title_en ?? undefined}
                price={p.price ?? 0}
                location={[p.zone, p.city].filter(Boolean).join(', ')}
                area={p.area_m2 ?? 0}
                bedrooms={p.bedrooms}
                bathrooms={p.bathrooms}
                operation={p.operation.toUpperCase() as 'ALQUILER' | 'VENTA' | 'TRASPASO'}
                commercialStatus={p.commercial_status}
                isFeatured={p.is_featured}
                imageUrl={p.main_image || ''}
                linkTo={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${p.reference || p.slug || p.id}`}
                floor={p.floor}
                orientation={p.orientation}
                description={p.short_description || undefined}
                description_en={p.short_description_en || undefined}
                gallery={p.gallery}
                videoUrl={p.video_url}
                floorPlanUrl={p.floor_plan}
                id={p.id}
                reference={p.reference ?? undefined}
                createdAt={p.created_at}
                tags={p.tags}
                onTagClick={(tag) => {
                  setKeyword(tag);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isFavorite={isFavorite(p.id)}
                onToggleFavorite={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(p.id);
                }}
                isInCompare={isInCompare(p.id)}
                onToggleCompare={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isInCompare(p.id)) {
                    removeFromCompare(p.id);
                  } else if (canAdd) {
                    addToCompare(p);
                  }
                }}
              />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More Button */}
        {hasMore && viewMode === 'list' && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-16 pb-8"
          >
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-12 py-4 border border-[#C9A962] text-[#C9A962] font-primary font-bold text-[10px] tracking-[0.2em] uppercase hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 backdrop-blur-sm"
            >
              {loadingMore ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : (
                <span>Cargar Más Resultados</span>
              )}
            </button>
          </motion.div>
        )}
      </section>

      <div className="text-center py-4">
        <Link to="/admin/login" className="font-primary text-xs text-[#333333] hover:text-[#666666] transition-colors">
          {t('property.labels.features.admin_panel')} &rarr;
        </Link>
      </div>

      {/* Property Comparator Panel */}
      {compareList.length > 0 && (
        <PropertyComparator
          properties={compareList}
          onRemove={removeFromCompare}
          onClear={clearCompare}
        />
      )}
    </div>
  );
};
