import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { getOptimizedImage } from '../utils/images';

export const PropertyComparator = ({ properties = [], onRemove, onClear }: any) => {
  const { t } = useTranslation();
  
  if (!properties || properties.length === 0) return null;

  const validProperties = properties.filter((p: any) => p && p.id);
  if (validProperties.length === 0) return null;

  // Single property bar
  if (validProperties.length === 1) {
    const p = validProperties[0];
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-black text-white p-4 rounded-lg border border-[#C9A962] flex items-center gap-4 shadow-2xl">
        <span className="text-xs uppercase font-bold tracking-wider">{p.title} - Selecciona otra para comparar</span>
        <button onClick={onClear} className="text-white/50 hover:text-white text-lg">✕</button>
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-[999] bg-[#0A0A0A] text-white max-h-[85vh] overflow-hidden border-t-2 border-[#C9A962] flex flex-col font-sans shadow-[0_-20px_50px_rgba(0,0,0,0.5)]")}>
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 bg-[#C9A962] rounded-full animate-pulse" />
           <h2 className="text-sm font-bold text-[#C9A962] uppercase tracking-[0.2em]">{t('property.comparator.comparing', { count: validProperties.length })}</h2>
        </div>
        <button onClick={onClear} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded text-[10px] font-black tracking-widest transition-all">LIMPIAR TODO</button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="p-6 border-b border-white/10 bg-[#0F0F0F] w-[180px] sticky left-0 z-10">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Características</span>
              </th>
              {validProperties.map((p: any) => (
                <th key={p.id} className="p-4 border-b border-white/10 min-w-[240px] bg-[#0A0A0A]">
                  <div className="flex flex-col gap-3 relative group">
                    <img 
                      src={getOptimizedImage(p.main_image || '', { width: 400, height: 250 })} 
                      alt="" 
                      className="w-full aspect-video object-cover rounded border border-white/5"
                    />
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold line-clamp-2 uppercase tracking-tight flex-1">{p.title}</span>
                      <button onClick={() => onRemove(p.id)} className="w-6 h-6 bg-white/5 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors">
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                    <span className="text-[9px] text-[#C9A962] font-black">{p.reference || 'REF'}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/[0.02]">
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10 font-bold text-[9px] uppercase text-white/40 tracking-widest">Precio</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 text-sm text-[#C9A962] font-bold">
                  {p.price ? `${p.price.toLocaleString('es-ES')} €` : '—'}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10 font-bold text-[9px] uppercase text-white/40 tracking-widest">Ubicación</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 text-xs text-white/70">
                  {p.zone || p.city || '—'}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10 font-bold text-[9px] uppercase text-white/40 tracking-widest">Superficie</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 text-xs text-white/70">
                  {p.area_m2 || '—'} m²
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10 font-bold text-[9px] uppercase text-white/40 tracking-widest">Habitaciones</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 text-xs text-white/70">
                  {p.bedrooms || '0'}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-white/[0.02]">
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10 font-bold text-[9px] uppercase text-white/40 tracking-widest">Baños</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 text-xs text-white/70">
                  {p.bathrooms || '0'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 bg-[#0F0F0F] sticky left-0 z-10" />
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-6">
                  <Link 
                    to={`/propiedades/${p.reference || p.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#C9A962] transition-all rounded shadow-lg"
                  >
                    Ver Ficha
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
