import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  X, GitCompare, ArrowRight, Check, Minus, Info, 
  MapPin, Euro, Maximize2, Bed, Bath, LayoutGrid,
  Wind, Waves, Dog, Sun, Thermometer, Shield,
  Warehouse, Car, Box, Flame, Sparkles, TrendingUp,
  Construction, Zap
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
    format: v => <span className="font-bold text-[#C9A962] text-sm">{v > 0 ? formatPrice(v) : '—'}</span>,
    isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : v1 > v2,
    priority: 15
  },
  { 
    key: 'area',
    label: 'Superficie', 
    icon: Maximize2,
    getValue: p => p.area_m2 ?? 0, 
    format: v => <span className="text-white/90 text-xs font-bold">{v ? `${v} m²` : '—'}</span>,
    isBetter: (v1, v2) => v1 > v2,
    priority: 10
  },
  { 
    key: 'bedrooms',
    label: 'Dormitorios', 
    icon: Bed,
    getValue: p => p.bedrooms ?? 0,
    format: v => <span className="text-white/90 text-xs">{v}</span>,
    isBetter: (v1, v2) => v1 > v2,
    priority: 8
  },
  { 
    key: 'bathrooms',
    label: 'Baños', 
    icon: Bath,
    getValue: p => p.bathrooms ?? 0,
    format: v => <span className="text-white/90 text-xs">{v}</span>,
    isBetter: (v1, v2) => v1 > v2,
    priority: 7
  },
  { 
    key: 'location',
    label: 'Zona', 
    icon: MapPin,
    getValue: p => p.zone || p.city || '—',
    format: v => <span className="text-white/60 text-[10px] uppercase tracking-wider font-medium">{v}</span>
  },
  { 
    key: 'floor',
    label: 'Planta', 
    icon: LayoutGrid,
    getValue: p => p.floor || '—',
    format: v => <span className="text-white/70 text-xs">{v}</span>
  },
  { 
    key: 'energy',
    label: 'Clase Energ.', 
    icon: Zap,
    getValue: p => p.energy_rating || '—',
    format: v => v && v !== '—' ? <span className="px-2 py-0.5 bg-[#C9A962] text-black text-[9px] font-black rounded">{v}</span> : '—',
    isBetter: (v1, v2) => {
        if (!v1 || !v2 || v1 === '—' || v2 === '—') return false;
        const r = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const i1 = r.indexOf(String(v1).toUpperCase());
        const i2 = r.indexOf(String(v2).toUpperCase());
        return i1 !== -1 && i2 !== -1 ? i1 < i2 : false;
    }
  },
  // Boolean Features
  { key: 'elevator', label: 'Ascensor', icon: Construction, getValue: p => !!p.has_elevator },
  { key: 'pool', label: 'Piscina', icon: Waves, getValue: p => !!p.has_pool },
  { key: 'parking', label: 'Parking', icon: Car, getValue: p => !!p.has_parking },
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
  { key: 'fireplace', label: 'Chimenea', icon: Flame, getValue: p => !!p.has_fireplace },
  { key: 'wardrobes', label: 'Armarios', icon: Shield, getValue: p => !!p.has_wardrobes },
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
  const isBestOption = (idx: number) => winningScore > 0 && propertyScores[idx] === winningScore && propertyScores.filter(s => s === winningScore).length === 1;

  // Single property floating pill (Much smaller to avoid blocking UI)
  if (validProperties.length === 1) {
    const p = validProperties[0];
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-6 bg-black/90 backdrop-blur-xl border border-[#C9A962]/50 px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <GitCompare className="w-4 h-4 text-[#C9A962]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            <span className="text-[#C9A962]">{p.title}</span>
            <span className="text-white/40 ml-2">Seleccionada</span>
          </span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <span className="text-[9px] text-white/60 uppercase font-medium tracking-widest">Elige otra para comparar</span>
        <button onClick={onClear} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
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
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0A0A0A] border-t border-[#C9A962]/40 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)] max-h-[85vh] overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/80 backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-4 h-4 text-[#C9A962]" />
            <h2 className="font-secondary text-[10px] text-white uppercase tracking-[0.2em] font-black">{t('property.comparator.comparing', { count: validProperties.length })}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMinimized(true)}
            className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-colors"
          >
            Minimizar
          </button>
          <div className="w-[1px] h-4 bg-white/10" />
          <button onClick={onClear} className="text-[9px] font-black text-white/20 hover:text-red-500 uppercase tracking-widest transition-colors">
            Limpiar selección
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-black/20">
        <table className="w-full border-collapse min-w-[700px]">
          <thead className="sticky top-0 z-50 bg-[#0A0A0A]">
            <tr>
              <th className="p-6 w-[180px] border-b border-white/10 text-left bg-[#0D0D0D] sticky left-0 z-50">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Características</span>
              </th>
              {validProperties.map((p, idx) => (
                <th key={p.id} className="p-4 border-b border-white/10 min-w-[200px] bg-[#0A0A0A]">
                  <div className="flex flex-col gap-3 relative group">
                    {isBestOption(idx) && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#C9A962] text-black px-3 py-0.5 rounded-full text-[7px] font-black tracking-widest shadow-lg z-10 border border-white/10">
                        <TrendingUp className="w-2.5 h-2.5 inline mr-1" /> RECOMENDADA
                      </div>
                    )}
                    
                    <div className={cn(
                      "aspect-video overflow-hidden rounded border transition-all duration-500",
                      isBestOption(idx) ? "border-[#C9A962] shadow-[0_0_20px_rgba(201,169,98,0.15)]" : "border-white/5"
                    )}>
                      <img src={getOptimizedImage(p.main_image || '', { width: 300, height: 200 })} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    <div className="text-left">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-secondary text-[9px] text-white font-bold uppercase line-clamp-1 flex-1 leading-tight">{p.title}</h3>
                        <button onClick={() => onRemove(p.id)} className="text-white/20 hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] text-[#C9A962] font-black tracking-widest">{p.reference || 'REF'}</span>
                        <span className="text-[7px] text-white/20 font-black uppercase">{propertyScores[idx]} pts</span>
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ROWS_CONFIG.map(row => (
              <tr key={row.key} className="group hover:bg-white/[0.01] transition-colors">
                <td className="p-3 bg-[#0D0D0D] sticky left-0 z-40 border-r border-white/5">
                  <div className="flex items-center gap-2.5 text-white/20 group-hover:text-[#C9A962] transition-colors">
                    {row.icon && <row.icon className="w-3 h-3" />}
                    <span className="text-[8px] font-bold uppercase tracking-widest">{row.label}</span>
                  </div>
                </td>
                {validProperties.map((p, pIdx) => {
                  const val = row.getValue(p);
                  const isWinner = rowWinners[row.key]?.includes(pIdx);
                  const isBoolean = typeof val === 'boolean';
                  
                  return (
                    <td key={p.id} className={cn("p-3 transition-colors text-center border-r border-white/5 last:border-r-0", isWinner && "bg-[#C9A962]/[0.02]")}>
                      <div className={cn("flex items-center justify-center gap-2", isWinner ? "text-[#C9A962] font-bold" : "text-white/60")}>
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
            
            {/* Verdict Row */}
            <tr className="bg-black/40">
              <td className="p-8 bg-[#0D0D0D] sticky left-0 z-40 border-r border-white/5" />
              {validProperties.map((p, idx) => (
                <td key={p.id} className="p-6">
                  <Link 
                    to={`/propiedades/${p.reference || p.id}`}
                    className={cn(
                      "flex items-center justify-center gap-2.5 w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded shadow-xl",
                      isBestOption(idx) 
                        ? "bg-[#C9A962] text-black hover:bg-white" 
                        : "bg-white/5 text-white/60 hover:bg-white hover:text-black"
                    )}
                  >
                    Ver Ficha <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Compact Legal Footer */}
      <div className="px-8 py-2.5 bg-black border-t border-white/5 flex items-center justify-between shrink-0">
        <p className="text-[7px] text-white/10 uppercase tracking-[0.2em]">Gelabert Homes &copy; 2026</p>
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-[#C9A962]/40" />
          <span className="text-[7px] text-white/10 uppercase tracking-widest">Valores verificados · Análisis inteligente</span>
        </div>
      </div>
    </div>
  );
};
