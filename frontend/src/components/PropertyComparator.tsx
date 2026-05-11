import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  X, GitCompare, ArrowRight, Check, Minus,
  Euro, Maximize2, Bed, Bath, LayoutGrid,
  Wind, Waves, Dog, Sun, Thermometer,
  Warehouse, Car, Box, Sparkles,
  Construction, Zap, Star, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    format: v => <span className="text-white/90 text-sm font-bold">{v ? `${v} m²` : '—'}</span>,
    isBetter: (v1, v2) => v1 > v2,
    priority: 10
  },
  { key: 'bedrooms', label: 'Dormitorios', icon: Bed, getValue: p => p.bedrooms ?? 0, isBetter: (v1, v2) => v1 > v2, priority: 8 },
  { key: 'bathrooms', label: 'Baños', icon: Bath, getValue: p => p.bathrooms ?? 0, isBetter: (v1, v2) => v1 > v2, priority: 7 },
  { key: 'energy', label: 'Energía', icon: Zap, getValue: p => p.energy_rating || '—', format: v => v && v !== '—' ? <span className="px-2 py-0.5 bg-[#C9A962] text-black text-[10px] font-black rounded">{v}</span> : '—' },
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 bg-black/95 backdrop-blur-2xl border border-[#C9A962]/30 px-6 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-5">
        <GitCompare className="w-5 h-5 text-[#C9A962] animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 flex items-center gap-3">
          <span className="text-[#C9A962]">{p.reference || 'REF'}</span>
          <span className="opacity-40">|</span>
          Añadido a comparar
        </span>
        <div className="w-[1px] h-4 bg-white/10" />
        <button onClick={onClear} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-4 h-4 text-white/40 hover:text-white" />
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-4 bg-[#C9A962] text-[#0A0A0A] px-8 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:scale-105 transition-all group"
        >
          <GitCompare className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Comparar ({validProperties.length}/3)
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-12">
        {/* Backdrop Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMinimized(true)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-7xl bg-[#0A0A0A] md:rounded-sm border-t md:border border-[#C9A962]/30 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col h-full max-h-[90vh] md:max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-gradient-to-r from-[#111] to-[#0A0A0A] shrink-0">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsMinimized(true)}
                className="flex items-center gap-2 text-white/40 hover:text-[#C9A962] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
              </button>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="flex items-center gap-3">
                <GitCompare className="w-5 h-5 text-[#C9A962]" />
                <h2 className="font-secondary text-lg text-white uppercase tracking-[0.2em] font-light">
                  {t('property.comparator.comparing', { count: validProperties.length })}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={onClear} 
                className="text-[10px] font-black text-white/20 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar Selección
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>
          </div>

          {/* Comparison Content */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-50 bg-[#0A0A0A]">
                  <tr>
                    <th className="p-8 w-[240px] border-b border-white/10 text-left bg-[#0D0D0D]/50 sticky left-0 z-50 backdrop-blur-md">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-[#C9A962] uppercase tracking-[0.3em]">Análisis</span>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Side-by-Side</span>
                      </div>
                    </th>
                    {validProperties.map((p, idx) => (
                      <th key={p.id} className="p-8 border-b border-white/10 min-w-[280px] bg-[#0A0A0A]">
                        <div className="flex flex-col gap-6 relative group">
                          {/* Large Image Container */}
                          <div className={cn(
                            "aspect-[4/3] w-full overflow-hidden rounded-sm border transition-all duration-700 relative",
                            isBestOption(idx) ? "border-[#C9A962] shadow-[0_0_30px_rgba(201,169,98,0.2)]" : "border-white/5"
                          )}>
                            <img 
                              src={getOptimizedImage(p.main_image || '', { width: 600, height: 450 })} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                            />
                            {isBestOption(idx) && (
                              <div className="absolute top-4 right-4 bg-[#C9A962] text-[#0A0A0A] px-4 py-2 rounded-sm text-[10px] font-black tracking-widest flex items-center gap-2 shadow-2xl">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                MEJOR OPCIÓN
                              </div>
                            )}
                            <button 
                              onClick={() => onRemove(p.id)}
                              className="absolute top-4 left-4 w-10 h-10 rounded-sm bg-black/60 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="text-left">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] text-[#C9A962] font-black tracking-[0.2em]">{p.reference || 'REF'}</span>
                              <div className="w-[4px] h-[4px] rounded-full bg-white/20" />
                              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{p.zone}</span>
                            </div>
                            <h3 className="font-secondary text-sm md:text-base text-white font-bold uppercase truncate tracking-wide leading-relaxed">{p.title}</h3>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ROWS_CONFIG.map(row => (
                    <tr key={row.key} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 bg-[#0D0D0D]/50 sticky left-0 z-40 border-r border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-4 text-white/30 group-hover:text-[#C9A962] transition-colors">
                          <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-[#C9A962]/10 transition-all">
                            {row.icon && <row.icon className="w-4 h-4" />}
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">{row.label}</span>
                        </div>
                      </td>
                      {validProperties.map((p, pIdx) => {
                        const val = row.getValue(p);
                        const isWinner = rowWinners[row.key]?.includes(pIdx);
                        const isBoolean = typeof val === 'boolean';
                        
                        return (
                          <td key={p.id} className={cn(
                            "px-8 py-5 transition-colors text-center border-r border-white/5 last:border-r-0", 
                            isWinner && "bg-[#C9A962]/[0.05]"
                          )}>
                            <div className={cn(
                              "flex items-center justify-center gap-3", 
                              isWinner ? "text-[#C9A962] font-bold scale-110" : "text-white/60"
                            )}>
                              {row.format ? row.format(val, p) : (
                                isBoolean ? (
                                  val ? <Check className="w-5 h-5 text-[#C9A962]" /> : <Minus className="w-5 h-5 text-white/5" />
                                ) : <span className="text-sm tracking-tight">{val || '—'}</span>
                              )}
                              {isWinner && !isBoolean && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  
                  {/* Verdict Row */}
                  <tr className="bg-black/60">
                    <td className="px-8 py-10 bg-[#0D0D0D]/80 sticky left-0 z-40 border-r border-white/5 backdrop-blur-xl">
                       <div className="flex flex-col gap-2">
                          <span className="text-[#C9A962] font-black text-xs tracking-widest uppercase">Veredicto Final</span>
                          <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">Basado en características técnicas</span>
                       </div>
                    </td>
                    {validProperties.map((p, idx) => (
                      <td key={p.id} className="p-8">
                        <div className="flex flex-col gap-6 items-center">
                          <div className="flex flex-col items-center gap-2">
                             <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Puntuación</div>
                             <div className={cn(
                               "text-3xl font-secondary font-black",
                               isBestOption(idx) ? "text-[#C9A962]" : "text-white/20"
                             )}>
                               {propertyScores[idx]}
                             </div>
                          </div>

                          <Link 
                            to={`/propiedades/${p.reference || p.id}`}
                            className={cn(
                              "flex items-center justify-center gap-3 w-full max-w-[200px] py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-sm shadow-2xl overflow-hidden relative group/btn",
                              isBestOption(idx) 
                                ? "bg-[#C9A962] text-[#0A0A0A] hover:bg-white" 
                                : "bg-white/5 text-white/60 hover:bg-white hover:text-[#0A0A0A]"
                            )}
                          >
                            <span className="relative z-10">Ver Detalles</span>
                            <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-2 transition-transform" />
                            {isBestOption(idx) && (
                              <motion.div 
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              />
                            )}
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Re-export Trash2 which was missing in initial thinking but added to code
import { Trash2 } from 'lucide-react';
