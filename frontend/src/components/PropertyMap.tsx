import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Estilo oscuro premium para el mapa (JSON generado para Google Maps)
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

interface PropertyMapProps {
  lat: number;
  lng: number;
  address?: string;
  editable?: boolean;
  onChange?: (lat: number, lng: number) => void;
}

export const PropertyMap = ({ lat, lng, address, editable, onChange }: PropertyMapProps) => {
  const { t } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(google?.maps?.MapTypeId?.ROADMAP || 'roadmap' as any);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places']
  });

  const hasCoords = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const center = hasCoords ? { lat, lng } : { lat: 36.7213, lng: -4.4214 }; // Málaga centro

  const onLoad = useCallback(() => {
    // onLoad logic if needed
  }, []);

  const onUnmount = useCallback(() => {
    // onUnmount logic if needed
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (editable && onChange && e.latLng) {
      onChange(e.latLng.lat(), e.latLng.lng());
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full min-h-[300px] bg-[#0A0A0A] flex items-center justify-center border border-white/5">
        <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasCoords && !editable) {
    return (
      <div className="w-full h-full min-h-[300px] bg-[#161616] flex items-center justify-center border border-[#1F1F1F]">
        <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">
          {t('map.coordinates_required')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] relative group">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={hasCoords ? 17 : 13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          styles: mapType === 'roadmap' ? darkModeStyles : [],
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          mapTypeId: mapType,
          gestureHandling: editable ? 'greedy' : 'cooperative'
        }}
      >
        {hasCoords && (
          <Marker 
            position={{ lat, lng }}
            onClick={() => setShowPopup(true)}
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
        )}

        {showPopup && hasCoords && (
          <InfoWindow
            position={{ lat, lng }}
            onCloseClick={() => setShowPopup(false)}
          >
            <div className="p-1 min-w-[100px]">
              <p className="font-primary text-xs text-gray-900 leading-tight">
                {address || t('map.default_popup')}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Botón rápido para cambiar a Satélite si no se usa el control nativo */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={() => setMapType('roadmap' as any)}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all border ${mapType === 'roadmap' ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]' : 'bg-[#0A0A0A]/80 text-white border-white/20 hover:border-[#C9A962]'}`}
        >
          Mapa
        </button>
        <button 
          onClick={() => setMapType('satellite' as any)}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-all border ${mapType === 'satellite' ? 'bg-[#C9A962] text-[#0A0A0A] border-[#C9A962]' : 'bg-[#0A0A0A]/80 text-white border-white/20 hover:border-[#C9A962]'}`}
        >
          Satélite
        </button>
      </div>
    </div>
  );
};
