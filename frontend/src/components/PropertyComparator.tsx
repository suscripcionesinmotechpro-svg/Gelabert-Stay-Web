import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  X, GitCompare, ArrowRight, Check, Minus, Info, 
  MapPin, Euro, Maximize2, Bed, Bath, LayoutGrid
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
    format: v => <span className="font-bold text-[#C9A962]">{v > 0 ? formatPrice(v) : '—'}</span>,
    isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : v1 > v2,
    priority: 10
  },
  { 
    key: 'location',
    label: 'Zona', 
    icon: MapPin,
    getValue: p => p.zone || p.city || '—',
  },
  { 
    key: 'area',
    label: 'Superficie', 
    icon: Maximize2,
    getValue: p => p.area_m2 ?? 0, 
    format: v => v ? `${v} m²` : '—',
    isBetter: (v1, v2) => v1 > v2,
    priority: 8
  },
  { 
    key: 'bedrooms',
    label: 'Hab.', 
    icon: Bed,
    getValue: p => p.bedrooms ?? 0,
    isBetter: (v1, v2) => v1 > v2,
    priority: 7
  },
  { 
    key: 'bathrooms',
    label: 'Baños', 
    icon: Bath,
    getValue: p => p.bathrooms ?? 0,
    isBetter: (v1, v2) => v1 > v2,
    priority: 6
  },
  { 
    key: 'elevator',
    label: 'Ascensor', 
    icon: LayoutGrid,
    getValue: p => !!p.has_elevator, 
    format: v => v ? <Check className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
  },
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

  // Full Comparison (Minimized state)
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
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0A0A0A] border-t border-[#C9A962]/40 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-hidden">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/50 backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A962]/10 flex items-center justify-center border border-[#C9A962]/20">
              <GitCompare className="w-5 h-5 text-[#C9A962]" />
            </div>
            <div>
              <h2 className="font-secondary text-xs text-white uppercase tracking-[0.2em] font-black">Análisis Comparativo</h2>
              <p className="text-[8px] text-white/40 uppercase tracking-[0.1em]">{t('property.comparator.comparing', { count: validProperties.length })}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMinimized(true)}
            className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors mr-4"
          >
            Minimizar
          </button>
          <button onClick={onClear} className="group flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all">
            <X className="w-3.5 h-3.5" /> Limpiar Todo
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-50 bg-[#0A0A0A]">
            <tr>
              <th className="p-8 w-[200px] border-b border-white/10 text-left bg-[#0F0F0F] sticky left-0 z-50">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Características</span>
              </th>
              {validProperties.map((p, idx) => (
                <th key={p.id} className="p-6 border-b border-white/10 min-w-[280px]">
                  <div className="flex flex-col gap-4 relative group">
                    {isBestOption(idx) && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A962] text-black px-4 py-1 rounded-full text-[8px] font-black tracking-widest shadow-lg border border-white/20 z-10">
                        RECOMENDADA
                      </div>
                    )}
                    
                    <div className={cn(
                      "aspect-[16/9] overflow-hidden rounded-lg border transition-all duration-500",
                      isBestOption(idx) ? "border-[#C9A962] shadow-[0_0_30px_rgba(201,169,98,0.2)]" : "border-white/5"
                    )}>
                      <img src={getOptimizedImage(p.main_image || '', { width: 400, height: 250 })} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>

                    <div className="text-left">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-secondary text-[11px] text-white font-bold uppercase line-clamp-1 flex-1">{p.title}</h3>
                        <button onClick={() => onRemove(p.id)} className="text-white/20 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[9px] text-[#C9A962] font-black tracking-widest mt-1 block">{p.reference || 'REF'}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ROWS_CONFIG.map(row => (
              <tr key={row.key} className="group hover:bg-white/[0.02] transition-colors">
                <td className="p-5 bg-[#0F0F0F] sticky left-0 z-40 border-r border-white/5">
                  <div className="flex items-center gap-3 text-white/30 group-hover:text-[#C9A962] transition-colors">
                    {row.icon && <row.icon className="w-3.5 h-3.5" />}
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{row.label}</span>
                  </div>
                </td>
                {validProperties.map((p, pIdx) => {
                  const val = row.getValue(p);
                  const isWinner = rowWinners[row.key]?.includes(pIdx);
                  return (
                    <td key={p.id} className={cn("p-5 transition-colors text-center", isWinner && "bg-[#C9A962]/[0.03]")}>
                      <div className={cn("flex items-center justify-center gap-3", isWinner ? "text-[#C9A962] font-bold" : "text-white/70")}>
                        {row.format ? row.format(val, p) : <span className="text-xs tracking-tight">{val || '—'}</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Action Row */}
            <tr className="bg-black/50">
              <td className="p-10 bg-[#0F0F0F] sticky left-0 z-40 border-r border-white/5" />
              {validProperties.map((p, idx) => (
                <td key={p.id} className="p-10">
                  <Link 
                    to={`/propiedades/${p.reference || p.id}`}
                    className={cn(
                      "flex items-center justify-center gap-3 w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-full shadow-2xl",
                      isBestOption(idx) 
                        ? "bg-[#C9A962] text-black hover:bg-white" 
                        : "bg-white/5 text-white/60 hover:bg-white hover:text-black"
                    )}
                  >
                    Ver Detalles <ArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Legal Footer */}
      <div className="px-10 py-4 bg-black/80 border-t border-white/5 flex items-center justify-between shrink-0">
        <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Gelabert Homes &copy; 2026 · Comparativa de Mercado</p>
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#C9A962]" />
          <span className="text-[8px] text-white/20 uppercase tracking-widest">Valores verificados por el sistema de gestión</span>
        </div>
      </div>
    </div>
  );
};
