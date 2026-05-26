import { Link } from 'react-router-dom';
import { useAdminStats, useAgentStats } from '../../hooks/useProperties';
import { useExpiringContracts, useContracts } from '../../hooks/useContracts';
import { useTenants } from '../../hooks/useTenants';
import { Building2, Eye, FileText, TrendingUp, PlusCircle, List, Users, AlertTriangle, CalendarClock, Filter } from 'lucide-react';
import { daysUntilExpiry } from '../../types/tenant';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const AdminDashboard = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [agents, setAgents] = useState<{ id: string; agent_name: string; role: string }[]>([]);

  useEffect(() => {
    supabase.from('user_profiles')
      .select('id, agent_name, role')
      .in('role', ['admin', 'agent'])
      .then(({ data }) => {
        if (data) setAgents(data);
      });
  }, []);

  const agentId = selectedAgentId === 'all' ? undefined : selectedAgentId;

  const { stats: adminStats, loading: adminLoading } = useAdminStats();
  const { stats: agentStats, loading: agentLoading } = useAgentStats(agentId);

  const stats  = selectedAgentId === 'all' ? adminStats  : agentStats;
  const loading = selectedAgentId === 'all' ? adminLoading : agentLoading;

  const { tenants } = useTenants(undefined, agentId);
  const { contracts } = useContracts(undefined, agentId);
  const { contracts: expiring } = useExpiringContracts(60, agentId);

  const activeContracts = contracts.filter(c => c.status === 'active').length;

  const getAgentLabel = () => {
    if (selectedAgentId === 'all') return 'Oficina';
    const found = agents.find(a => a.id === selectedAgentId);
    return found ? found.agent_name : 'Mis';
  };

  const statCards = [
    { label: selectedAgentId === 'all' ? 'Total Oficina' : `Propiedades (${getAgentLabel()})`, value: stats.total, icon: <Building2 className="w-5 h-5" />, color: 'text-[#C9A962]' },
    { label: 'Publicadas', value: stats.publicadas, icon: <Eye className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'Borradores', value: stats.borradores, icon: <FileText className="w-5 h-5" />, color: 'text-yellow-400' },
    { label: 'Alquiler', value: stats.alquiler, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'Venta', value: stats.venta, icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Traspaso', value: stats.traspaso, icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-400' },
    { label: selectedAgentId === 'all' ? 'Todos los Inquilinos' : `Inquilinos (${getAgentLabel()})`, value: tenants.length, icon: <Users className="w-5 h-5" />, color: 'text-[#C9A962]' },
    { label: 'Contratos Activos', value: activeContracts, icon: <CalendarClock className="w-5 h-5" />, color: 'text-teal-400' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Panel de Control</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">Gestión integral de propiedades y contratos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Agent select selector */}
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] px-3 py-1.5 rounded-sm">
            <Filter className="w-3.5 h-3.5 text-[#C9A962]" />
            <span className="font-primary text-[10px] text-[#666] uppercase tracking-wider font-bold">Agente:</span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-transparent text-[#C9A962] font-primary text-xs uppercase tracking-wider font-bold outline-none cursor-pointer"
            >
              <option value="all">Toda la Oficina</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.agent_name} ({a.role === 'admin' ? 'Admin' : 'Agente'})
                </option>
              ))}
            </select>
          </div>
          <Link
            to="/admin/propiedades/nueva"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Propiedad
          </Link>
        </div>
      </div>

      {/* Expiry Alert */}
      {expiring.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <p className="font-primary text-orange-400 font-bold text-sm uppercase tracking-wider">
              {expiring.length} contratos próximos a vencer
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {expiring.map(c => {
              const days = daysUntilExpiry(c.end_date);
              const isUrgent = days <= 30;
              return (
                <div key={c.id} className="flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] hover:border-orange-500/30 transition-colors group">
                  <Link
                    to={`/admin/inquilinos/${c.tenant_id}`}
                    className="flex items-start sm:items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <CalendarClock className={`w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0 ${isUrgent ? 'text-red-400' : 'text-orange-400'}`} />
                      <div className="flex flex-col gap-0.5">
                        <p className="font-primary text-sm text-[#FAF8F5] font-semibold group-hover:text-orange-400 transition-colors">
                          {c.tenant?.first_name} {c.tenant?.last_name}
                        </p>
                        {c.property_label && (
                          c.property_id ? (
                            <Link
                              to={`/propiedades/${c.property_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-primary text-sm text-[#C9A962] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {c.property_label}
                            </Link>
                          ) : (
                            <p className="font-primary text-xs text-[#555]">{c.property_label}</p>
                          )
                        )}
                      </div>
                    </div>
                    <span className={`font-primary text-xs px-2.5 py-1 border rounded-full flex-shrink-0 ${
                      isUrgent ? 'text-red-400 bg-red-400/10 border-red-400/30'
                      : 'text-orange-400 bg-orange-400/10 border-orange-400/30'
                    }`}>
                      {days <= 0 ? 'Expirado' : `Vence en ${days} días`}
                    </span>
                  </Link>

                  {/* Landlord Data in Alert */}
                  {(c.landlord_name || c.landlord_phone || c.landlord_email) && (
                    <div className="px-4 pb-3 pt-1 border-t border-[#1A1A1A] mt-1 mx-2 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2">
                      <span className="font-primary text-[10px] uppercase tracking-wider text-[#555] font-semibold">Propietario:</span>
                      
                      {c.landlord_name && (
                        <span className="font-primary text-xs text-[#FAF8F5]">
                          {c.landlord_name}
                        </span>
                      )}
                      
                      {c.landlord_phone && (
                        <span className="font-primary text-xs text-[#888] flex items-center gap-1">
                          📞 {c.landlord_phone}
                        </span>
                      )}
                      
                      {c.landlord_email && (
                        <span className="font-primary text-xs text-[#888] flex items-center gap-1">
                          ✉️ {c.landlord_email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Property Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-3">
            <div className={`flex items-center gap-2 ${stat.color}`}>
              {stat.icon}
              <span className="font-primary text-xs uppercase tracking-wider text-[#666666]">{stat.label}</span>
            </div>
            <p className={`font-secondary text-4xl ${stat.color}`}>
              {loading ? (
                <span className="block w-12 h-8 bg-[#1F1F1F] animate-pulse rounded" />
              ) : stat.value}
            </p>
          </div>
        ))}
      </div>


      {/* Quick Actions */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-4">
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">Acciones Rápidas</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link to="/admin/propiedades/nueva" className="flex items-center gap-2 px-4 py-3 border border-[#C9A962] text-[#C9A962] font-primary text-sm hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all">
            <PlusCircle className="w-4 h-4" /> Nueva Propiedad
          </Link>
          <Link to="/admin/propiedades" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <List className="w-4 h-4" /> Ver Listado
          </Link>
          <Link to="/admin/inquilinos/nuevo" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <Users className="w-4 h-4" /> Nuevo Inquilino
          </Link>
          <a href="/propiedades" target="_blank" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <Eye className="w-4 h-4" /> Ver Web Pública
          </a>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#C9A962]/5 border border-[#C9A962]/20 p-5">
        <p className="font-primary text-[#C9A962] text-sm font-bold mb-1">Consejo de gestión</p>
        <p className="font-primary text-[#888888] text-sm">
          Las propiedades con estado <strong className="text-[#FAF8F5]">Publicada</strong> aparecen automáticamente en la web pública.
          Las marcadas como <strong className="text-[#FAF8F5]">Borrador</strong> son solo visibles aquí.
        </p>
      </div>
    </div>
  );
};
