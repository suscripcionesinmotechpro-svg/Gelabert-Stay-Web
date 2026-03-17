import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const GoldenIcon = L.divIcon({
  html: `
    <svg width="30" height="40" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="#C9A962"/>
      <circle cx="15" cy="15" r="6" fill="#0A0A0A"/>
      <path d="M15 42L14 41C14 41 0 26.25 0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 26.25 16 41 16 41L15 42Z" stroke="#FAF8F5" stroke-opacity="0.2" stroke-width="0.5"/>
    </svg>
  `,
  className: '',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -40],
});

L.Marker.prototype.options.icon = GoldenIcon;

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
