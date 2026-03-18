import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types/property';

interface PropertyComparatorProps {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

interface FeatureRow {
  label: string;
  getValue: (p: Property) => string | number | boolean | null | undefined;
  format?: (v: string | number | boolean | null | undefined) => string;
  highlight?: boolean;
}

const formatPrice = (price: number | null | undefined) => {
  if (!price) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
};

export const PropertyComparator = ({ properties, onRemove, onClear }: PropertyComparatorProps) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  if (properties.length === 0) return null;

  const ROWS: FeatureRow[] = [
    { label: 'Precio', getValue: p => p.price ?? null, format: v => formatPrice(v as number) },
    { label: 'Tipo', getValue: p => p.property_type ?? '—' },
    { label: 'Operación', getValue: p => p.operation ?? '—' },
    { label: 'Ciudad', getValue: p => p.city ?? '—' },
    { label: 'Zona', getValue: p => p.zone ?? '—' },
    { label: 'm²', getValue: p => p.area_m2 ? `${p.area_m2} m²` : '—' },
    { label: 'Hab.', getValue: p => p.bedrooms ?? '—' },
    { label: 'Baños', getValue: p => p.bathrooms ?? '—' },
    { label: 'Planta', getValue: p => p.floor ?? '—' },
    { label: 'Estado', getValue: (p: Property) => p.property_condition ?? '—' },
    { label: 'Ascensor', getValue: p => p.has_elevator ?? null, format: v => v === true ? '✓' : '—' },
    { label: 'Terraza', getValue: p => p.has_terrace ?? null, format: v => v === true ? '✓' : '—' },
    { label: 'Parking', getValue: p => p.has_parking ?? null, format: v => v === true ? '✓' : '—' },
    { label: 'Piscina', getValue: p => p.has_pool ?? null, format: v => v === true ? '✓' : '—' },
    { label: 'A/C', getValue: p => p.air_conditioning ?? null, format: v => v === true ? '✓' : '—' },
    { label: 'Amueblado', getValue: p => p.is_furnished ?? null, format: v => v === true ? '✓' : '—' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#C9A962]/30 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-14 py-3 border-b border-white/5">
          <div className="flex items-center gap-4">
            <span className="font-primary text-[10px] text-[#C9A962] font-bold uppercase tracking-[0.25em]">
              Comparando {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
            </span>
            <button
              onClick={onClear}
              className="font-primary text-[10px] text-white/30 hover:text-white/60 uppercase tracking-[0.15em] transition-colors"
            >
              Limpiar todo
            </button>
          </div>
          <button onClick={onClear} className="text-white/30 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Property Cards Row */}
        <div className="px-6 md:px-14 py-4 overflow-x-auto">
          <div className="min-w-max">
            <div className="flex gap-4 mb-4">
              <div className="w-32 shrink-0" />
              {properties.map(p => (
                <div key={p.id} className="w-52 shrink-0 relative group">
                  <button
                    onClick={() => onRemove(p.id)}
                    className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {p.main_image && (
                    <img
                      src={p.main_image}
                      alt={p.title}
                      className="w-full h-28 object-cover rounded-sm border border-white/5"
                    />
                  )}
                  <p className="mt-2 font-primary text-white text-xs font-bold leading-tight truncate">
                    {isEn && p.title_en ? p.title_en : p.title}
                  </p>
                  <p className="font-primary text-[#C9A962] text-sm font-bold mt-1">
                    {formatPrice(p.price)}
                  </p>
                  <Link
                    to={`${isEn ? '/en' : ''}/propiedades/${p.reference || p.slug || p.id}`}
                    className="mt-2 flex items-center gap-1 font-primary text-[9px] text-white/40 hover:text-[#C9A962] uppercase tracking-widest transition-colors"
                  >
                    Ver ficha <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {ROWS.map((row, i) => {
              const values = properties.map(p => row.getValue(p));
              const allSame = values.every(v => String(v) === String(values[0]));
              return (
                <div
                  key={row.label}
                  className={`flex gap-4 py-2 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <div className="w-32 shrink-0 flex items-center">
                    <span className="font-primary text-[10px] text-white/30 uppercase tracking-[0.15em]">{row.label}</span>
                  </div>
                  {values.map((v, j) => (
                    <div key={j} className="w-52 shrink-0 flex items-center">
                      <span className={`font-primary text-xs ${allSame ? 'text-white/50' : 'text-white font-bold'}`}>
                        {row.format ? row.format(v) : (String(v) || '—')}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
