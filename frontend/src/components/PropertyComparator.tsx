import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Property } from '../types/property';
import { cn } from '../lib/utils';
import { getOptimizedImage } from '../utils/images';

// Move logic outside to avoid recreation and potential closure issues
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
  getValue: (p: Property) => any;
  format?: (v: any, p: Property) => React.ReactNode;
  isBetter?: (v1: any, v2: any) => boolean;
  priority?: number;
}

const ROWS_CONFIG: FeatureRow[] = [
  { 
    key: 'price',
    label: 'Precio', 
    getValue: p => p.price ?? 0, 
    format: v => <span className="font-bold text-[#C9A962]">{v > 0 ? formatPrice(v) : '—'}</span>,
    isBetter: (v1, v2) => v1 > 0 && v2 > 0 ? v1 < v2 : v1 > v2,
    priority: 10
  },
  { 
    key: 'location',
    label: 'Zona', 
    getValue: p => p.zone || p.city || '—',
  },
  { 
    key: 'area',
    label: 'Superficie', 
    getValue: p => p.area_m2 ?? 0, 
    format: v => v ? `${v} m²` : '—',
    isBetter: (v1, v2) => v1 > v2,
    priority: 8
  },
  { 
    key: 'bedrooms',
    label: 'Dormitorios', 
    getValue: p => p.bedrooms ?? 0,
    isBetter: (v1, v2) => v1 > v2,
    priority: 7
  },
  { 
    key: 'bathrooms',
    label: 'Baños', 
    getValue: p => p.bathrooms ?? 0,
    isBetter: (v1, v2) => v1 > v2,
    priority: 6
  },
  { 
    key: 'floor',
    label: 'Planta', 
    getValue: p => p.floor || '—' 
  },
  { 
    key: 'elevator',
    label: 'Ascensor', 
    getValue: p => !!p.has_elevator, 
    format: v => v ? 'SÍ' : 'NO' 
  },
];

export const PropertyComparator = ({ properties = [], onRemove, onClear }: any) => {
  const { t } = useTranslation();
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [hasError] = useState(false);

  // Ultimate Catch-All
  const validProperties = useMemo(() => {
    try {
      if (!Array.isArray(properties)) return [];
      return properties.filter(p => p && typeof p === 'object' && p.id);
    } catch (e) {
      console.error('Comparator: Error filtering properties', e);
      return [];
    }
  }, [properties]);

  const rowWinners = useMemo(() => {
    try {
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
    } catch (e) {
      console.error('Comparator: Error calculating winners', e);
      return {};
    }
  }, [validProperties]);

  const propertyScores = useMemo(() => {
    try {
      const s = validProperties.map(() => 0);
      Object.entries(rowWinners).forEach(([key, wins]) => {
        const row = ROWS_CONFIG.find(r => r.key === key);
        const w = row?.priority || 1;
        wins.forEach(i => { if (s[i] !== undefined) s[i] += w; });
      });
      return s;
    } catch (e) {
      return validProperties.map(() => 0);
    }
  }, [rowWinners, validProperties]);

  if (hasError) return <div className="fixed bottom-0 z-[999] bg-red-900 text-white p-4">Error en Comparador</div>;
  if (validProperties.length === 0) return null;

  const winningScore = Math.max(...propertyScores, 0);
  const isBestOption = (idx: number) => winningScore > 0 && propertyScores[idx] === winningScore && propertyScores.filter(s => s === winningScore).length === 1;

  const filteredRows = showOnlyDifferences 
    ? ROWS_CONFIG.filter(row => {
        const vals = validProperties.map(p => row.getValue(p));
        return !vals.every(v => JSON.stringify(v) === JSON.stringify(vals[0]));
      })
    : ROWS_CONFIG;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-[#0A0A0A] border-t-2 border-[#C9A962] flex flex-col shadow-2xl max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-[#C9A962] font-bold uppercase tracking-widest text-[10px]">
            {t('property.comparator.comparing', { count: validProperties.length })}
          </span>
          <button 
            onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
            className={cn(
              "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all",
              showOnlyDifferences ? "bg-[#C9A962] text-black" : "bg-white/5 text-white/40 hover:bg-white/10"
            )}
          >
            {showOnlyDifferences ? 'Ver todo' : 'Diferencias'}
          </button>
        </div>
        <button onClick={onClear} className="text-white/20 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors">✕ LIMPIAR</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#0A0A0A]">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-4 bg-[#0F0F0F] border-b border-white/10 w-[160px] sticky left-0 z-10">
                <span className="text-[9px] font-black text-white/30 uppercase">Atributos</span>
              </th>
              {validProperties.map((p, idx) => (
                <th key={p.id} className="p-4 border-b border-white/10 min-w-[220px]">
                  <div className="flex flex-col gap-2 relative group">
                    {isBestOption(idx) && (
                      <div className="bg-[#C9A962] text-black text-[8px] font-black px-2 py-0.5 rounded absolute -top-8 left-0 uppercase">RECOMENDADA</div>
                    )}
                    <img 
                      src={getOptimizedImage(p.main_image || '', { width: 300, height: 200 })} 
                      alt="" 
                      className={cn("w-full h-32 object-cover rounded border", isBestOption(idx) ? "border-[#C9A962]" : "border-white/5")}
                    />
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold line-clamp-1 uppercase text-white/90">{p.title}</span>
                      <button onClick={() => onRemove(p.id)} className="text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRows.map(row => (
              <tr key={row.key} className="hover:bg-white/[0.02]">
                <td className="p-4 bg-[#0F0F0F] border-r border-white/5 sticky left-0 z-10 text-[9px] font-bold uppercase text-white/40">{row.label}</td>
                {validProperties.map((p, pIdx) => {
                  const val = row.getValue(p);
                  const isWinner = rowWinners[row.key]?.includes(pIdx);
                  return (
                    <td key={p.id} className={cn("p-4 text-xs transition-colors", isWinner && "text-[#C9A962] bg-[#C9A962]/5 font-bold")}>
                      {row.format ? row.format(val, p) : (val?.toString() || '—')}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10" />
              {validProperties.map((p, idx) => (
                <td key={p.id} className="p-4">
                  <Link 
                    to={`/propiedades/${p.reference || p.id}`}
                    className={cn(
                      "block text-center py-2 text-[9px] font-black uppercase tracking-widest rounded transition-all",
                      isBestOption(idx) ? "bg-[#C9A962] text-black" : "bg-white text-black hover:bg-[#C9A962]"
                    )}
                  >
                    Ver Propiedad
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
