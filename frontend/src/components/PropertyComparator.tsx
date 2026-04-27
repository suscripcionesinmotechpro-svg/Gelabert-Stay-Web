import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ArrowRight, GitCompare, CheckCircle2, Minus, Info, Eye, EyeOff, 
  MapPin, Euro, Maximize2, Bed, Bath, Layers, Sparkles, TrendingUp,
  Wind, ShieldCheck, Waves, Car, Warehouse, TreePine, PawPrint, Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Property } from '../types/property';
import { cn } from '../lib/utils';
import { PropertyReference } from './PropertyReference';
import { getOptimizedImage } from '../utils/images';

interface PropertyComparatorProps {
  properties: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const formatPrice = (price: number | null | undefined, locale: string = 'es-ES') => {
  if (price === 0) return '—';
  if (!price || isNaN(price)) return '—';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
  } catch (e) {
    return '—';
  }
};

interface FeatureRow {
  key: string;
  label: string;
  icon?: React.ReactNode;
  getValue: (p: Property) => any;
  format?: (v: any, p: Property) => React.ReactNode;
  isBetter?: (v1: any, v2: any) => boolean;
  priority?: number; // Higher is more important for the "Best Choice" calculation
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

  // Guard against empty list or invalid properties
  const validProperties = useMemo(() => properties.filter(p => p && p.id), [properties]);
  if (validProperties.length === 0) return null;

  // 1 property hint - Minimalist floating bar
  if (validProperties.length === 1) {
    const p = validProperties[0];
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-[#C9A962]/30 rounded-full px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <GitCompare className="w-4 h-4 text-[#C9A962]" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#C9A962] rounded-full animate-pulse" />
          </div>
          <span className="font-primary text-xs text-white/90 whitespace-nowrap">
            <span className="text-[#C9A962] font-bold uppercase tracking-wider">{isEn && p.title_en ? p.title_en : p.title}</span>
            <span className="text-white/40 ml-2">— Selecciona otra para comparar</span>
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 mx-2" />
        <button onClick={onClear} className="group p-1 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
        </button>
      </motion.div>
    );
  }

  // Intelligent Comparison Logic
  const ROWS: FeatureRow[] = [
    { 
      key: 'price',
      label: t('property.admin.form.fields.price') || 'Precio', 
      icon: <Euro className="w-3.5 h-3.5" />,
      getValue: p => p.price ?? 0, 
      format: v => <span className="text-sm font-secondary font-bold text-[#C9A962]">{formatPrice(v as number, i18n.language === 'es' ? 'es-ES' : 'en-US')}</span>,
      isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : v1 > v2,
      priority: 10
    },
    { 
      key: 'location',
      label: 'Ubicación', 
      icon: <MapPin className="w-3.5 h-3.5" />,
      getValue: p => p.zone || p.city || '—',
    },
    { 
      key: 'type',
      label: t('property.labels.features.type') || 'Tipo', 
      icon: <Home className="w-3.5 h-3.5" />,
      getValue: p => p.property_type ?? '—' 
    },
    { 
      key: 'area',
      label: 'Superficie', 
      icon: <Maximize2 className="w-3.5 h-3.5" />,
      getValue: p => p.area_m2 ?? 0, 
      format: v => v ? <span className="font-secondary">{v} m²</span> : '—',
      isBetter: (v1, v2) => v1 > v2,
      priority: 8
    },
    { 
      key: 'price_m2',
      label: 'Valor m²', 
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      getValue: p => p.price && p.area_m2 ? Math.round(p.price / p.area_m2) : 0, 
      format: v => v ? <span className="text-[10px] opacity-70">{formatPrice(v as number, i18n.language === 'es' ? 'es-ES' : 'en-US')}/m²</span> : '—',
      isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : false,
      priority: 5
    },
    { 
      key: 'bedrooms',
      label: t('property.labels.features.bedrooms') || 'Dormitorios', 
      icon: <Bed className="w-3.5 h-3.5" />,
      getValue: p => p.bedrooms ?? 0,
      isBetter: (v1, v2) => v1 > v2,
      priority: 7
    },
    { 
      key: 'bathrooms',
      label: t('property.labels.features.bathrooms') || 'Baños', 
      icon: <Bath className="w-3.5 h-3.5" />,
      getValue: p => p.bathrooms ?? 0,
      isBetter: (v1, v2) => v1 > v2,
      priority: 6
    },
    { 
      key: 'floor',
      label: t('property.labels.features.floor') || 'Planta', 
      icon: <Layers className="w-3.5 h-3.5" />,
      getValue: p => p.floor ?? '—' 
    },
    { 
      key: 'condition',
      label: t('property.labels.features.condition') || 'Estado', 
      icon: <Sparkles className="w-3.5 h-3.5" />,
      getValue: p => p.property_condition || p.conservation_state || '—' 
    },
    { 
      key: 'orientation',
      label: t('property.form.fields.orientation') || 'Orientación', 
      icon: <Info className="w-3.5 h-3.5" />,
      getValue: p => safeJoin(p.orientation) || '—' 
    },
    { 
      key: 'energy',
      label: t('property.admin.form.fields.energy_rating') || 'Eficiencia', 
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      getValue: p => p.energy_rating || '—',
      isBetter: (v1, v2) => {
        if (!v1 || !v2 || v1 === '—' || v2 === '—') return false;
        const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const i1 = ratings.indexOf(v1.toUpperCase());
        const i2 = ratings.indexOf(v2.toUpperCase());
        if (i1 === -1) return false;
        if (i2 === -1) return true;
        return i1 < i2;
      }
    },
    { 
      key: 'elevator',
      label: t('property.labels.features.elevator') || 'Ascensor', 
      icon: <Layers className="w-3.5 h-3.5" />,
      getValue: p => p.has_elevator, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
    { 
      key: 'ac',
      label: 'Climatización', 
      icon: <Wind className="w-3.5 h-3.5" />,
      getValue: p => p.air_conditioning, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
    { 
      key: 'pool',
      label: 'Piscina', 
      icon: <Waves className="w-3.5 h-3.5" />,
      getValue: p => p.has_pool, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
    { 
      key: 'parking',
      label: 'Garaje', 
      icon: <Car className="w-3.5 h-3.5" />,
      getValue: p => p.has_parking, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
    { 
      key: 'storage',
      label: 'Trastero', 
      icon: <Warehouse className="w-3.5 h-3.5" />,
      getValue: p => p.has_storage, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
    { 
      key: 'garden',
      label: 'Jardín', 
      icon: <TreePine className="w-3.5 h-3.5" />,
      getValue: p => p.garden, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
    { 
      key: 'pets',
      label: 'Mascotas', 
      icon: <PawPrint className="w-3.5 h-3.5" />,
      getValue: p => p.pets_allowed, 
      format: v => v ? <CheckCircle2 className="w-4 h-4 text-[#C9A962]" /> : <Minus className="w-4 h-4 text-white/5" /> 
    },
  ];

  // Logic to find winners for each row
  const rowWinners = useMemo(() => {
    const winners: Record<string, number[]> = {};
    
    ROWS.forEach(row => {
      if (!row.isBetter) return;
      
      let bestIndices: number[] = [];
      let bestValue: any = null;

      validProperties.forEach((p, idx) => {
        try {
          const val = row.getValue(p);
          if (val === null || val === undefined || val === 0 || val === '—' || (typeof val === 'number' && isNaN(val))) return;

          if (bestValue === null) {
            bestValue = val;
            bestIndices = [idx];
          } else if (typeof row.isBetter === 'function' && row.isBetter(val, bestValue)) {
            bestValue = val;
            bestIndices = [idx];
          } else if (JSON.stringify(val) === JSON.stringify(bestValue)) {
            bestIndices.push(idx);
          }
        } catch (e) {
          console.error(`Error calculating winner for row ${row.key}:`, e);
        }
      });

      // Only count as winner if NOT all properties share the same best value
      if (bestIndices.length > 0 && bestIndices.length < validProperties.length) {
        winners[row.key] = bestIndices;
      }
    });

    return winners;
  }, [validProperties]);
  
  // Calculate total points for each property, weighted by row priority
  const propertyScores = useMemo(() => {
    const scores = validProperties.map(() => 0);
    Object.entries(rowWinners).forEach(([key, winners]) => {
      const row = ROWS.find(r => r.key === key);
      const weight = row?.priority || 1;
      winners.forEach(idx => {
        scores[idx] += weight;
      });
    });
    return scores;
  }, [rowWinners, validProperties]);

  const winningScore = Math.max(...propertyScores);
  const winnersCount = propertyScores.filter(s => s === winningScore && s > 0).length;
  const hasClearWinner = winningScore > 0 && winnersCount < validProperties.length;

  const filteredRows = useMemo(() => {
    if (!showOnlyDifferences) return ROWS;
    return ROWS.filter(row => {
      const values = validProperties.map(p => {
        try {
          return row.getValue(p);
        } catch(e) {
          return null;
        }
      });
      return !values.every(v => JSON.stringify(v) === JSON.stringify(values[0]));
    });
  }, [showOnlyDifferences, validProperties]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 40, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A] border-t border-[#C9A962]/40 shadow-[0_-30px_100px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col font-primary"
      >
        {/* Superior Header / Toolbar */}
        <div className="flex items-center justify-between px-6 md:px-14 py-5 border-b border-white/5 shrink-0 bg-black/60 backdrop-blur-3xl">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A962]/10 flex items-center justify-center border border-[#C9A962]/20">
                <GitCompare className="w-5 h-5 text-[#C9A962]" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-secondary text-lg text-[#FAF8F5] tracking-tight leading-none mb-1 uppercase">Comparador Premium</h2>
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">{t('property.comparator.comparing', { count: validProperties.length })}</span>
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/5 hidden md:block" />
            
            <div className="flex items-center gap-6">
               <button 
                onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all",
                  showOnlyDifferences 
                    ? "bg-[#C9A962] border-[#C9A962] text-[#0A0A0A]" 
                    : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
                )}
              >
                {showOnlyDifferences ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showOnlyDifferences ? 'Diferencias marcadas' : 'Ver solo diferencias'}
              </button>
              <button onClick={onClear} className="text-[9px] font-bold text-white/20 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-2">
                <X className="w-3 h-3" /> Limpiar todo
              </button>
            </div>
          </div>
          
          <button 
            onClick={onClear} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/40">
          <table className="w-full border-collapse table-fixed min-w-[800px]">
            <thead className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl">
              <tr>
                <th className="sticky left-0 z-50 bg-[#0F0F0F] text-left p-8 w-[220px] border-b border-white/10">
                  <div className="flex flex-col gap-2">
                    <span className="text-4xl font-secondary text-[#C9A962] font-black leading-none">{validProperties.length}</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Propiedades<br/>Seleccionadas</span>
                  </div>
                </th>
                {validProperties.map((p, idx) => (
                  <th key={p.id} className="p-6 border-b border-white/10 min-w-[280px]">
                    <div className="flex flex-col gap-4 relative group">
                      {/* Winner Badge */}
                      {hasClearWinner && propertyScores[idx] === winningScore && (
                        <motion.div 
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#C9A962] text-[#0A0A0A] px-5 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] shadow-[0_10px_30px_rgba(201,169,98,0.4)] z-50 flex items-center gap-2 whitespace-nowrap border border-white/20"
                        >
                          <TrendingUp className="w-3 h-3" /> LA MEJOR OPCIÓN
                        </motion.div>
                      )}
                      
                      {/* Remove Button */}
                      <button 
                        onClick={() => onRemove(p.id)}
                        className="absolute -top-2 -right-2 z-50 w-7 h-7 bg-red-500/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 hover:scale-100"
                        title="Quitar"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Image Preview */}
                      <div className={cn(
                        "aspect-[16/10] overflow-hidden rounded-sm border-2 transition-all duration-700",
                        hasClearWinner && propertyScores[idx] === winningScore 
                          ? "border-[#C9A962] shadow-[0_0_40px_rgba(201,169,98,0.15)]" 
                          : "border-white/5 opacity-80 group-hover:opacity-100"
                      )}>
                        <img 
                          src={getOptimizedImage(p.main_image || '', { width: 450, height: 300, format: 'webp' })} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        />
                      </div>

                      {/* Info Header */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <Link 
                          to={`/propiedades/${p.reference || p.id}`} 
                          className="font-secondary text-sm text-[#FAF8F5] line-clamp-1 hover:text-[#C9A962] transition-colors uppercase tracking-tight"
                        >
                          {isEn && p.title_en ? p.title_en : p.title}
                        </Link>
                        <div className="flex items-center justify-between gap-3">
                          {p.reference && <PropertyReference reference={p.reference} variant="minimal" />}
                          <div className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase",
                            propertyScores[idx] > 0 ? "bg-[#C9A962]/20 text-[#C9A962]" : "bg-white/5 text-white/20"
                          )}>
                            {propertyScores[idx]} Ptos
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRows.map((row) => {
                const winners = rowWinners[row.key] || [];
                return (
                  <tr key={row.key} className="group hover:bg-[#C9A962]/[0.03] transition-colors">
                    <td className="sticky left-0 z-30 bg-[#0F0F0F] p-5 border-r border-white/5">
                      <div className="flex items-center gap-3 text-white/40 group-hover:text-[#C9A962] transition-colors">
                        {row.icon}
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{row.label}</span>
                      </div>
                    </td>
                    {validProperties.map((p, pIdx) => {
                      let value;
                      try {
                        value = row.getValue(p);
                      } catch(e) {
                        value = '—';
                      }
                      const isWinner = winners.includes(pIdx);
                      return (
                        <td key={p.id} className={cn(
                          "p-5 transition-all duration-700 border-r border-white/5 last:border-r-0",
                          isWinner && "bg-[#C9A962]/5 shadow-inner"
                        )}>
                          <div className={cn(
                            "flex items-center gap-3",
                            isWinner ? "text-[#C9A962] font-black" : "text-white/60"
                          )}>
                             {row.format ? row.format(value, p) : (
                               <span className={cn(
                                 "text-xs",
                                 isWinner ? "text-sm scale-105" : ""
                               )}>
                                 {value !== null && value !== undefined && value !== '' && value !== '—' ? String(value) : '—'}
                               </span>
                             )}
                             {isWinner && (
                               <motion.div
                                 initial={{ scale: 0 }}
                                 animate={{ scale: 1 }}
                                 className="w-4 h-4 bg-[#C9A962] rounded-full flex items-center justify-center shrink-0"
                               >
                                 <CheckCircle2 className="w-3 h-3 text-[#0A0A0A]" />
                               </motion.div>
                             )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              
              {/* Intelligent Recommendation Footer Row */}
              <tr className="bg-[#C9A962]/5">
                <td className="sticky left-0 z-30 bg-[#0F0F0F] p-5 border-r border-white/5 border-t border-white/10">
                   <div className="flex items-center gap-3 text-[#C9A962]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">VERDICTO</span>
                  </div>
                </td>
                {validProperties.map((p, idx) => (
                  <td key={p.id} className="p-8 border-t border-white/10">
                    <div className="flex flex-col gap-4">
                      {hasClearWinner && propertyScores[idx] === winningScore ? (
                        <div className="flex flex-col gap-2">
                           <p className="text-[10px] text-[#C9A962] font-black uppercase tracking-widest italic">Opción recomendada</p>
                           <p className="text-[9px] text-white/50 leading-relaxed max-w-[200px]">
                            Basado en {propertyScores[idx]} puntos de ventaja competitiva en características clave.
                           </p>
                        </div>
                      ) : (
                        <div className="h-10" />
                      )}
                      <Link
                        to={`/propiedades/${p.reference || p.id}`}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-[#FAF8F5] text-[#0A0A0A] font-bold text-[9px] uppercase tracking-[0.2em] hover:bg-[#C9A962] transition-all rounded-sm shadow-xl"
                      >
                        Ver Propiedad <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Hint */}
        <div className="shrink-0 px-14 py-4 bg-black/60 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Info className="w-3.5 h-3.5 text-[#C9A962]" />
            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-medium">
              Análisis inteligente basado en valor de mercado, superficie y equipamiento premium.
            </p>
          </div>
          <p className="text-[9px] text-white/20 uppercase tracking-widest">Gelabert Homes &copy; 2026</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
