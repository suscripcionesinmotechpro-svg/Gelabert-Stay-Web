import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types/property';
import { Link } from 'react-router-dom';
import { getOptimizedImage } from '../utils/images';

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

interface PropertiesMapProps {
  properties: Property[];
}

import { memo } from 'react';

export const PropertiesMap = memo(({ properties }: PropertiesMapProps) => {
  const { t, i18n } = useTranslation();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapType, setMapType] = useState<string>('roadmap');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const validProperties = properties.filter(p => p.latitude && p.longitude);

  const center = validProperties.length > 0 
    ? { lat: validProperties[0].latitude!, lng: validProperties[0].longitude! }
    : { lat: 36.7213, lng: -4.4214 };

  if (!isLoaded) {
    return (
      <div className="w-full h-[600px] bg-[#0A0A0A] border border-white/5 flex items-center justify-center rounded-sm">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (validProperties.length === 0) {
    return (
      <div className="w-full h-[600px] bg-[#0A0A0A] border border-white/5 flex items-center justify-center rounded-sm">
        <p className="font-primary text-white/30 text-sm uppercase tracking-widest">{t('map.no_properties_with_location')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] border border-white/10 rounded-sm overflow-hidden z-10 relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        options={{
          styles: mapType === 'roadmap' ? darkModeStyles : [],
          mapTypeId: mapType,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true
        }}
      >
        {validProperties.map(p => (
          <Marker 
            key={p.id} 
            position={{ lat: p.latitude!, lng: p.longitude! }}
            onClick={() => setSelectedProperty(p)}
            icon={{
              path: "M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z",
              fillColor: "#C9A962",
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#FFFFFF",
              scale: 0.8,
              anchor: new google.maps.Point(15, 42),
            }}
          />
        ))}

        {selectedProperty && (
          <InfoWindow
            position={{ lat: selectedProperty.latitude!, lng: selectedProperty.longitude! }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="flex flex-col w-[260px] md:w-[300px] overflow-hidden rounded-sm -m-2">
              {/* Imagen en Alta Definición con Overlays */}
              <div className="relative w-full h-[180px] bg-gray-100">
                {selectedProperty.main_image ? (
                  <img 
                    src={getOptimizedImage(selectedProperty.main_image, { width: 800, height: 600, format: 'webp' })} 
                    alt={selectedProperty.title} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400">
                    <span className="text-xs uppercase tracking-widest font-bold">Sin imagen</span>
                  </div>
                )}
                
                {/* Badge Operación */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 border border-white/20 rounded-sm">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FAF8F5]">
                    {selectedProperty.operation}
                  </span>
                </div>

                {/* Gradiente Oscuro para Precio */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <p className="font-primary text-xl font-bold text-white drop-shadow-lg">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(selectedProperty.price || 0)}
                  </p>
                </div>
              </div>

              {/* Información y Acción */}
              <div className="flex flex-col gap-4 p-5 bg-white">
                <h4 className="font-secondary text-base text-gray-900 leading-snug line-clamp-2">
                  {selectedProperty.title}
                </h4>
                
                {/* Detalles (Habitaciones, Baños, Área) */}
                <div className="flex items-center gap-4 text-gray-500 font-primary text-[11px] uppercase tracking-wider border-b border-gray-100 pb-4">
                  {selectedProperty.bedrooms > 0 && (
                    <span className="flex items-center gap-1.5">
                      <b className="text-gray-900">{selectedProperty.bedrooms}</b> {t('property.labels.features.bedrooms')}
                    </span>
                  )}
                  {selectedProperty.bathrooms > 0 && (
                    <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                      <b className="text-gray-900">{selectedProperty.bathrooms}</b> {t('property.labels.features.bathrooms')}
                    </span>
                  )}
                  {selectedProperty.area_m2 && selectedProperty.area_m2 > 0 && (
                    <span className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                      <b className="text-gray-900">{selectedProperty.area_m2}</b> m²
                    </span>
                  )}
                </div>

                <Link 
                  to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${selectedProperty.reference || selectedProperty.slug || selectedProperty.id}`}
                  className="w-full text-center py-3 bg-[#0A0A0A] text-[#C9A962] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all duration-300 rounded-sm"
                >
                  {t('property.labels.features.view_more')}
                </Link>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Botones de control rápido */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={() => setMapType('roadmap' as any)}
          className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${mapType === 'roadmap' ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]' : 'bg-[#0A0A0A]/90 text-white border-white/20 hover:border-[#C9A962]'}`}
        >
          Mapa
        </button>
        <button 
          onClick={() => setMapType('satellite' as any)}
          className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border ${mapType === 'satellite' ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]' : 'bg-[#0A0A0A]/90 text-white border-white/20 hover:border-[#C9A962]'}`}
        >
          Satélite
        </button>
      </div>
    </div>
  );
});
