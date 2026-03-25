import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTenants } from '../../hooks/useTenants';
import { useContracts } from '../../hooks/useContracts';
import { Search, PlusCircle, Users, AlertTriangle, ChevronRight, Phone, Mail, Eye } from 'lucide-react';
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS, daysUntilExpiry } from '../../types/tenant';
import type { Contract } from '../../types/tenant';

export const AdminTenantsList = () => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce: only trigger API search 350ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(inputValue), 350);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { tenants, loading } = useTenants(debouncedSearch);
  const { contracts } = useContracts();

  // Map tenant_id → active contract
  const contractByTenant = contracts.reduce<Record<string, Contract>>((acc, c) => {
    if (!acc[c.tenant_id] || c.status === 'active') acc[c.tenant_id] = c;
    return acc;
  }, {});

  const getExpiryBadge = (c?: Contract) => {
    if (!c || c.status !== 'active') return null;
    const days = daysUntilExpiry(c.end_date);
    if (days <= 30) return { label: `Vence en ${days}d`, cls: 'text-red-400 bg-red-400/10 border-red-400/30' };
    if (days <= 60) return { label: `Vence en ${days}d`, cls: 'text-orange-400 bg-orange-400/10 border-orange-400/30' };
    return null;
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Inquilinos</h1>
          <p className="font-primary text-[#666] text-sm mt-1">Gestión de inquilinos y contratos de alquiler</p>
        </div>
        <Link
          to="/admin/inquilinos/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Inquilino
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Buscar por nombre, DNI o email…"
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] pl-10 pr-4 py-3 font-primary text-sm focus:outline-none focus:border-[#C9A962] transition-colors placeholder-[#444]"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#444]">
            <Users className="w-10 h-10" />
            <p className="font-primary text-sm">
              {debouncedSearch ? 'No se encontraron inquilinos' : 'Aún no hay inquilinos registrados'}
            </p>
            {!debouncedSearch && (
              <Link to="/admin/inquilinos/nuevo" className="text-[#C9A962] text-sm hover:underline">
                Añadir el primero
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1A]">
            {tenants.map(t => {
              const contract = contractByTenant[t.id];
              const expiry = getExpiryBadge(contract);

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#111] transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-primary font-bold text-sm text-[#0A0A0A] flex-shrink-0"
                    style={{ backgroundColor: t.avatar_color || '#C9A962' }}
                  >
                    {t.first_name[0]}{t.last_name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-primary font-semibold text-[#FAF8F5] text-sm truncate">
                        {t.first_name} {t.last_name}
                      </span>
                      {t.dni && (
                        <span className="font-primary text-[10px] text-[#555] uppercase tracking-wider">
                          DNI: {t.dni}
                        </span>
                      )}
                      {expiry && (
                        <span className={`font-primary text-[10px] px-2 py-0.5 border rounded-full flex items-center gap-1 ${expiry.cls}`}>
                          <AlertTriangle className="w-3 h-3" /> {expiry.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {t.email && (
                        <span className="flex items-center gap-1 font-primary text-[#555] text-xs">
                          <Mail className="w-3 h-3" /> {t.email}
                        </span>
                      )}
                      {t.phone && (
                        <span className="flex items-center gap-1 font-primary text-[#555] text-xs">
                          <Phone className="w-3 h-3" /> {t.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contract badge */}
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    {contract ? (
                      <>
                        <span className={`font-primary text-[10px] px-2 py-0.5 border rounded-full ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </span>
                        <div className="flex flex-col items-end">
                          {contract.property_id ? (
                            <Link to={`/propiedades/${contract.property_id}`} target="_blank" rel="noopener noreferrer" className="font-primary text-sm text-[#C9A962] hover:underline" onClick={(e) => e.stopPropagation()}>
                              {contract.property_label || 'Piso activo'}
                            </Link>
                          ) : (
                            <span className="font-primary text-sm text-[#FAF8F5]">{contract.property_label || 'Piso activo'}</span>
                          )}
                          <span className="font-primary text-xs text-[#666]">
                            Hasta {new Date(contract.end_date).toLocaleDateString('es-ES')}
                          </span>
                          
                          {/* Landlord quick view */}
                          {(contract.landlord_name || contract.landlord_phone) && (
                            <div className="flex flex-col items-end mt-1 pt-1 border-t border-[#1A1A1A]">
                              <span className="font-primary text-[10px] uppercase tracking-wider text-[#555] mb-0.5">Propietario</span>
                              {contract.landlord_name && <span className="font-primary text-xs text-[#888]">{contract.landlord_name}</span>}
                              {contract.landlord_phone && <span className="font-primary text-[10px] text-[#666]">{contract.landlord_phone}</span>}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="font-primary text-[10px] text-[#444]">Sin contrato</span>
                    )}
                  </div>

                  {/* Actions */}
                  <Link
                    to={`/admin/inquilinos/${t.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 border border-[#1F1F1F] text-[#666] hover:text-[#FAF8F5] hover:border-[#333] transition-colors font-primary text-xs opacity-0 group-hover:opacity-100"
                  >
                    <Eye className="w-3 h-3" /> Ver
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
