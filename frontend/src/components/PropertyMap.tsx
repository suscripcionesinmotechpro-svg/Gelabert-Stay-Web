import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Fix for default marker icon in Leaflet + React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  lat: number;
  lng: number;
  address?: string;
}

// Componente para actualizar la vista del mapa cuando cambian las coordenadas
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export const PropertyMap = ({ lat, lng, address }: PropertyMapProps) => {
  const { t } = useTranslation();

  // No renderizar si las coordenadas no son válidas
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return (
      <div className="w-full h-full min-h-[300px] bg-[#161616] flex items-center justify-center border border-[#1F1F1F]">
        <p className="font-primary text-xs text-[#666666] uppercase tracking-wider">
          {t('map.coordinates_required')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] border border-[#1F1F1F] z-10">
      <MapContainer 
        center={[lat, lng]} 
        zoom={16} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={[lat, lng]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div className="font-primary text-sm">
              {address || t('map.default_popup')}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};
