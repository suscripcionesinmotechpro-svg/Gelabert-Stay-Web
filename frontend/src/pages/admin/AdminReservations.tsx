import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProperties } from '../../hooks/useProperties';
import { usePropertyContracts } from '../../hooks/useContracts';
import type { Property } from '../../types/property';
import { COMMERCIAL_STATUS_COLORS, COMMERCIAL_STATUS_LABELS } from '../../types/property';
import { ChevronDown, ChevronUp, PlusCircle, Users } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

const PropertyRow = ({ property }: { property: Property }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { contracts, loading } = usePropertyContracts(property.id);

  const current = contracts.find(
    c => c.start_date <= today && c.end_date >= today
  );
  const upcoming = contracts
    .filter(c => c.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  const past = contracts.filter(c => c.end_date < today);

  return (
    <div className="border-b border-[#1F1F1F] last:border-b-0">
      {/* Summary row */}
      <div
        className="grid grid-cols-[2fr_1fr_2fr_2fr_auto] gap-4 px-5 py-4 items-center hover:bg-[#0F0F0F] transition-colors min-w-[700px] cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Property */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-[#1A1A1A] shrink-0 overflow-hidden border border-[#1F1F1F]">
            {property.main_image ? (
              <img src={property.main_image} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#333333]">
                <Users className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-primary text-[#FAF8F5] text-sm font-bold truncate">{property.title}</p>
            <p className="font-primary text-[#444444] text-xs">{property.city || property.zone || '—'}</p>
          </div>
        </div>

        {/* Commercial status */}
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm w-fit ${COMMERCIAL_STATUS_COLORS[property.commercial_status]}`}>
          {t(COMMERCIAL_STATUS_LABELS[property.commercial_status])}
        </span>

        {/* Current occupant */}
        <div>
          {loading ? (
            <div className="w-4 h-4 border border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          ) : current ? (
            <Link
              to={`/admin/inquilinos/${current.tenant_id}`}
              onClick={e => e.stopPropagation()}
              className="font-primary text-sm text-[#C9A962] hover:underline"
            >
              {current.tenant?.first_name} {current.tenant?.last_name}
              <span className="text-[#444444] text-xs ml-2">
                hasta {new Date(current.end_date).toLocaleDateString('es-ES')}
              </span>
            </Link>
          ) : (
            <span className="text-[#444444] text-xs italic">Libre</span>
          )}
        </div>

        {/* Next booking */}
        <div>
          {!loading && upcoming ? (
            <Link
              to={`/admin/inquilinos/${upcoming.tenant_id}`}
              onClick={e => e.stopPropagation()}
              className="font-primary text-sm text-[#888888] hover:text-[#FAF8F5]"
            >
              {upcoming.tenant?.first_name} {upcoming.tenant?.last_name}
              <span className="text-[#444444] text-xs ml-2">
                desde {new Date(upcoming.start_date).toLocaleDateString('es-ES')}
              </span>
            </Link>
          ) : (
            <span className="text-[#444444] text-xs italic">—</span>
          )}
        </div>

        {/* Expand chevron */}
        <button className="text-[#444444] hover:text-[#FAF8F5] transition-colors p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded history */}
      {expanded && (
        <div className="bg-[#070707] border-t border-[#1F1F1F] px-5 pb-4 pt-2 min-w-[700px]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-primary text-[10px] text-[#444444] uppercase tracking-wider">
              Historial completo ({contracts.length} contratos)
            </p>
            <Link
              to={`/admin/contratos/nuevo?property_id=${property.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] font-primary text-xs hover:bg-[#C9A962]/20 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <PlusCircle className="w-3 h-3" />
              Nuevo contrato
            </Link>
          </div>

          {loading ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contracts.length === 0 ? (
            <p className="text-[#444444] text-xs italic py-4 text-center">Sin contratos registrados.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {contracts.map(c => {
                const isCurrent = c.start_date <= today && c.end_date >= today;
                const isFuture  = c.start_date > today;
                return (
                  <div key={c.id} className={`flex items-center gap-4 px-3 py-2.5 border transition-colors ${isCurrent ? 'border-[#C9A962]/30 bg-[#C9A962]/5' : isFuture ? 'border-blue-500/20 bg-blue-500/5' : 'border-[#1F1F1F]'}`}>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 shrink-0 ${isCurrent ? 'bg-green-500/15 text-green-400' : isFuture ? 'bg-blue-500/15 text-blue-400' : 'bg-gray-500/10 text-gray-500'}`}>
                      {isCurrent ? 'Activo' : isFuture ? 'Futuro' : 'Pasado'}
                    </span>
                    <Link to={`/admin/inquilinos/${c.tenant_id}`} className="font-primary text-sm text-[#FAF8F5] hover:text-[#C9A962] transition-colors flex-1 truncate">
                      {c.tenant?.first_name} {c.tenant?.last_name}
                    </Link>
                    <span className="font-primary text-xs text-[#666666] shrink-0">
                      {new Date(c.start_date).toLocaleDateString('es-ES')} — {new Date(c.end_date).toLocaleDateString('es-ES')}
                    </span>
                    <span className="font-secondary text-xs text-[#C9A962] shrink-0">€{c.monthly_rent}/mes</span>
                    <Link
                      to={`/admin/contratos/${c.id}/editar`}
                      onClick={e => e.stopPropagation()}
                      className="text-[#444444] hover:text-[#C9A962] font-primary text-xs shrink-0"
                    >
                      Editar
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {past.length > 0 && (
            <p className="font-primary text-[10px] text-[#333333] mt-3 text-right">
              {past.length} contrato{past.length > 1 ? 's' : ''} anterior{past.length > 1 ? 'es' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminReservations = () => {
  const { properties, loading } = useProperties(undefined, true);
  const [search, setSearch] = useState('');

  const rental = properties.filter(p =>
    (p.operation === 'alquiler') &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Reservas y Ocupación</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">
            {loading ? 'Cargando...' : `${rental.length} propiedad${rental.length !== 1 ? 'es' : ''} en alquiler`}
          </p>
        </div>
        <Link
          to="/admin/contratos/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Contrato
        </Link>
      </div>

      {/* Search */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-4">
        <input
          type="text"
          placeholder="Buscar propiedad por nombre o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-primary text-[#444444] uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-green-400/60" />Activo ahora</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-400/60" />Futuro</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-gray-500/60" />Pasado</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rental.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] border border-[#1F1F1F] gap-4">
          <p className="font-primary text-[#666666] text-sm">No hay propiedades de alquiler.</p>
        </div>
      ) : (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_2fr_2fr_auto] gap-4 px-5 py-3 border-b border-[#1F1F1F] min-w-[700px]">
            {['Propiedad', 'Estado', 'Inquilino actual', 'Próxima reserva', ''].map((h, i) => (
              <span key={i} className="font-primary text-[10px] text-[#444444] uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {rental.map(p => <PropertyRow key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
};
