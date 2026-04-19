import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, GitCompare, CheckCircle2, Minus, Info, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types/property';
import { cn } from '../lib/utils';
import { PropertyReference } from './PropertyReference';

interface PropertyComparatorProps {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const formatPrice = (price: number | null | undefined, locale: string = 'es-ES') => {
  if (!price) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
};

interface FeatureRow {
  key: string;
  label: string;
  getValue: (p: Property) => any;
  format?: (v: any, p: Property) => React.ReactNode;
  isBetter?: (v1: any, v2: any) => boolean;
}

const safeJoin = (val: any, separator: string = ', ') => {
  if (Array.isArray(val)) return val.filter(Boolean).join(separator);
  if (typeof val === 'string') return val;
  return null;
};

export const PropertyComparator = ({ properties, onRemove, onClear }: PropertyComparatorProps) => {
  const { t, i18n } = useTranslation();
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const isEn = i18n.language.startsWith('en');

  if (properties.length === 0) return null;

  // 1 property hint
  if (properties.length === 1) {
    const p = properties[0];
    return (
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#C9A962]/40 rounded-full px-5 py-3 shadow-2xl"
      >
        <GitCompare className="w-4 h-4 text-[#C9A962] shrink-0" />
        <div className="flex items-center gap-2">
          {p.main_image && (
            <img src={p.main_image} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
          )}
          <span className="font-primary text-xs text-white/70 whitespace-nowrap">
            <span className="text-[#C9A962] font-bold">{isEn && p.title_en ? p.title_en : p.title}</span>
            {' '}{t('property.comparator.select_another')}
          </span>
        </div>
        <button onClick={onClear} className="ml-2 text-white/30 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  // Define All Comparison Rows
  const ROWS: FeatureRow[] = [
    { 
      key: 'price',
      label: t('property.labels.features.price') || 'Precio', 
      getValue: p => p.price ?? 0, 
      format: v => <span className="text-sm font-secondary">{formatPrice(v as number, i18n.language === 'es' ? 'es-ES' : 'en-US')}</span>,
      isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : v1 > v2 
    },
    { 
      key: 'type',
      label: t('property.labels.features.type') || 'Tipo', 
      getValue: p => p.property_type ?? '—' 
    },
    { 
      key: 'area',
      label: 'm²', 
      getValue: p => p.area_m2 ?? 0, 
      format: v => v ? `${v} m²` : '—',
      isBetter: (v1, v2) => v1 > v2
    },
    { 
      key: 'price_m2',
      label: 'Precio/m²', 
      getValue: p => p.price && p.area_m2 ? p.price / p.area_m2 : 0, 
      format: v => v ? formatPrice(v as number, i18n.language === 'es' ? 'es-ES' : 'en-US') : '—',
      isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : false
    },
    { 
      key: 'bedrooms',
      label: t('property.labels.features.bedrooms_short') || 'Hab.', 
      getValue: p => p.bedrooms ?? 0,
      isBetter: (v1, v2) => v1 > v2
    },
    { 
      key: 'bathrooms',
      label: t('property.labels.features.bathrooms_short') || 'Baños', 
      getValue: p => p.bathrooms ?? 0,
      isBetter: (v1, v2) => v1 > v2
    },
    { 
      key: 'floor',
      label: t('property.labels.features.floor') || 'Planta', 
      getValue: p => p.floor ?? '—' 
    },
    { 
      key: 'condition',
      label: t('property.labels.features.condition') || 'Estado', 
      getValue: p => p.property_condition || p.conservation_state || '—' 
    },
    { 
      key: 'orientation',
      label: t('property.form.fields.orientation') || 'Orientación', 
      getValue: p => safeJoin(p.orientation) || '—' 
    },
    { 
      key: 'energy',
      label: t('property.form.fields.energy_rating') || 'Cert. Energética', 
      getValue: p => p.energy_rating || '—',
      isBetter: (v1, v2) => {
        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const i1 = ratings.indexOf(v1);
        const i2 = ratings.indexOf(v2);
        if (i1 === -1) return false;
        if (i2 === -1) return true;
        return i1 < i2;
      }
    },
    { 
      key: 'elevator',
      label: t('property.labels.features.elevator') || 'Ascensor', 
      getValue: p => p.has_elevator, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
    { 
      key: 'furnished',
      label: t('property.labels.features.furnished') || 'Amueblado', 
      getValue: p => p.is_furnished, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
    { 
      key: 'terrace',
      label: t('property.labels.features.terrace') || 'Terraza', 
      getValue: p => p.has_terrace, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
    { 
      key: 'parking',
      label: t('property.labels.features.parking') || 'Parking', 
      getValue: p => p.has_parking, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
    { 
      key: 'pool',
      label: t('property.labels.features.pool') || 'Piscina', 
      getValue: p => p.has_pool, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
    { 
      key: 'ac',
      label: 'A/C', 
      getValue: p => p.air_conditioning, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
    { 
      key: 'pets',
      label: t('property.labels.features.pets') || 'Mascotas', 
      getValue: p => p.pets_allowed, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-white/10" /> 
    },
  ];

  // Logic to find winners for each row
  const rowWinners = useMemo(() => {
    const winners: Record<string, number[]> = {};
    
    ROWS.forEach(row => {
      if (!row.isBetter) return;
      
      let bestIndices: number[] = [];
      let bestValue: any = null;

      properties.forEach((p, idx) => {
        try {
          const val = row.getValue(p);
          if (val === null || val === undefined || val === 0 || val === '—' || (typeof val === 'number' && isNaN(val))) return;

          if (bestValue === null) {
            bestValue = val;
            bestIndices = [idx];
          } else if (typeof row.isBetter === 'function' && row.isBetter(val, bestValue)) {
            bestValue = val;
            bestIndices = [idx];
          } else if (val === bestValue) {
            bestIndices.push(idx);
          }
        } catch (e) {
          console.error(`Error calculating winner for row ${row.key}:`, e);
        }
      });

      if (bestIndices.length > 0 && bestIndices.length < properties.length) {
        winners[row.key] = bestIndices;
      }
    });

    return winners;
  }, [properties]);

  const filteredRows = useMemo(() => {
    if (!showOnlyDifferences) return ROWS;
    return ROWS.filter(row => {
      const values = properties.map(p => row.getValue(p));
      return !values.every(v => JSON.stringify(v) === JSON.stringify(values[0]));
    });
  }, [showOnlyDifferences, properties]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[60] bg-[#0A0A0A]/98 backdrop-blur-2xl border-t border-[#C9A962]/40 shadow-[0_-25px_60px_rgba(0,0,0,0.95)] max-h-[85vh] flex flex-col"
      >
        {/* Header Panel */}
        <div className="flex items-center justify-between px-6 md:px-14 py-4 border-b border-white/10 shrink-0 bg-black/40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#C9A962]" />
              <h2 className="font-secondary text-lg text-[#FAF8F5] tracking-tight">COMPARADOR PRO</h2>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-primary uppercase tracking-widest transition-all",
                  showOnlyDifferences 
                    ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A] font-bold" 
                    : "border-white/10 text-white/40 hover:text-white hover:border-white/30"
                )}
              >
                {showOnlyDifferences ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showOnlyDifferences ? 'Mostrando Diferencias' : 'Ver solo diferencias'}
              </button>
              <button onClick={onClear} className="text-[10px] font-primary text-white/30 hover:text-white uppercase tracking-widest border-b border-white/0 hover:border-white/30 transition-all">
                Limpiar selección
              </button>
            </div>
          </div>
          <button onClick={onClear} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md">
              <tr>
                <th className="sticky left-0 z-30 bg-[#0F0F0F] text-left p-6 min-w-[180px] border-b border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
                  <div className="flex flex-col gap-1">
                    <span className="font-secondary text-2xl text-[#C9A962]">{properties.length}</span>
                    <div className="flex flex-col">
                      <span className="font-primary text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1">
                        {t('property.comparator.comparing', { count: properties.length })}
                      </span>
                      <p className="text-[9px] text-white/30 hidden md:block italic">
                        {t('property.comparator.winners_hint')}
                      </p>
                    </div>
                  </div>
                </th>
                {properties.map(p => (
                  <th key={p.id} className="p-4 min-w-[240px] border-b border-white/5">
                    <div className="flex flex-col gap-3 relative group">
                      <button 
                        onClick={() => onRemove(p.id)}
                        className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Quitar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="aspect-[16/10] overflow-hidden rounded-lg border border-white/5">
                        <img src={p.main_image || ''} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="flex flex-col gap-1 text-left">
                        <Link to={`/propiedades/${p.reference || p.id}`} className="font-secondary text-sm text-[#FAF8F5] line-clamp-1 hover:text-[#C9A962] transition-colors uppercase">
                          {isEn && p.title_en ? p.title_en : p.title}
                        </Link>
                        {p.reference && <PropertyReference reference={p.reference} variant="minimal" className="self-start" />}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => {
                const winners = rowWinners[row.key] || [];
                return (
                  <tr key={row.key} className={cn(
                    "group transition-colors",
                    idx % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent",
                    "hover:bg-[#C9A962]/5"
                  )}>
                    <td className="sticky left-0 z-10 bg-[#0F0F0F] p-4 font-primary text-[10px] text-white/30 uppercase tracking-[0.2em] border-r border-white/5 shadow-[5px_0_10px_rgba(0,0,0,0.2)]">
                      {row.label}
                    </td>
                    {properties.map((p, pIdx) => {
                      const value = row.getValue(p);
                      const isWinner = winners.includes(pIdx);
                      return (
                        <td key={p.id} className={cn(
                          "p-4 transition-all duration-500 border-r border-white/5 last:border-r-0",
                          isWinner && "bg-[#C9A962]/10"
                        )}>
                          <div className={cn(
                            "flex items-center gap-2",
                            isWinner ? "text-[#C9A962] font-black" : "text-white/60"
                          )}>
                             {row.format ? row.format(value, p) : (
                               <span className={cn(
                                 "font-primary text-xs",
                                 isWinner && "scale-105"
                               )}>
                                 {value !== null && value !== undefined && value !== '' ? String(value) : '—'}
                               </span>
                             )}
                             {isWinner && <CheckCircle2 className="w-3 h-3 shrink-0 animate-pulse" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Actions Row */}
              <tr>
                <td className="sticky left-0 z-10 bg-[#0F0F0F] p-4 border-r border-white/5"></td>
                {properties.map(p => (
                  <td key={p.id} className="p-6 border-r border-white/5 last:border-r-0">
                    <Link
                      to={`/propiedades/${p.reference || p.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 font-primary text-[10px] text-white uppercase tracking-widest font-bold hover:bg-[#C9A962] hover:text-[#0A0A0A] hover:border-[#C9A962] transition-all rounded-sm"
                    >
                      Ver Ficha <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="shrink-0 px-6 md:px-14 py-3 bg-[#111111] border-t border-white/5 flex items-center gap-4">
          <Info className="w-3 h-3 text-[#C9A962]" />
          <p className="font-primary text-[9px] text-white/30 uppercase tracking-widest">
            Los valores resaltados en <span className="text-[#C9A962] font-bold">Dorado</span> representan la característica más ventajosa.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
