import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types/property';
import { Link } from 'react-router-dom';

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

interface PropertiesMapProps {
  properties: Property[];
}

export const PropertiesMap = ({ properties }: PropertiesMapProps) => {
  const { t, i18n } = useTranslation();

  const validProperties = properties.filter(p => p.latitude && p.longitude);

  if (validProperties.length === 0) {
    return (
      <div className="w-full h-[600px] bg-[#0A0A0A] border border-white/5 flex items-center justify-center rounded-sm">
        <p className="font-primary text-white/30 text-sm uppercase tracking-widest">{t('map.no_properties_with_location')}</p>
      </div>
    );
  }

  const center: [number, number] = [validProperties[0].latitude!, validProperties[0].longitude!];

  return (
    <div className="w-full h-[600px] border border-white/10 rounded-sm overflow-hidden z-10">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#050505' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map(p => (
          <Marker 
            key={p.id} 
            position={[p.latitude!, p.longitude!]}
            icon={GoldenIcon}
          >
            <Popup className="premium-popup">
              <div className="flex flex-col gap-2 p-1 min-w-[200px]">
                {p.main_image && (
                  <img src={p.main_image} alt={p.title} className="w-full h-24 object-cover rounded-sm" />
                )}
                <div>
                  <h4 className="font-secondary text-sm text-[#0A0A0A] mb-1 line-clamp-1">{p.title}</h4>
                  <p className="font-primary text-xs font-bold text-[#C9A962]">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.price || 0)}
                  </p>
                </div>
                <Link 
                  to={`${i18n.language.startsWith('en') ? '/en' : ''}/propiedades/${p.reference || p.slug || p.id}`}
                  className="text-center py-2 bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm mt-1"
                >
                  {t('property.labels.features.view_more')}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
