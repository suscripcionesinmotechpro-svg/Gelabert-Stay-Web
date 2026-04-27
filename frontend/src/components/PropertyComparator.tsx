import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { getOptimizedImage } from '../utils/images';

export const PropertyComparator = ({ properties = [], onRemove, onClear }: any) => {
  const { t, i18n } = useTranslation();
  
  if (!properties || properties.length === 0) return null;

  const validProperties = properties.filter((p: any) => p && p.id);
  if (validProperties.length === 0) return null;

  // Single property bar
  if (validProperties.length === 1) {
    const p = validProperties[0];
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-black text-white p-4 rounded-lg border border-gold flex items-center gap-4">
        <span>{p.title} - Selecciona otra para comparar</span>
        <button onClick={onClear} className="text-white/50 hover:text-white">✕</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[999] bg-black text-white max-h-[80vh] overflow-auto border-t-2 border-[#C9A962] flex flex-col font-sans">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#111]">
        <h2 className="text-xl font-bold text-[#C9A962] uppercase tracking-wider">Comparador</h2>
        <button onClick={onClear} className="bg-red-600 px-4 py-1 rounded text-xs font-bold">LIMPIAR TODO</button>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="p-4 border-b border-white/10 bg-[#1a1a1a] w-[150px]">Características</th>
              {validProperties.map((p: any) => (
                <th key={p.id} className="p-4 border-b border-white/10 min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    <img 
                      src={getOptimizedImage(p.main_image || '', { width: 300, height: 200 })} 
                      alt="" 
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold line-clamp-1 uppercase">{p.title}</span>
                      <button onClick={() => onRemove(p.id)} className="text-red-500 text-lg">✕</button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 border-b border-white/5 font-bold text-xs uppercase text-white/40">Precio</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 border-b border-white/5 text-[#C9A962] font-bold">
                  {p.price ? `${p.price.toLocaleString('es-ES')} €` : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-white/5 font-bold text-xs uppercase text-white/40">Ubicación</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 border-b border-white/5 text-sm">
                  {p.zone || p.city || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-white/5 font-bold text-xs uppercase text-white/40">m²</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 border-b border-white/5 text-sm">
                  {p.area_m2 || '—'} m²
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-white/5 font-bold text-xs uppercase text-white/40">Habitaciones</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 border-b border-white/5 text-sm">
                  {p.bedrooms || '0'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 border-b border-white/5 font-bold text-xs uppercase text-white/40">Baños</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4 border-b border-white/5 text-sm">
                  {p.bathrooms || '0'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-bold text-xs uppercase text-white/40">Acción</td>
              {validProperties.map((p: any) => (
                <td key={p.id} className="p-4">
                  <Link 
                    to={`/propiedades/${p.reference || p.id}`}
                    className="block text-center py-2 bg-[#C9A962] text-black font-bold text-[10px] rounded hover:bg-white transition-colors uppercase tracking-widest"
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
