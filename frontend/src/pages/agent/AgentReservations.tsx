import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useProperties } from '../../hooks/useProperties';
import { useAuth } from '../../hooks/useAuth.tsx';
import { usePropertyContracts } from '../../hooks/useContracts';
import type { Property } from '../../types/property';
import { COMMERCIAL_STATUS_COLORS, COMMERCIAL_STATUS_LABELS } from '../../types/property';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp, PlusCircle, Users, RefreshCw, Calendar, Filter } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

interface PeriodFilter {
  year: number | 'all';
  quarter: number | 'all';
  month: number | 'all';
}

function matchPeriod(dateStr: string | null | undefined, filter: PeriodFilter): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  if (filter.year !== 'all' && date.getFullYear() !== filter.year) return false;
  const monthNum = date.getMonth() + 1;
  if (filter.quarter !== 'all') {
    const qMonths: Record<number, number[]> = { 1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12] };
    if (!qMonths[filter.quarter].includes(monthNum)) return false;
  }
  if (filter.month !== 'all' && monthNum !== filter.month) return false;
  return true;
}

const PropertyRow = ({ property, periodFilter }: { property: Property; periodFilter: PeriodFilter }) => {
  const [expanded, setExpanded] = useState(false);
  const { contracts, loading: loadingContracts } = usePropertyContracts(property.id);

  const currentContracts = contracts.filter(
    c => c.start_date <= today && c.end_date >= today && c.status === 'active'
  );
  const allUpcomingContracts = contracts
    .filter(c => c.start_date > today && c.status === 'active')
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const upcomingContracts = (periodFilter.year === 'all' && periodFilter.quarter === 'all' && periodFilter.month === 'all')
    ? allUpcomingContracts
    : allUpcomingContracts.filter(c => matchPeriod(c.start_date, periodFilter));
  const past = contracts.filter(c => c.end_date < today);

  // Use the automated commercial_status from database
  const derivedStatus = property.commercial_status || 'disponible';

  return (
    <div className="border-b border-[#1F1F1F] last:border-b-0">
      {/* Summary row */}
      <div
        className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 px-5 py-4 items-center hover:bg-[#0F0F0F] transition-colors min-w-[900px] cursor-pointer"
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
            <div className="flex items-center gap-2">
              <p className="font-primary text-[#FAF8F5] text-sm font-bold truncate">{property.title}</p>
              {property.reference && (
                <span className="font-primary text-[10px] text-[#C9A962] bg-[#C9A962]/10 px-1 border border-[#C9A962]/20">
                  {property.reference}
                </span>
              )}
            </div>
            <p className="font-primary text-[#444444] text-xs">{property.city || property.zone || '—'}</p>
          </div>
        </div>

        {/* Commercial status */}
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm w-fit ${COMMERCIAL_STATUS_COLORS[derivedStatus]}`}>
            {COMMERCIAL_STATUS_LABELS[derivedStatus]}
          </span>
          {property.is_room_rental && (
            <span className="text-[9px] text-[#C9A962] uppercase tracking-tighter font-bold">Por habitaciones</span>
          )}
        </div>

        {/* Current occupant */}
        <div>
          {loadingContracts ? (
            <div className="w-4 h-4 border border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          ) : currentContracts.length > 0 ? (
            <div className="flex flex-col gap-1">
              {currentContracts.map(current => (
                <Link
                  key={current.id}
                  to={`/agente/inquilinos/${current.tenant_id}`}
                  onClick={e => e.stopPropagation()}
                  className="font-primary text-sm text-[#C9A962] hover:underline truncate flex items-center gap-2"
                >
                  <span className="truncate">{current.tenant?.first_name} {current.tenant?.last_name}</span>
                  {current.room_id && (
                    <span className="text-[10px] text-[#555] bg-[#111] px-1 border border-[#222] shrink-0">
                      H{current.room_id.slice(-2)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <span className="text-[#444444] text-xs italic">Libre</span>
          )}
        </div>

        {/* Next booking */}
        <div>
          {!loadingContracts && upcomingContracts.length > 0 ? (
            <div className="flex flex-col gap-1">
              {upcomingContracts.slice(0, 3).map(upcoming => (
                <Link
                  key={upcoming.id}
                  to={`/agente/inquilinos/${upcoming.tenant_id}`}
                  onClick={e => e.stopPropagation()}
                  className="font-primary text-sm text-[#888888] hover:text-[#FAF8F5] truncate flex items-center gap-2"
                >
                  <span className="truncate">{upcoming.tenant?.first_name} {upcoming.tenant?.last_name}</span>
                  {upcoming.room_id && (
                    <span className="text-[10px] text-[#444] bg-[#050505] px-1 border border-[#111] shrink-0">
                      H{upcoming.room_id.slice(-2)}
                    </span>
                  )}
                  <span className="text-[#444444] text-[10px] shrink-0">
                    ({new Date(upcoming.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })})
                  </span>
                </Link>
              ))}
              {upcomingContracts.length > 3 && (
                <span className="text-[#444444] text-xs italic text-left">
                  +{upcomingContracts.length - 3} más
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#444444] text-xs italic">—</span>
          )}
        </div>

        {/* Expand chevron */}
        <button className="text-[#444444] hover:text-[#FAF8F5] transition-colors p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded history & Room breakdown */}
      {expanded && (
        <div className="bg-[#070707] border-t border-[#1F1F1F] px-5 pb-6 pt-4 min-w-[900px]">
          {/* Room breakdown if applicable */}
          {property.is_room_rental && property.rooms && property.rooms.length > 0 && (
            <div className="mb-8">
              <h4 className="font-primary text-[11px] text-[#FAF8F5] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-[#C9A962]" />
                Estado de Habitaciones
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {property.rooms.map(room => {
                  const roomContract = currentContracts.find(c => c.room_id === room.id);
                  const roomUpcoming = upcomingContracts.find(c => c.room_id === room.id);
                  
                  let roomStatus: string = room.status || 'disponible';
                  if (roomStatus === 'disponible') {
                    if (roomContract) roomStatus = 'alquilada';
                    else if (roomUpcoming) roomStatus = 'reservada';
                  } else {
                    if (roomStatus === 'alquilado') roomStatus = 'alquilada';
                    if (roomStatus === 'reservado') roomStatus = 'reservada';
                  }

                  return (
                    <div key={room.id} className="bg-[#0D0D0D] border border-[#1F1F1F] p-3 rounded-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-primary text-xs font-bold text-[#FAF8F5]">{room.name}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                          roomStatus === 'alquilada' ? 'bg-[#A78BFA] text-[#0A0A0A]' : 
                          roomStatus === 'reservada' ? 'bg-[#FB923C] text-[#0A0A0A]' : 
                          'bg-[#4ADE80] text-[#0A0A0A]'
                        }`}>
                          {roomStatus}
                        </span>
                      </div>
                      
                      {roomContract ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#666] uppercase tracking-tighter">Ocupada por:</span>
                          <Link to={`/agente/inquilinos/${roomContract.tenant_id}`} className="text-xs text-[#C9A962] hover:underline">
                            {roomContract.tenant?.first_name} {roomContract.tenant?.last_name}
                          </Link>
                        </div>
                      ) : roomUpcoming ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#666] uppercase tracking-tighter">Próxima reserva:</span>
                          <Link to={`/agente/inquilinos/${roomUpcoming.tenant_id}`} className="text-xs text-[#888]">
                            {roomUpcoming.tenant?.first_name} {roomUpcoming.tenant?.last_name} ({new Date(roomUpcoming.start_date).toLocaleDateString()})
                          </Link>
                        </div>
                      ) : (
                        <span className="text-xs text-[#444] italic">Sin ocupación próxima</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3 border-b border-[#1F1F1F] pb-2">
            <p className="font-primary text-[10px] text-[#444444] uppercase tracking-wider">
              Historial de contratos ({contracts.length})
            </p>
            <Link
              to={`/agente/contratos/nuevo?property_id=${property.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A962]/10 border border-[#C9A962]/30 text-[#C9A962] font-primary text-xs hover:bg-[#C9A962]/20 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <PlusCircle className="w-3 h-3" />
              Nuevo contrato
            </Link>
          </div>

          {loadingContracts ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contracts.length === 0 ? (
            <p className="text-[#444444] text-xs italic py-4 text-center">Sin contratos registrados.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {contracts.map(c => {
                const isCurrent = c.start_date <= today && c.end_date >= today && c.status === 'active';
                const isFuture  = c.start_date > today && c.status === 'active';
                return (
                  <div key={c.id} className={`flex items-center gap-4 px-3 py-2.5 border transition-colors ${isCurrent ? 'border-[#C9A962]/30 bg-[#C9A962]/5' : isFuture ? 'border-blue-500/20 bg-blue-500/5' : 'border-[#1F1F1F]'}`}>
                    <div className="flex flex-col gap-0.5 shrink-0 w-16">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-sm text-center ${isCurrent ? 'bg-[#4ADE80] text-[#0A0A0A]' : isFuture ? 'bg-[#60A5FA] text-[#0A0A0A]' : 'bg-[#333333] text-[#888888]'}`}>
                        {isCurrent ? 'Activo' : isFuture ? 'Futuro' : 'Pasado'}
                      </span>
                      {c.room_id && (
                        <span className="text-[8px] text-[#C9A962] text-center font-bold tracking-tighter uppercase">Hab. {c.room_id.slice(-4)}</span>
                      )}
                    </div>
                    <Link to={`/agente/inquilinos/${c.tenant_id}`} className="font-primary text-sm text-[#FAF8F5] hover:text-[#C9A962] transition-colors flex-1 truncate">
                      {c.tenant?.first_name} {c.tenant?.last_name}
                    </Link>
                    <span className="font-primary text-xs text-[#666666] shrink-0">
                      {new Date(c.start_date).toLocaleDateString('es-ES')} — {new Date(c.end_date).toLocaleDateString('es-ES')}
                    </span>
                    <span className="font-secondary text-xs text-[#C9A962] shrink-0 w-20 text-right">€{c.monthly_rent}/mes</span>
                    <Link
                      to={`/agente/contratos/${c.id}/editar`}
                      onClick={e => e.stopPropagation()}
                      className="text-[#444444] hover:text-[#C9A962] font-primary text-xs shrink-0 px-2"
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

export const AgentReservations = () => {
  const { user } = useAuth();
  const { properties, loading, refetch } = useProperties(undefined, true, user?.id);
  const [search, setSearch] = useState('');

  // Time filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const periodFilter: PeriodFilter = { year: selectedYear, quarter: selectedQuarter, month: selectedMonth };

  const rental = properties.filter(p =>
    (p.operation === 'alquiler') &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.reference?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  const [syncing, setSyncing] = useState(false);

  const handleSyncStatuses = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc('refresh_all_property_commercial_statuses');
      if (error) throw error;
      toast.success(`Sincronización completada: ${data.updated} propiedades actualizadas`);
      refetch();
    } catch (err) {
      console.error('Error syncing statuses:', err);
      toast.error('Error al sincronizar los estados');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0D0D0D] p-8 rounded-sm border border-white/5 shadow-2xl">
        <div>
          <h1 className="font-secondary text-4xl text-[#FAF8F5] mb-2">Reservas y Disponibilidad</h1>
          <p className="text-white/40 font-primary text-sm tracking-wide">
            Gestión automática de estados comerciales según contratos activos y futuros.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSyncStatuses}
            disabled={syncing}
            className={cn(
              "flex items-center gap-2 px-6 py-3 bg-white/5 border border-[#C9A962]/30 text-[#C9A962] font-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#C9A962] hover:text-black transition-all",
              syncing && "opacity-50 cursor-not-allowed"
            )}
          >
            {syncing ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sincronizar Estados
          </button>
          <div className="flex items-center gap-3 px-6 py-3 bg-[#C9A962] text-[#0A0A0A] font-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm">
            <Calendar className="w-4 h-4" />
            {properties.length} Propiedades
          </div>
        </div>
      </div>

      {/* Search + Period Filters */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-4 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Buscar propiedad por nombre o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
        />
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[#C9A962]">
            <Filter className="w-4 h-4" />
            <span className="font-primary text-xs uppercase tracking-wider font-bold">Filtrar Reservas por Periodo:</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-primary text-xs text-[#666]">Año:</span>
            <select value={selectedYear} onChange={e => { const v = e.target.value; setSelectedYear(v === 'all' ? 'all' : parseInt(v)); }} className="h-8 bg-[#111] border border-[#1F1F1F] px-2 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962] cursor-pointer">
              <option value="all">Todos</option>
              {Array.from({ length: 4 }, (_, i) => currentYear - i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-primary text-xs text-[#666]">Trimestre:</span>
            <select value={selectedQuarter} onChange={e => { const v = e.target.value; setSelectedQuarter(v === 'all' ? 'all' : parseInt(v)); if (v !== 'all') setSelectedMonth('all'); }} className="h-8 bg-[#111] border border-[#1F1F1F] px-2 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962] cursor-pointer">
              <option value="all">Todos</option>
              <option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-primary text-xs text-[#666]">Mes:</span>
            <select value={selectedMonth} onChange={e => { const v = e.target.value; setSelectedMonth(v === 'all' ? 'all' : parseInt(v)); if (v !== 'all') setSelectedQuarter('all'); }} className="h-8 bg-[#111] border border-[#1F1F1F] px-2 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962] cursor-pointer">
              <option value="all">Todos</option>
              {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((n,i) => <option key={i} value={i+1}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-primary text-[#666666] uppercase tracking-widest font-black">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4ADE80]" />Activo ahora</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#60A5FA]" />Futuro</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#333333]" />Pasado</span>
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
          <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 px-5 py-3 border-b border-[#1F1F1F] min-w-[900px]">
            {['Propiedad', 'Estado', 'Inquilino actual', 'Próxima reserva', ''].map((h, i) => (
              <span key={i} className="font-primary text-[10px] text-[#444444] uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {rental.map(p => <PropertyRow key={p.id} property={p} periodFilter={periodFilter} />)}
        </div>
      )}
    </div>
  );
};
