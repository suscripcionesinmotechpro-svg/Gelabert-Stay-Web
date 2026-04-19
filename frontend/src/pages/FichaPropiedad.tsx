import { useParams, Link } from 'react-router-dom';
import { useProperty, useProperties } from '../hooks/useProperties';
import { useAutoTranslate, useAutoTranslateArray } from '../hooks/useAutoTranslate';
import { PropertyCard } from '../components/PropertyCard';
import { PremiumImage } from '../components/PremiumImage';
import { MapPin, Maximize, Bed, Bath, Layers, ArrowLeft, Phone, Mail, Check, Play, Map as MapIcon, Compass, Copy, CheckCheck, Send } from 'lucide-react';
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, RENT_TYPE_LABELS, COMMERCIAL_STATUS_LABELS } from '../types/property';
import type { PropertyVideo, PropertyRoom } from '../types/property';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { PropertyMap } from '../components/PropertyMap';
import { PropertyReference } from '../components/PropertyReference';
import { supabase } from '../lib/supabase';
import { useTranslation, Trans } from 'react-i18next';
import { getWhatsAppLink } from '../utils/whatsapp';
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const FichaPropiedad = () => {
  const { id } = useParams<{ id: string }>();
  const { property, loading, error } = useProperty(id);
  const { t, i18n } = useTranslation();
  
  const { translatedText: autoTitle } = useAutoTranslate(property?.title, property?.title_en);
  const { translatedText: autoDescription } = useAutoTranslate(property?.description, property?.description_en);
  const { translatedArray: autoHighlights } = useAutoTranslateArray(property?.highlights, property?.highlights_en);
  const { translatedText: autoCondition } = useAutoTranslate(property?.property_condition, null);
  const { translatedText: autoAvailability } = useAutoTranslate(property?.availability, null);

  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxSlides, setLightboxSlides] = useState<{ src: string }[]>([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [formSent, setFormSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [solvencyAccepted, setSolvencyAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'fotos' | 'video' | 'plano' | 'ubicacion'>('fotos');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(propertyUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const openLightbox = (images: string[], idx: number) => {
    setLightboxSlides(images.map(src => ({ src })));
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  // General gallery images (excluding rooms if it's a room rental)
  const generalImages = [
    property?.main_image, 
    ...(property?.gallery ?? [])
  ].filter(Boolean) as string[];


  // Unify all videos (General + Rooms)
  const allVideos: PropertyVideo[] = [
    ...(property?.videos ?? []).map((v: string | PropertyVideo, i: number) => {
      const vid = typeof v === 'string' ? { url: v, title: '' } : v;
      if (!vid.title && (property?.is_room_rental || property?.property_type === 'habitacion')) {
        return { ...vid, title: i === 0 ? 'ZONAS COMUNES' : `VÍDEO ${i + 1}` };
      }
      return vid;
    }),
    ...((property?.is_room_rental || property?.property_type === 'habitacion')
      ? (property?.rooms ?? []).map((r: PropertyRoom) => r.video ? { ...r.video, title: r.video.title || r.name } : null).filter(Boolean) 
      : [])
  ] as PropertyVideo[];


  // Lightbox key handling is handled internally by yet-another-react-lightbox

  const { properties: similar } = useProperties({
    operation: property?.operation,
    zone: property?.zone || undefined,
  });
  const similarProps = similar.filter(p => p.id !== property?.id).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center gap-4">
        <p className="font-primary text-[#888888] text-lg">{t('property.labels.features.not_found')}</p>
        <Link to={i18n.language.startsWith('en') ? "/en/propiedades" : "/propiedades"} className="font-primary text-[#C9A962] text-sm hover:underline">← {t('property.labels.features.back_to_catalog')}</Link>
      </div>
    );
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const propertyUrl = `https://gelaberthomes.es/propiedades/${property?.reference || property?.slug || property?.id}`;
      const messageWithLink = `${formData.message}\n\n---\nConsulta sobre: ${autoTitle}\nEnlace: ${propertyUrl}`;

      // 1. Log en Supabase
      if (property) {
        await supabase
          .from('inquiries')
          .insert([
            {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              message: messageWithLink,
              property_id: property.id,
              inquiry_type: property.operation === 'alquiler' ? 'alquiler' : 'general',
              privacy_accepted: privacyAccepted,
              solvency_accepted: property.operation === 'alquiler' ? solvencyAccepted : null,
              accepted_at: new Date().toISOString(),
              status: 'nuevo'
            }
          ]);
      }

      // 2. Enviar a Netlify Forms
      const netlifyData = new URLSearchParams();
      netlifyData.append('form-name', 'property-inquiry');
      netlifyData.append('bot-field', '');
      netlifyData.append('name', formData.name);
      netlifyData.append('email', formData.email);
      netlifyData.append('phone', formData.phone);
      netlifyData.append('message', messageWithLink);
      netlifyData.append('property_id', property?.id || '');
      netlifyData.append('property_reference', property?.reference || '');
      netlifyData.append('property_url', propertyUrl);

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: netlifyData.toString(),
      });

      setFormSent(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setFormError(t('property.labels.features.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const translatedTitle = autoTitle;
  const translatedDescription = autoDescription;

  // SEO Fallbacks
  const seoTitle = property.meta_title || `${translatedTitle} | ${property.city} | Gelabert Homes Real Estate`;

  // Título estructurado para compartir (OpenGraph / WhatsApp)
  // Ej: "Alquiler Piso · Málaga · 800 €/mes · 40 m² · Baños 1 · Planta 5º"
  const formatPrice = (price: number | null, operation: string) => {
    if (!price) return null;
    return `${price.toLocaleString('es-ES')} €${operation === 'alquiler' ? '/mes' : ''}`;
  };

  const sharingTitleStr = [
    `${property.operation.charAt(0).toUpperCase() + property.operation.slice(1)} ${t(PROPERTY_TYPE_LABELS[property.property_type])}`,
    property.city,
    formatPrice(property.price, property.operation),
    property.area_m2 ? `${property.area_m2} m²` : null,
    property.bathrooms ? `Baños ${property.bathrooms}` : null,
    property.floor ? `Planta ${property.floor}` : null
  ].filter(Boolean).join(' · ');

  // Build a rich feature snippet for og:description — shows characteristics, not free text
  const featureSnippet = [
    property.area_m2 ? `${property.area_m2} m²` : null,
    property.bedrooms > 0 ? `${property.bedrooms} hab.` : null,
    property.bathrooms > 0 ? `${property.bathrooms} baños` : null,
    property.has_parking ? 'Parking' : null,
    property.has_pool ? 'Piscina' : null,
    property.sea_views ? 'Vistas al mar' : null,
    property.has_terrace ? 'Terraza' : null,
    property.zone || property.city,
  ].filter(Boolean).join(' · ');

  const seoDescription = property.meta_description
    || (featureSnippet ? `${sharingTitleStr} — ${featureSnippet}` : (translatedDescription ? translatedDescription.replace(/<[^>]*>/g, '').slice(0, 160) : ''));

  // Usamos URL con slash final para mejorar compatibilidad con algunos scrapers
  const propertyUrl = `https://gelaberthomes.es${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${property.reference || property.slug || property.id}`;
  
  // Optimización de imagen para previsualización (WhatsApp prefiere < 300KB)
  const mainImg = property.main_image?.trim() || (property.gallery && property.gallery.length > 0 ? property.gallery.find((img: string) => img && img.trim()) || null : null);
  const isSupabaseImage = mainImg?.includes('supabase.co') && mainImg?.includes('object/public');
  // Use logo-og.png (1200x630, proper OG size) as fallback — not logo.png (square)
  const previewImage = isSupabaseImage
    ? mainImg!.replace('object/public', 'render/image/public').split('?')[0] + '?width=1200&height=630&resize=contain&quality=80'
    : (mainImg || 'https://gelaberthomes.es/logo-og.png');

  const whatsappLink = getWhatsAppLink({
    context: 'property',
    propertyName: translatedTitle,
    propertyRef: property.reference || property.id.slice(0, 8),
    url: propertyUrl
  });

  const propertyKeywords = [
    translatedTitle,
    property.city,
    property.zone,
    t(OPERATION_LABELS[property.operation]),
    t(PROPERTY_TYPE_LABELS[property.property_type]),
    'Gelabert Homes',
    'inmobiliaria Málaga'
  ].filter(Boolean).join(', ');

  return (
    <div className="w-full pb-20 bg-[#0F0F0F]">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={propertyKeywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={propertyUrl} />
        <link rel="image_src" href={previewImage} />
        
        {/* Google / Schema.org */}
        <meta itemProp="name" content={seoTitle} />
        <meta itemProp="description" content={seoDescription} />
        <meta itemProp="image" content={previewImage} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Gelabert Homes Real Estate" />
        <meta property="og:url" content={propertyUrl} />
        <meta property="og:title" content={sharingTitleStr} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={previewImage} />
        <meta property="og:image:secure_url" content={previewImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content={sharingTitleStr} />
        <meta property="og:locale" content={i18n.language.startsWith('en') ? 'en_US' : 'es_ES'} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={sharingTitleStr} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={previewImage} />
        <meta name="twitter:image:alt" content={sharingTitleStr} />

        {/* Hreflang para versionado internacional */}
        <link rel="alternate" hrefLang="es" href={`https://gelaberthomes.es/propiedades/${property.reference || property.slug || property.id}`} />
        <link rel="alternate" hrefLang="en" href={`https://gelaberthomes.es/en/propiedades/${property.reference || property.slug || property.id}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://gelaberthomes.es/propiedades/${property.reference || property.slug || property.id}`} />

        {/* JSON-LD: RealEstateListing — Rich Results in Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": translatedTitle,
            "description": translatedDescription?.slice(0, 500),
            "image": previewImage,
            "url": propertyUrl,
            "identifier": property.reference || property.id,
            "offers": {
              "@type": "Offer",
              "price": property.price,
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              "url": propertyUrl
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": property.city,
              "addressRegion": "Andalucía",
              "addressCountry": "ES",
              ...(property.postal_code ? { "postalCode": property.postal_code } : {})
            },
            ...(property.bedrooms > 0 ? { "numberOfRooms": property.bedrooms } : {}),
            ...(property.bathrooms > 0 ? { "numberOfBathroomsTotal": property.bathrooms } : {}),
            ...(property.area_m2 ? { "floorSize": { "@type": "QuantitativeValue", "value": property.area_m2, "unitCode": "MTK" } } : {}),
            "additionalProperty": [
              ...(property.has_parking ? [{ "@type": "PropertyValue", "name": "Parking", "value": true }] : []),
              ...(property.has_pool ? [{ "@type": "PropertyValue", "name": "Swimming Pool", "value": true }] : []),
              ...(property.sea_views ? [{ "@type": "PropertyValue", "name": "Sea Views", "value": true }] : []),
            ],
            "seller": {
              "@type": "RealEstateAgent",
              "name": "Gelabert Homes Real Estate",
              "url": "https://gelaberthomes.es/",
              "telephone": "+34611898827"
            }
          })}
        </script>

        {/* JSON-LD: BreadcrumbList — Shows page path in Google results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://gelaberthomes.es/" },
              { "@type": "ListItem", "position": 2, "name": "Propiedades", "item": "https://gelaberthomes.es/propiedades/" },
              { "@type": "ListItem", "position": 3, "name": translatedTitle, "item": propertyUrl }
            ]
          })}
        </script>
      </Helmet>
      {/* Breadcrumb */}
      <div className="w-full px-6 md:px-14 py-4 border-b border-[#1F1F1F] bg-[#0A0A0A]">
        <div className="flex items-center gap-2 font-primary text-xs text-[#666666]">
          <Link to={i18n.language.startsWith('en') ? "/en" : "/"} className="hover:text-[#FAF8F5] transition-colors">{t('nav.home')}</Link>
          <span>›</span>
          <Link to={i18n.language.startsWith('en') ? "/en/propiedades" : "/propiedades"} className="hover:text-[#FAF8F5] transition-colors">{t('nav.properties')}</Link>
          <span>›</span>
          <span className="text-[#C9A962] truncate max-w-64">{translatedTitle}</span>
        </div>
      </div>

      {/* Media Tabs */}
      {((property.video_url || (property.videos && property.videos.length > 0)) || property.floor_plan || (property.latitude && property.longitude)) && (
        <div id="media-tabs" className="w-full px-6 md:px-14 pt-6 flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            onClick={() => setActiveTab('fotos')} 
            className={`flex items-center gap-2 font-primary text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'fotos' ? 'border-[#C9A962] text-[#C9A962]' : 'border-transparent text-[#888888] hover:text-[#FAF8F5]'}`}
          >
            <Maximize className="w-4 h-4" /> {t('property.labels.features.photos')}
          </button>
          {(property.video_url || (property.videos && property.videos.length > 0)) && (
            <button 
              onClick={() => setActiveTab('video')} 
              className={`flex items-center gap-2 font-primary text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'video' ? 'border-[#C9A962] text-[#C9A962]' : 'border-transparent text-[#888888] hover:text-[#FAF8F5]'}`}
            >
              <Play className="w-4 h-4" /> {t('property.labels.features.video')}
            </button>
          )}
          {property.floor_plan && (
            <button 
              onClick={() => setActiveTab('plano')} 
              className={`flex items-center gap-2 font-primary text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'plano' ? 'border-[#C9A962] text-[#C9A962]' : 'border-transparent text-[#888888] hover:text-[#FAF8F5]'}`}
            >
              <MapIcon className="w-4 h-4" /> {t('property.labels.features.floor_plan')}
            </button>
          )}
          {property.latitude && property.longitude && (
            <button 
              onClick={() => setActiveTab('ubicacion')} 
              className={`flex items-center gap-2 font-primary text-sm uppercase tracking-wider pb-2 border-b-2 transition-colors flex-shrink-0 ${activeTab === 'ubicacion' ? 'border-[#C9A962] text-[#C9A962]' : 'border-transparent text-[#888888] hover:text-[#FAF8F5]'}`}
            >
              <MapPin className="w-4 h-4" /> {t('property.labels.features.location')}
            </button>
          )}
        </div>
      )}

      {/* Media Content */}
      <section className="w-full px-6 md:px-14 py-8">
        {activeTab === 'fotos' && (
          <div className="flex flex-col gap-6">
            {(property.is_room_rental || property.property_type === 'habitacion') && (
              <h3 className="font-secondary text-xl text-[#C9A962] flex items-center gap-2">
                <Compass className="w-5 h-5" />
                ZONAS COMUNES
              </h3>
            )}
            
            <div className="flex flex-col md:flex-row gap-3">
              {/* Main image */}
            <div
              className="flex-1 md:w-2/3 h-64 md:h-[450px] overflow-hidden border border-[#1F1F1F] relative cursor-zoom-in group"
              onClick={() => generalImages.length > 0 && openLightbox(generalImages, activeImg)}
            >
            {generalImages.length > 0 ? (
              <>
                <PremiumImage 
                  src={generalImages[activeImg]} 
                  alt={translatedTitle} 
                  className="transition-transform duration-500 group-hover:scale-105" 
                  wrapperClassName="w-full h-full"
                />
                
                {/* Watermark Overlay */}
                {property.commercial_status && property.commercial_status !== 'disponible' && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden select-none">
                    <div className={cn(
                      "transform -rotate-12 scale-150 md:scale-[2] opacity-25 mix-blend-overlay",
                      property.commercial_status === 'reservado' && "text-orange-500",
                      property.commercial_status === 'alquilado' && "text-purple-500",
                      property.commercial_status === 'vendido' && "text-red-500",
                      property.commercial_status === 'traspasado' && "text-blue-500",
                    )}>
                      <div className="border-[8px] border-current px-8 py-3 rounded-sm flex items-center justify-center">
                        <span className="font-secondary text-5xl md:text-7xl font-black uppercase tracking-tighter text-center leading-none">
                          {t(COMMERCIAL_STATUS_LABELS[property.commercial_status])}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Maximize className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center font-primary text-[#444444]">{t('common.no_image')}</div>
            )}
          </div>
          {/* Thumbnails */}
          {generalImages.length > 1 && (
            <div className="flex md:flex-col gap-2 md:w-1/3 overflow-x-auto md:overflow-y-auto md:max-h-[450px]">
              {generalImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => { setActiveImg(i); openLightbox(generalImages, i); }} 
                  className={`w-20 md:w-full h-20 md:h-28 flex-shrink-0 overflow-hidden border ${i === activeImg ? 'border-[#C9A962]' : 'border-[#1F1F1F] hover:border-[#888888]'} transition-colors cursor-zoom-in relative`}
                >
                  <PremiumImage src={img} alt={`${i}`} wrapperClassName="w-full h-full" />
                </button>
              ))}
            </div>
          )}
          </div>
          </div>
        )}

        {/* Video Player */}
        {activeTab === 'video' && allVideos.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className={cn(
              "w-full border border-[#1F1F1F] bg-[#0A0A0A] flex items-center justify-center overflow-hidden relative group",
              "aspect-[9/16] md:aspect-video md:h-[500px] max-h-[85vh] md:max-h-[80vh]"
            )}>
              {(() => {
                const currentVideo = allVideos[activeVideoIndex]?.url || '';
                
                if (!currentVideo) return <div className="text-[#444444] font-primary">No hay vídeo disponible</div>;

                if (currentVideo.includes('youtube.com') || currentVideo.includes('youtu.be')) {
                  return (
                    <iframe 
                      src={currentVideo.replace('watch?v=', 'embed/').split('&')[0].replace('youtu.be/', 'youtube.com/embed/')} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title="Property Video"
                      frameBorder="0"
                    />
                  );
                } else if (currentVideo.includes('vimeo.com')) {
                  return (
                    <iframe 
                      src={`https://player.vimeo.com/video/${currentVideo.split('/')[3]}`} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title="Property Video"
                      frameBorder="0"
                    />
                  );
                } else {
                  return <video src={currentVideo} key={currentVideo} controls className="w-full h-full bg-black outline-none object-contain" />;
                }
              })()}
            </div>
            
            {/* Video Selector if multiple */}
            {allVideos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {allVideos.map((vid, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVideoIndex(idx)}
                    className={cn(
                      "px-4 py-2 text-[10px] font-primary border transition-all uppercase tracking-widest font-bold h-10 flex items-center justify-center min-w-[120px]",
                      activeVideoIndex === idx 
                        ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962] shadow-[0_0_15px_rgba(201,169,98,0.2)]' 
                        : 'bg-[#0A0A0A] text-[#888888] border-[#1F1F1F] hover:border-[#C9A962] hover:text-[#FAF8F5]'
                    )}
                  >
                    {vid.title || `VÍDEO ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floor Plan */}
        {activeTab === 'plano' && property.floor_plan && (
          <div className="w-full border border-[#1F1F1F] bg-[#161616] p-4 flex items-center justify-center min-h-[400px]">
            {property.floor_plan.toLowerCase().endsWith('.pdf') ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <MapIcon className="w-16 h-16 text-[#C9A962]" />
                <p className="font-primary text-[#FAF8F5]">{t('property.labels.features.floor_plan_is_pdf')}</p>
                <a href={property.floor_plan} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold uppercase text-sm hover:bg-[#D4B673] transition-colors">
                  {t('property.labels.features.open_pdf')}
                </a>
              </div>
            ) : (
              <a href={property.floor_plan} target="_blank" rel="noopener noreferrer" className="block w-full h-full flex items-center justify-center cursor-zoom-in" title="Ver plano original">
                <img src={property.floor_plan} alt="Plano de la propiedad" className="max-w-full max-h-[70vh] object-contain" />
              </a>
            )}
          </div>
        )}

        {/* Ubicación Map */}
        {activeTab === 'ubicacion' && property.latitude && property.longitude && (
          <div className="w-full h-64 md:h-[500px]">
            <PropertyMap 
              lat={Number(property.latitude)} 
              lng={Number(property.longitude)} 
              address={property.address || undefined}
            />
          </div>
        )}
      </section>

      {/* LIGHTBOX */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIdx}
        slides={lightboxSlides}
        plugins={[Thumbnails, Zoom]}
      />

      {/* Content + Sidebar */}
      <section className="w-full px-6 md:px-14 flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Property Header */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-col gap-1">
                  {property.operation === 'alquiler' && (
                    <div className="px-3 py-1 bg-[#4ADE80] text-[#0A0A0A] font-primary text-[10px] font-black uppercase tracking-wider shadow-lg rounded-sm inline-block self-start">
                      {property.is_room_rental
                        ? t('property.labels.features.room_rental') 
                        : `${t('property.labels.operation.alquiler')} ${t(PROPERTY_TYPE_LABELS[property.property_type] || '').toLowerCase()}`}
                    </div>
                  )}
                  {property.operation !== 'alquiler' && (
                    <div className={cn(
                      "px-3 py-1 font-primary text-[10px] font-black tracking-[0.08em] uppercase border border-white/5 inline-block self-start",
                      property.operation === 'venta' ? "bg-[#C9A962] text-[#0A0A0A]" : "bg-[#60A5FA] text-[#0A0A0A]"
                    )}>
                      {t(OPERATION_LABELS[property.operation])}
                    </div>
                  )}
                </div>

                {(new Date().getTime() - new Date(property.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
                  <div className="px-3 py-1 bg-[#FAF8F5] text-[#0A0A0A] font-primary text-[10px] font-black uppercase tracking-wider shadow-lg rounded-sm border border-white/20">
                    {t('common.new') || 'NUEVO'}
                  </div>
                )}
                
                {property.operation === 'alquiler' && property.rent_type && !property.is_room_rental && (
                  <div className="px-3 py-1 glass-deep border border-[#C9A962]/40 text-[#C9A962] font-primary text-[10px] font-bold uppercase">
                    {t(RENT_TYPE_LABELS[property.rent_type])}
                  </div>
                )}

                <div className="px-3 py-1 glass-deep border border-white/10 text-[#888888] font-primary text-[10px] font-bold uppercase">
                  {t(PROPERTY_TYPE_LABELS[property.property_type])}
                </div>

                {property.reference && (
                  <PropertyReference 
                    reference={property.reference} 
                    variant="outline" 
                    className="h-6 text-[10px] bg-white/5" 
                  />
                )}

                {property.commercial_status && (
                  <div className={cn(
                    "px-3 py-1 font-primary text-[10px] font-bold uppercase flex items-center gap-1.5 glass-deep border",
                    property.commercial_status === 'disponible' && "bg-green-400/5 text-green-400 border-green-400/20",
                    property.commercial_status === 'reservado' && "bg-orange-400/5 text-orange-400 border-orange-400/20",
                    property.commercial_status === 'alquilado' && "bg-purple-400/5 text-purple-400 border-purple-400/20",
                    property.commercial_status === 'vendido' && "bg-red-400/5 text-red-400 border-red-400/20",
                    property.commercial_status === 'traspasado' && "bg-blue-400/5 text-blue-400 border-blue-400/20",
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      property.commercial_status === 'disponible' ? "bg-green-400" : "bg-current animate-pulse"
                    )} />
                    {t(COMMERCIAL_STATUS_LABELS[property.commercial_status])}
                  </div>
                )}
              </div>
              <h1 className="font-secondary text-2xl md:text-5xl text-[#FAF8F5] leading-tight">{translatedTitle}</h1>
              {(property.zone || property.city || property.urbanization) && (
                <div className="flex flex-col gap-1 text-[#888888]">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-primary text-sm">
                      {[property.urbanization, property.zone, property.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  {property.block_staircase && (
                    <span className="font-primary text-[10px] uppercase tracking-wider ml-5 text-[#666666]">
                      {t('admin.form.fields.block')}: {property.block_staircase}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 text-right">
              {property.price && (
                <p className="font-secondary text-4xl text-[#C9A962]">
                  €{property.price.toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-ES')}
                  {property.operation === 'alquiler' && <span className="font-primary text-lg text-[#888888] ml-1">{t('property.labels.features.price_per_month')}</span>}
                </p>
              )}
              {property.operation === 'venta' && (property.community_fees || property.ibi) && (
                <div className="flex flex-col items-end gap-1 mt-1 font-primary text-xs text-[#666666]">
                  {property.community_fees && <span>{t('property.labels.features.community_fees')}: {property.community_fees}€/{t('common.month')}</span>}
                  {property.ibi && <span>{t('property.labels.features.ibi')}: {property.ibi}€/{t('common.year')}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Key features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.area_m2 && (
              <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 p-5 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962] transition-colors group">
                <Maximize className="w-5 h-5 text-[#C9A962] transform group-hover:scale-110 transition-transform" />
                <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.labels.features.area')}</p>
                <p className="font-primary text-[#FAF8F5] font-bold text-sm">{property.area_m2} m²</p>
              </motion.div>
            )}
            {property.bedrooms > 0 && (
              <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 p-5 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962] transition-colors group">
                <Bed className="w-5 h-5 text-[#C9A962] transform group-hover:scale-110 transition-transform" />
                <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.labels.features.bedrooms')}</p>
                <p className="font-primary text-[#FAF8F5] font-bold text-sm">{property.bedrooms}</p>
              </motion.div>
            )}
            {property.bathrooms > 0 && (
              <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 p-5 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962] transition-colors group">
                <Bath className="w-5 h-5 text-[#C9A962] transform group-hover:scale-110 transition-transform" />
                <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.labels.features.bathrooms')}</p>
                <p className="font-primary text-[#FAF8F5] font-bold text-sm">{property.bathrooms}</p>
              </motion.div>
            )}
            {property.floor && (
              <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 p-5 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962] transition-colors group">
                <Layers className="w-5 h-5 text-[#C9A962] transform group-hover:scale-110 transition-transform" />
                <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.labels.features.floor')}</p>
                <p className="font-primary text-[#FAF8F5] font-bold text-sm">
                  {property.floor}{(!String(property.floor).includes('º') && !String(property.floor).includes('ª') && /^\d+$/.test(String(property.floor))) ? 'º' : ''}
                </p>
              </motion.div>
            )}
            {property.orientation && property.orientation.length > 0 && (
              <motion.div whileHover={{ y: -5 }} className="flex flex-col items-center gap-2 p-5 bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962] transition-colors group">
                <Compass className="w-5 h-5 text-[#C9A962] transform group-hover:scale-110 transition-transform" />
                <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">{t('property.form.fields.orientation')}</p>
                <p className="font-primary text-[#FAF8F5] font-bold text-[10px] uppercase">
                  {property.orientation.map(o => t(`admin.form.fields.orientation_${o.toLowerCase().charAt(0)}`)).join(' · ')}
                </p>
              </motion.div>
            )}
          </div>

          {/* Room distribution (If room rental or independent room) */}
          {(property.is_room_rental || property.property_type === 'habitacion') && property.rooms && property.rooms.length > 0 && (
            <div className="flex flex-col gap-6 pt-6 border-t border-[#1F1F1F]">
              <h2 className="font-secondary text-2xl text-[#FAF8F5]">{t('property.labels.features.room_distribution', { defaultValue: 'Distribución por Habitaciones' })}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.rooms.map((room: PropertyRoom) => (
                  <div key={room.id} className="flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm overflow-hidden group hover:border-[#C9A962] transition-colors">
                    {room.images && room.images.length > 0 ? (
                      <div 
                        className="w-full h-40 overflow-hidden cursor-pointer relative"
                        onClick={() => {
                          if (room.images && room.images.length > 0) {
                            openLightbox(room.images, 0);
                          }
                        }}
                      >
                        <PremiumImage src={room.images[0]} alt={room.name} wrapperClassName="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        {room.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-[8px] text-white uppercase font-bold tracking-tighter">
                            + {room.images.length - 1} FOTOS
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-[#161616] flex items-center justify-center font-primary text-[10px] text-[#444444] uppercase tracking-widest">{t('common.no_image')}</div>
                    )}
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-tight">{room.name}</h4>
                        {room.price !== undefined && room.price !== null && (
                          <span className="font-primary text-[#C9A962] font-bold text-sm">
                            {room.price}€
                            <span className="text-[10px] text-[#888888] font-normal ml-0.5">/{t('common.month')}</span>
                          </span>
                        )}
                      </div>
                      {room.video?.url && (
                        <button 
                          onClick={() => {
                            const idx = allVideos.findIndex(v => v.url === room.video?.url);
                            if (idx !== -1) {
                              setActiveTab('video');
                              setActiveVideoIndex(idx);
                              const target = document.getElementById('media-tabs');
                              if (target) {
                                target.scrollIntoView({ behavior: 'smooth' });
                              } else {
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }
                            }
                          }}
                          className="flex items-center gap-2 text-[10px] text-[#C9A962] font-bold uppercase tracking-widest hover:text-[#FAF8F5] transition-colors mt-1"
                        >
                          <Play className="w-3 h-3" />
                          VER TOUR VÍDEO
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {translatedDescription && (
            <div className="flex flex-col gap-4 pt-4 border-t border-[#1F1F1F]">
              <h2 className="font-secondary text-2xl text-[#FAF8F5]">{t('property.labels.features.description')}</h2>
              {/<[a-z][\s\S]*>/i.test(translatedDescription) ? (
                <div 
                  className="font-primary text-[#888888] text-base leading-relaxed rich-text"
                  dangerouslySetInnerHTML={{ __html: translatedDescription }}
                />
              ) : (
                <div className="font-primary text-[#888888] text-base leading-relaxed whitespace-pre-wrap">
                  {translatedDescription}
                </div>
              )}
            </div>
          )}


          {/* Highlights */}
          {autoHighlights.length > 0 && (
            <div className="flex flex-col gap-4 pt-4 border-t border-[#1F1F1F]">
              <h2 className="font-secondary text-2xl text-[#FAF8F5]">{t('property.labels.features.highlights')}</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {autoHighlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 font-primary text-sm text-[#888888]">
                    <span className="text-[#C9A962] mt-0.5">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Features & Extras unified */}
          <div className="flex flex-col gap-6 pt-6 border-t border-[#1F1F1F]">
            <h2 className="font-secondary text-2xl text-[#FAF8F5]">{t('property.labels.features.features_and_extras')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: t('property.labels.features.has_elevator'), value: property.has_elevator },
                { label: t('property.labels.features.is_furnished'), value: property.is_furnished },
                { label: t('property.labels.features.has_terrace'), value: property.has_terrace },
                { label: t('property.labels.features.has_balcony'), value: property.has_balcony },
                { label: t('property.labels.features.has_parking'), value: property.has_parking },
                { label: t('property.labels.features.has_storage'), value: property.has_storage },
                { label: t('property.labels.features.has_pool'), value: property.has_pool },
                { label: t('property.labels.features.heating'), value: property.heating },
                { label: t('property.labels.features.air_conditioning'), value: property.air_conditioning },
                { label: t('property.labels.features.is_exterior'), value: property.is_exterior },
                { label: t('property.labels.features.garden'), value: property.garden },
                { label: t('property.labels.features.has_patio'), value: property.has_patio },
                { label: t('property.labels.features.pets_allowed'), value: property.pets_allowed },
                { label: t('property.labels.features.sea_views'), value: property.sea_views },
                { label: t('property.labels.features.has_wardrobes'), value: property.has_wardrobes },
                { label: t('property.labels.features.has_fireplace'), value: property.has_fireplace },
              ].filter(f => f.value === true).map(feat => (
                <div key={feat.label} className="flex items-center gap-3 p-3 bg-[#0A0A0A] border border-[#1F1F1F]">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="font-primary text-sm text-green-400 font-medium">{feat.label}</span>
                </div>
              ))}
            </div>
            {(property.property_condition || property.conservation_state || property.availability) && (
              <div className="flex flex-col gap-2 p-4 bg-[#0A0A0A]/50 border-l-2 border-[#C9A962]">
                {(property.conservation_state || property.property_condition) && (
                  <div className="flex justify-between items-center text-sm font-primary">
                    <span className="text-[#666666] uppercase tracking-wider text-xs">{t('property.labels.features.condition')}</span>
                    <span className="text-[#FAF8F5] font-bold">
                      {property.conservation_state ? (
                        t(`property_conditions.${property.conservation_state}`, { defaultValue: property.conservation_state })
                      ) : (
                        autoCondition
                      )}
                    </span>
                  </div>
                )}
                {property.availability && (
                  <div className="flex justify-between items-center text-sm font-primary">
                    <span className="text-[#666666] uppercase tracking-wider text-xs">{t('property.labels.features.availability')}</span>
                    <span className="text-[#FAF8F5] font-bold">{autoAvailability}</span>
                  </div>
                )}
              </div>
            )}

            {/* Eficiencia Energética */}
            {(property.energy_rating || property.emissions_rating) && (
              <div className="flex flex-col gap-6 pt-6 border-t border-[#1F1F1F]">
                <h2 className="font-secondary text-2xl text-[#FAF8F5]">{t('admin.form.fields.energy_efficiency')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.energy_rating && (
                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-[#1F1F1F]">
                      <div className="flex flex-col">
                        <span className="text-[#666666] text-[10px] uppercase tracking-widest mb-1">{t('admin.form.fields.energy_rating')}</span>
                        {property.energy_consumption && <span className="text-[#888888] text-xs">{property.energy_consumption} kWh/m² {t('common.year')}</span>}
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center bg-[#C9A962] text-[#0A0A0A] font-bold text-xl rounded-sm">
                        {property.energy_rating}
                      </div>
                    </div>
                  )}
                  {property.emissions_rating && (
                    <div className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-[#1F1F1F]">
                      <div className="flex flex-col">
                        <span className="text-[#666666] text-[10px] uppercase tracking-widest mb-1">{t('admin.form.fields.emissions_rating')}</span>
                        {property.emissions_value && <span className="text-[#888888] text-xs">{property.emissions_value} kg CO₂/m² {t('common.year')}</span>}
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center bg-[#444444] text-white font-bold text-xl rounded-sm">
                        {property.emissions_rating}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>



          {/* Tags */}
          {(property.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-[#1F1F1F]">
              {(property.tags ?? []).map(tag => (
                <span key={tag} className="px-3 py-1 border border-[#1F1F1F] font-primary text-xs text-[#C9A962]">
                  {t(`tags.${tag}`, tag)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 shrink-0 flex flex-col gap-4" id="contact-form">
          {/* WhatsApp */}
          <div className="flex flex-col gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#1DB954] transition-colors"
            >
              <WhatsAppIcon />
              {t('property.labels.features.whatsapp')}
            </a>
            <p className="text-[11px] text-[#888888] font-primary leading-relaxed text-center">
              <Trans 
                i18nKey="property.labels.features.accept_privacy_short"
                components={[<Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/privacidad`} className="text-[#C9A962] hover:underline" />]}
              />
            </p>
          </div>

          {/* Contact form */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-4">
            <h3 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">{t('property.labels.features.inquiry')}</h3>
            {formSent ? (
              <div className="py-6 text-center">
                <p className="font-primary text-green-400 font-bold mb-2">{t('property.labels.features.success')}</p>
                <p className="font-primary text-[#888888] text-sm">{t('property.labels.features.success_detail')}</p>
                <button 
                  onClick={() => setFormSent(false)} 
                  className="mt-4 text-[#C9A962] text-xs uppercase tracking-widest hover:underline"
                >
                  {t('property.labels.features.send_another')}
                </button>
              </div>
            ) : (
              <form 
                onSubmit={handleFormSubmit} 
                className="flex flex-col gap-3"
                name="property-inquiry"
                data-netlify="true"
              >
                <input type="hidden" name="form-name" value="property-inquiry" />
                <input type="hidden" name="property_id" value={property.id} />
                <input type="hidden" name="property_reference" value={property.reference || ''} />
                
                <input 
                  type="text" 
                  name="name"
                  placeholder={t('property.labels.features.name')} 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
                  className="h-10 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]" 
                />
                <input 
                  type="email" 
                  name="email"
                  placeholder={t('property.labels.features.email')} 
                  required 
                  value={formData.email} 
                  onChange={e => setFormData(p => ({...p, email: e.target.value}))} 
                  className="h-10 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]" 
                />
                <input 
                  type="tel" 
                  name="phone"
                  placeholder={t('property.labels.features.phone')} 
                  value={formData.phone} 
                  onChange={e => setFormData(p => ({...p, phone: e.target.value}))} 
                  className="h-10 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]" 
                />
                <textarea 
                  name="message"
                  placeholder={t('property.labels.features.message')} 
                  rows={4} 
                  value={formData.message} 
                  onChange={e => setFormData(p => ({...p, message: e.target.value}))} 
                  className="bg-[#161616] border border-[#1F1F1F] px-3 py-2.5 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444] resize-none" 
                />
                
                {/* Legal Disclaimer Block */}
                <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-sm">
                  <p className="text-[10px] text-[#888888] leading-relaxed font-primary uppercase tracking-wider">
                    {property.operation === 'alquiler' 
                      ? t('forms.legal_disclaimers.rentals') 
                      : t('forms.legal_disclaimers.general')
                    }
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="property_privacy_accepted"
                      name="privacy_accepted"
                      required
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="mt-1 w-3.5 h-3.5 accent-[#C9A962] bg-[#161616] border-[#1F1F1F] cursor-pointer"
                    />
                    <label htmlFor="property_privacy_accepted" className="text-[#888888] text-[11px] font-primary leading-tight cursor-pointer">
                      <Trans 
                        i18nKey="forms.privacy_accept"
                        components={[
                          <Link 
                            key="privacy-link"
                            to={`${i18n.language.startsWith('en') ? '/en' : ''}/privacidad`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#C9A962] hover:underline" 
                          />
                        ]}
                      />
                    </label>
                  </div>

                  {property.operation === 'alquiler' && (
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="property_solvency_accepted"
                        name="solvency_accepted"
                        required
                        checked={solvencyAccepted}
                        onChange={(e) => setSolvencyAccepted(e.target.checked)}
                        className="mt-1 w-3.5 h-3.5 accent-[#C9A962] bg-[#161616] border-[#1F1F1F] cursor-pointer"
                      />
                      <label htmlFor="property_solvency_accepted" className="text-[#888888] text-[11px] font-primary leading-tight cursor-pointer">
                        {t('forms.solvency_accept')}
                      </label>
                    </div>
                  )}
                </div>

                {formError && (
                  <p className="text-red-500 text-xs font-primary">{formError}</p>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting || !privacyAccepted || (property.operation === 'alquiler' && !solvencyAccepted)}
                  className={`h-10 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase transition-colors ${isSubmitting || !privacyAccepted || (property.operation === 'alquiler' && !solvencyAccepted) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#D4B673]'}`}
                >
                  {isSubmitting ? t('property.labels.features.sending') : t('property.labels.features.send')}
                </button>
              </form>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-[#1F1F1F] text-[#666666]">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-primary text-xs">+34 611 89 88 27</span>
            </div>
            <div className="flex items-center gap-2 text-[#666666]">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-primary text-xs">info@gelaberthomes.es</span>
            </div>

          </div>

          {/* Share Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="font-primary text-[10px] text-[#666666] uppercase tracking-[0.2em] font-bold">{t('common.share', 'Compartir')}</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 border font-primary text-[11px] uppercase tracking-wider font-bold transition-all",
                  linkCopied
                    ? "border-green-400 text-green-400 bg-green-400/10"
                    : "border-[#1F1F1F] text-[#888888] hover:border-[#C9A962] hover:text-[#C9A962]"
                )}
              >
                {linkCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {linkCopied ? t('common.copied', '¡Copiado!') : t('common.copy_link', 'Copiar enlace')}
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent(seoTitle)}&body=${encodeURIComponent(`${seoTitle}\n\n${featureSnippet}\n\n${propertyUrl}`)}`}
                className="px-3 py-2.5 border border-[#1F1F1F] text-[#888888] hover:border-[#C9A962] hover:text-[#C9A962] transition-all flex items-center justify-center"
                title={t('common.share_email', 'Compartir por email')}
              >
                <Send className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MOBILE STICKY CTA BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass-deep border-t border-white/10 px-4 py-3 flex items-center gap-3">
          {/* Price */}
          <div className="flex flex-col min-w-0">
            {property.price ? (
              <span className="font-secondary text-[#C9A962] text-lg leading-none">
                €{property.price.toLocaleString('es-ES')}
              </span>
            ) : null}
            {property.operation === 'alquiler' && (
              <span className="font-primary text-white/40 text-[10px]">/mes</span>
            )}
          </div>
          {/* WhatsApp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-[#25D366] text-white font-primary font-bold text-[11px] uppercase tracking-wider text-center rounded-sm hover:bg-[#1DB954] transition-colors"
          >
            WhatsApp
          </a>
          {/* Scroll to form */}
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex-1 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-[11px] uppercase tracking-wider text-center rounded-sm hover:bg-[#D4B673] transition-colors"
          >
            {t('property.labels.features.inquiry') || 'Solicitar info'}
          </button>
        </div>
      </div>

      {/* Map Section */}
      {property.latitude && property.longitude && (
        <section className="w-full px-6 md:px-14 py-12 border-t border-[#1F1F1F]">
          <h2 className="font-secondary text-2xl text-[#FAF8F5] mb-6">{t('property.labels.features.location')}</h2>
          <div className="w-full h-80 md:h-[450px] border border-[#1F1F1F] overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all">
            <PropertyMap 
              lat={Number(property.latitude)} 
              lng={Number(property.longitude)} 
              address={property.address || undefined}
            />
          </div>
          <p className="mt-3 font-primary text-[10px] text-[#666666] italic tracking-wide">
            * {t('property.labels.features.map_hint_public')}
          </p>
        </section>
      )}

      {/* Similar Properties */}
      {similarProps.length > 0 && (
        <section className="w-full px-6 md:px-14 py-16 mt-12 bg-[#0A0A0A] border-t border-[#1F1F1F]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-secondary text-3xl text-[#FAF8F5]">{t('property.labels.features.similar')}</h2>
            <Link to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades`} className="font-primary text-sm text-[#C9A962] hover:underline">{t('property.labels.features.view_more')} →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProps.map((p, index) => (
              <PropertyCard
                index={index}
                key={p.id}
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
                videoUrl={p.video_url}
                floorPlanUrl={p.floor_plan}
                description={p.short_description ?? undefined}
                description_en={p.short_description_en ?? undefined}
              />
            ))}
          </div>
        </section>
      )}

      <div className="px-6 md:px-14 pt-8">
          <Link to={i18n.language.startsWith('en') ? "/en/propiedades" : "/propiedades"} className="flex items-center gap-2 font-primary text-sm text-[#888888] hover:text-[#FAF8F5] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('property.labels.features.back_to_catalog')}
          </Link>
      </div>
    </div>
  );
};
