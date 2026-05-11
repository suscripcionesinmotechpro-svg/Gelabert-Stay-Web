import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  X, GitCompare, ArrowRight, Check, Minus,
  Euro, Maximize2, Bed, Bath, LayoutGrid,
  Wind, Waves, Dog, Sun, Thermometer,
  Warehouse, Car, Box, Sparkles,
  Construction, Zap, Star
} from 'lucide-react';
import type { Property } from '../types/property';
import { cn } from '../lib/utils';
import { getOptimizedImage } from '../utils/images';

const formatPrice = (price: any, locale: string = 'es-ES') => {
  if (price === null || price === undefined || isNaN(Number(price))) return '—';
  try {
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(Number(price));
  } catch (e) {
    return (price?.toString() || '0') + ' €';
  }
};

interface FeatureRow {
  key: string;
  label: string;
  icon: any;
  getValue: (p: Property) => any;
  format?: (v: any, p: Property) => React.ReactNode;
  isBetter?: (v1: any, v2: any) => boolean;
  priority?: number;
}

const ROWS_CONFIG: FeatureRow[] = [
  { 
    key: 'price',
    label: 'Precio', 
    icon: Euro,
    getValue: p => p.price ?? 0, 
    format: v => <span className="font-bold text-[#C9A962] text-[11px]">{v > 0 ? formatPrice(v) : '—'}</span>,
    isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : v1 > v2,
    priority: 15
  },
  { 
    key: 'area',
    label: 'Superficie', 
    icon: Maximize2,
    getValue: p => p.area_m2 ?? 0, 
    format: v => <span className="text-white/90 text-[10px] font-bold">{v ? `${v} m²` : '—'}</span>,
    isBetter: (v1, v2) => v1 > v2,
    priority: 10
  },
  { key: 'bedrooms', label: 'Dormitorios', icon: Bed, getValue: p => p.bedrooms ?? 0, isBetter: (v1, v2) => v1 > v2, priority: 8 },
  { key: 'bathrooms', label: 'Baños', icon: Bath, getValue: p => p.bathrooms ?? 0, isBetter: (v1, v2) => v1 > v2, priority: 7 },
  { key: 'energy', label: 'Energía', icon: Zap, getValue: p => p.energy_rating || '—', format: v => v && v !== '—' ? <span className="px-1.5 py-0.5 bg-[#C9A962] text-black text-[8px] font-black rounded">{v}</span> : '—' },
  { key: 'elevator', label: 'Ascensor', icon: Construction, getValue: p => !!p.has_elevator },
  { key: 'pool', label: 'Piscina', icon: Waves, getValue: p => !!p.has_pool, priority: 5 },
  { key: 'parking', label: 'Parking', icon: Car, getValue: p => !!p.has_parking, priority: 5 },
  { key: 'ac', label: 'Aire Acond.', icon: Wind, getValue: p => !!p.air_conditioning },
  { key: 'heating', label: 'Calefacción', icon: Thermometer, getValue: p => !!p.heating },
  { key: 'terrace', label: 'Terraza', icon: Sun, getValue: p => !!p.has_terrace },
  { key: 'balcony', label: 'Balcón', icon: Sparkles, getValue: p => !!p.has_balcony },
  { key: 'garden', label: 'Jardín', icon: Sparkles, getValue: p => !!p.garden },
  { key: 'furnished', label: 'Amueblado', icon: Warehouse, getValue: p => !!p.is_furnished },
  { key: 'storage', label: 'Trastero', icon: Box, getValue: p => !!p.has_storage },
  { key: 'exterior', label: 'Exterior', icon: LayoutGrid, getValue: p => !!p.is_exterior },
  { key: 'views', label: 'Vistas Mar', icon: Waves, getValue: p => !!p.sea_views },
  { key: 'pets', label: 'Mascotas', icon: Dog, getValue: p => !!p.pets_allowed },
];

export const PropertyComparator = ({ properties = [], onRemove, onClear }: any) => {
  const { t } = useTranslation();
  const [isMinimized, setIsMinimized] = useState(false);

  const validProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    return properties.filter(p => p && typeof p === 'object' && p.id);
  }, [properties]);

  const rowWinners = useMemo(() => {
    const winners: Record<string, number[]> = {};
    ROWS_CONFIG.forEach(row => {
      if (!row.isBetter) return;
      let bestIndices: number[] = [];
      let bestVal: any = null;
      validProperties.forEach((p, idx) => {
        const val = row.getValue(p);
        if (val === null || val === undefined || val === 0 || val === '—') return;
        if (bestVal === null) {
          bestVal = val;
          bestIndices = [idx];
        } else if (row.isBetter!(val, bestVal)) {
          bestVal = val;
          bestIndices = [idx];
        } else if (val === bestVal) {
          bestIndices.push(idx);
        }
      });
      if (bestIndices.length > 0 && bestIndices.length < validProperties.length) {
        winners[row.key] = bestIndices;
      }
    });
    return winners;
  }, [validProperties]);

  const propertyScores = useMemo(() => {
    const s = validProperties.map(() => 0);
    Object.entries(rowWinners).forEach(([key, wins]) => {
      const row = ROWS_CONFIG.find(r => r.key === key);
      const w = row?.priority || 1;
      wins.forEach(i => { if (s[i] !== undefined) s[i] += w; });
    });
    return s;
  }, [rowWinners, validProperties]);

  if (validProperties.length === 0) return null;

  const winningScore = Math.max(...propertyScores, 0);
  const isBestOption = (idx: number) => winningScore > 0 && propertyScores[idx] === winningScore;

  // Single property floating pill (Much smaller to avoid blocking UI)
  if (validProperties.length === 1) {
    const p = validProperties[0];
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 bg-black/95 backdrop-blur-2xl border border-[#C9A962]/50 px-5 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-5">
        <GitCompare className="w-4 h-4 text-[#C9A962] animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
          <span className="text-[#C9A962] mr-2">{p.reference || 'REF'}</span> Seleccionada
        </span>
        <div className="w-[1px] h-4 bg-white/10" />
        <button onClick={onClear} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 bg-[#C9A962] text-black px-6 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
        >
          <GitCompare className="w-4 h-4" />
          Ver comparador ({validProperties.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-[#C9A962]/30 flex flex-col shadow-[0_-20px_100px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-hidden">
      {/* Slim Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#111]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <GitCompare className="w-4 h-4 text-[#C9A962]" />
          <h2 className="font-secondary text-[10px] text-[#FAF8F5] uppercase tracking-[0.3em] font-black">
            {t('property.comparator.comparing', { count: validProperties.length })}
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsMinimized(true)} className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors">Minimizar</button>
          <button onClick={onClear} className="text-[9px] font-black text-white/20 hover:text-red-500 uppercase tracking-widest transition-colors">Limpiar</button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-50 bg-[#0A0A0A]">
            <tr>
              <th className="p-4 w-[160px] border-b border-white/10 text-left bg-[#0D0D0D] sticky left-0 z-50">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Propiedades</span>
              </th>
              {validProperties.map((p, idx) => (
                <th key={p.id} className="p-4 border-b border-white/10 min-w-[180px] bg-[#0A0A0A]">
                  <div className="flex items-center gap-3 relative group">
                    <div className={cn(
                      "w-16 h-16 shrink-0 overflow-hidden rounded border transition-all duration-500",
                      isBestOption(idx) ? "border-[#C9A962] shadow-[0_0_15px_rgba(201,169,98,0.3)]" : "border-white/5"
                    )}>
                      <img src={getOptimizedImage(p.main_image || '', { width: 150, height: 150 })} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] text-[#C9A962] font-black tracking-widest truncate">{p.reference || 'REF'}</span>
                        {isBestOption(idx) && <Star className="w-2.5 h-2.5 text-[#C9A962] fill-[#C9A962]" />}
                      </div>
                      <h3 className="font-secondary text-[9px] text-white font-bold uppercase truncate leading-tight mb-1">{p.title}</h3>
                      <button onClick={() => onRemove(p.id)} className="text-[8px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-tighter">Quitar</button>
                    </div>

                    {isBestOption(idx) && (
                      <div className="absolute -top-1 -right-1 bg-[#C9A962] text-black px-1.5 py-0.5 rounded text-[6px] font-black tracking-tighter">TOP</div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ROWS_CONFIG.map(row => (
              <tr key={row.key} className="group hover:bg-white/[0.02]">
                <td className="p-2.5 bg-[#0D0D0D] sticky left-0 z-40 border-r border-white/5">
                  <div className="flex items-center gap-2 text-white/20 group-hover:text-[#C9A962] transition-colors pl-2">
                    {row.icon && <row.icon className="w-3 h-3" />}
                    <span className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">{row.label}</span>
                  </div>
                </td>
                {validProperties.map((p, pIdx) => {
                  const val = row.getValue(p);
                  const isWinner = rowWinners[row.key]?.includes(pIdx);
                  const isBoolean = typeof val === 'boolean';
                  
                  return (
                    <td key={p.id} className={cn("p-2.5 transition-colors text-center border-r border-white/5 last:border-r-0", isWinner && "bg-[#C9A962]/[0.03]")}>
                      <div className={cn("flex items-center justify-center gap-2", isWinner ? "text-[#C9A962] font-bold" : "text-white/70")}>
                        {row.format ? row.format(val, p) : (
                          isBoolean ? (
                            val ? <Check className="w-3.5 h-3.5 text-[#C9A962]" /> : <Minus className="w-3.5 h-3.5 text-white/5" />
                          ) : <span className="text-[10px] tracking-tight">{val || '—'}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Action Row */}
            <tr className="bg-black/40">
              <td className="p-6 bg-[#0D0D0D] sticky left-0 z-40 border-r border-white/5">
                 <div className="flex flex-col gap-1 pl-2">
                    <span className="text-[#C9A962] font-black text-[10px]">VEREDICTO</span>
                    <span className="text-[6px] text-white/20 uppercase">Selección final</span>
                 </div>
              </td>
              {validProperties.map((p, idx) => (
                <td key={p.id} className="p-4">
                  <Link 
                    to={`/propiedades/${p.reference || p.id}`}
                    className={cn(
                      "flex items-center justify-center gap-2 w-full py-2.5 text-[8px] font-black uppercase tracking-[0.2em] transition-all rounded shadow-xl",
                      isBestOption(idx) 
                        ? "bg-[#C9A962] text-black hover:bg-white" 
                        : "bg-white/5 text-white/40 hover:bg-white hover:text-black"
                    )}
                  >
                    Detalles <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
