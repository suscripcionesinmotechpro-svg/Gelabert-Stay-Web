import { useState, useMemo } from 'react';
import { 
  X, ArrowRight, GitCompare, CheckCircle2, Minus, Info, 
  MapPin, Euro, Maximize2, Bed, Bath, Layers, Sparkles, TrendingUp,
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types/property';
import { cn } from '../lib/utils';
import { getOptimizedImage } from '../utils/images';

interface PropertyComparatorProps {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const formatPrice = (price: any, locale: string = 'es-ES') => {
  if (!price || isNaN(Number(price))) return '—';
  try {
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: 'EUR', 
      maximumFractionDigits: 0 
    }).format(Number(price));
  } catch (e) {
    return price + ' €';
  }
};

interface FeatureRow {
  key: string;
  label: string;
  icon?: any;
  getValue: (p: Property) => any;
  format?: (v: any, p: Property) => React.ReactNode;
  isBetter?: (v1: any, v2: any) => boolean;
  priority?: number;
}

export const PropertyComparator = ({ properties = [], onRemove, onClear }: PropertyComparatorProps) => {
  const { t, i18n } = useTranslation();
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const isEn = i18n.language?.startsWith('en');

  const validProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    return properties.filter(p => p && p.id);
  }, [properties]);

  if (validProperties.length === 0) return null;

  // Single property floating hint
  if (validProperties.length === 1) {
    const p = validProperties[0];
    const title = (isEn && p.title_en) ? p.title_en : p.title;
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-[#C9A962]/40 rounded-full px-6 py-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <GitCompare className="w-4 h-4 text-[#C9A962]" />
          <span className="font-primary text-[10px] text-white uppercase tracking-widest">
            <span className="font-bold text-[#C9A962]">{title}</span>
            <span className="text-white/40 ml-2">— Selecciona otra para comparar</span>
          </span>
        </div>
        <button onClick={onClear} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-3.5 h-3.5 text-white/30" />
        </button>
      </div>
    );
  }

  // Row Definitions for Intelligent Comparison
  const ROWS: FeatureRow[] = [
    { 
      key: 'price',
      label: 'Precio', 
      icon: Euro,
      getValue: p => p.price ?? 0, 
      format: v => <span className="font-secondary font-bold text-[#C9A962]">{formatPrice(v, i18n.language === 'es' ? 'es-ES' : 'en-US')}</span>,
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
      label: 'Dormitorios', 
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
      key: 'floor',
      label: 'Planta', 
      icon: Layers,
      getValue: p => p.floor || '—' 
    },
    { 
      key: 'energy',
      label: 'Eficiencia', 
      icon: Sparkles,
      getValue: p => p.energy_rating || '—',
      isBetter: (v1, v2) => {
        if (!v1 || !v2 || v1 === '—' || v2 === '—') return false;
        const r = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const i1 = r.indexOf(String(v1).toUpperCase());
        const i2 = r.indexOf(String(v2).toUpperCase());
        return i1 !== -1 && i2 !== -1 ? i1 < i2 : false;
      }
    },
    { 
      key: 'elevator',
      label: 'Ascensor', 
      icon: Home,
      getValue: p => !!p.has_elevator, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
  ];

  // Logic to find winners per row
  const rowWinners = useMemo(() => {
    const winners: Record<string, number[]> = {};
    ROWS.forEach(row => {
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
        } else if (JSON.stringify(val) === JSON.stringify(bestVal)) {
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
      const row = ROWS.find(r => r.key === key);
      const w = row?.priority || 1;
      wins.forEach(i => { s[i] += w; });
    });
    return s;
  }, [rowWinners, validProperties]);

  const winningScore = Math.max(...propertyScores, 0);
  const isBestOption = (idx: number) => winningScore > 0 && propertyScores[idx] === winningScore && propertyScores.filter(s => s === winningScore).length === 1;

  const filteredRows = showOnlyDifferences 
    ? ROWS.filter(row => {
        const vals = validProperties.map(p => row.getValue(p));
        return !vals.every(v => JSON.stringify(v) === JSON.stringify(vals[0]));
      })
    : ROWS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A] border-t border-[#C9A962]/40 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] max-h-[85vh] flex flex-col font-primary animate-in slide-in-from-bottom duration-700">
      {/* Premium Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/60 backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A962]/10 flex items-center justify-center border border-[#C9A962]/20">
              <GitCompare className="w-4 h-4 text-[#C9A962]" />
            </div>
            <h2 className="font-secondary text-sm text-[#FAF8F5] uppercase tracking-[0.2em]">{t('property.comparator.comparing', { count: validProperties.length })}</h2>
          </div>
          
          <button 
            onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
            className={cn(
              "px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
              showOnlyDifferences ? "bg-[#C9A962] border-[#C9A962] text-black" : "border-white/10 text-white/40 hover:text-white"
            )}
          >
            {showOnlyDifferences ? 'Ver todo' : 'Solo diferencias'}
          </button>
        </div>
        
        <button onClick={onClear} className="group flex items-center gap-2 text-[9px] font-black text-white/20 hover:text-red-500 uppercase tracking-widest transition-colors">
          <X className="w-3 h-3" /> Limpiar selección
        </button>
      </div>

      {/* Comparison Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse table-fixed min-w-[750px]">
          <thead className="sticky top-0 z-50 bg-[#0A0A0A]">
            <tr>
              <th className="sticky left-0 z-50 bg-[#0F0F0F] text-left p-8 w-[200px] border-b border-white/10">
                <div className="flex flex-col gap-1">
                  <span className="text-4xl font-secondary text-[#C9A962] font-black leading-none">{validProperties.length}</span>
                  <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Seleccionadas</span>
                </div>
              </th>
              {validProperties.map((p, idx) => (
                <th key={p.id} className="p-6 border-b border-white/10 min-w-[260px]">
                  <div className="flex flex-col gap-4 relative group">
                    {/* Recommendation Badge */}
                    {isBestOption(idx) && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#C9A962] text-black px-4 py-1 rounded-full text-[8px] font-black tracking-widest shadow-lg border border-white/20 flex items-center gap-2 whitespace-nowrap">
                        <TrendingUp className="w-3 h-3" /> MEJOR VALORACIÓN
                      </div>
                    )}
                    
                    <button 
                      onClick={() => onRemove(p.id)}
                      className="absolute -top-2 -right-2 z-50 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div className={cn(
                      "aspect-[16/10] overflow-hidden rounded border transition-all duration-500",
                      isBestOption(idx) ? "border-[#C9A962] shadow-[0_0_30px_rgba(201,169,98,0.15)]" : "border-white/5"
                    )}>
                      <img src={getOptimizedImage(p.main_image || '', { width: 400, height: 250 })} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>

                    <div className="text-left">
                      <h3 className="font-secondary text-[10px] text-white font-bold uppercase truncate tracking-tight">{isEn && p.title_en ? p.title_en : p.title}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[9px] text-[#C9A962] font-black tracking-widest">{p.reference || 'REF'}</span>
                        <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">{propertyScores[idx]} Puntos</span>
                      </div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRows.map(row => (
              <tr key={row.key} className="group hover:bg-[#C9A962]/[0.02] transition-colors">
                <td className="sticky left-0 z-40 bg-[#0F0F0F] p-4 border-r border-white/5">
                  <div className="flex items-center gap-3 text-white/30 group-hover:text-[#C9A962] transition-colors">
                    {row.icon && <row.icon className="w-3 h-3" />}
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{row.label}</span>
                  </div>
                </td>
                {validProperties.map((p, pIdx) => {
                  const val = row.getValue(p);
                  const isWinner = rowWinners[row.key]?.includes(pIdx);
                  return (
                    <td key={p.id} className={cn("p-4 border-r border-white/5 last:border-r-0 transition-colors", isWinner && "bg-[#C9A962]/[0.03]")}>
                      <div className={cn("flex items-center gap-2.5", isWinner ? "text-[#C9A962] font-bold" : "text-white/60")}>
                        {row.format ? row.format(val, p) : <span className="text-xs">{val ?? '—'}</span>}
                        {isWinner && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Verdict Row */}
            <tr className="bg-black/40">
              <td className="sticky left-0 z-40 bg-[#0F0F0F] p-4 border-r border-white/5">
                <span className="text-[9px] font-black text-[#C9A962] uppercase tracking-[0.2em]">Veredicto</span>
              </td>
              {validProperties.map((p, idx) => (
                <td key={p.id} className="p-8">
                  <div className="flex flex-col gap-4">
                    <Link 
                      to={`/propiedades/${p.reference || p.id}`}
                      className={cn(
                        "flex items-center justify-center gap-3 w-full py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded shadow-xl",
                        isBestOption(idx) 
                          ? "bg-[#C9A962] text-black hover:bg-white" 
                          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      Ver Detalles <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Legal Footer */}
      <div className="px-14 py-3 bg-black/80 border-t border-white/5 flex items-center justify-between shrink-0">
        <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Gelabert Homes &copy; 2026 · Análisis de Mercado Inteligente</p>
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-[#C9A962]" />
          <span className="text-[8px] text-white/20 uppercase tracking-widest">Valores basados en ficha técnica oficial</span>
        </div>
      </div>
    </div>
  );
};
