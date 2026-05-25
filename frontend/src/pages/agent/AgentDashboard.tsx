import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useAgentStats } from '../../hooks/useProperties';
import { useExpiringContracts, useContracts } from '../../hooks/useContracts';
import { useTenants } from '../../hooks/useTenants';
import {
  Building2, Eye, FileText, TrendingUp, PlusCircle, List,
  Users, AlertTriangle, CalendarClock, Briefcase
} from 'lucide-react';
import { daysUntilExpiry } from '../../types/tenant';

export const AgentDashboard = () => {
  const { user, userProfile } = useAuth();
  const agentId = user?.id;
  const { stats, loading } = useAgentStats(agentId);
  const { tenants } = useTenants(undefined, agentId);
  const { contracts } = useContracts(undefined, agentId);
  const { contracts: expiring } = useExpiringContracts(60, agentId);

  const agentName = userProfile?.agent_name || 'Agente';
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  const statCards = [
    { label: 'Mis Propiedades', value: stats.total, icon: <Building2 className="w-5 h-5" />, color: 'text-[#C9A962]' },
    { label: 'Publicadas', value: stats.publicadas, icon: <Eye className="w-5 h-5" />, color: 'text-green-400' },
    { label: 'En Alquiler', value: stats.alquiler, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400' },
    { label: 'En Venta', value: stats.venta, icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400' },
    { label: 'Mis Inquilinos', value: tenants.length, icon: <Users className="w-5 h-5" />, color: 'text-[#C9A962]' },
    { label: 'Contratos Activos', value: activeContracts, icon: <CalendarClock className="w-5 h-5" />, color: 'text-teal-400' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.2em]">Mi Portal</span>
          </div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Hola, {agentName}</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">Aquí tienes el resumen de tu actividad</p>
        </div>
        <Link
          to="/agente/propiedades/nueva"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Propiedad
        </Link>
      </div>

      {/* Expiry Alert */}
      {expiring.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <p className="font-primary text-orange-400 font-bold text-sm uppercase tracking-wider">
              {expiring.length} {expiring.length === 1 ? 'contrato próximo' : 'contratos próximos'} a vencer
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {expiring.map(c => {
              const days = daysUntilExpiry(c.end_date);
              const isUrgent = days <= 30;
              return (
                <Link
                  key={c.id}
                  to={`/agente/inquilinos/${c.tenant_id}`}
                  className="flex items-center justify-between bg-[#0A0A0A] border border-[#1F1F1F] hover:border-orange-500/30 transition-colors px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CalendarClock className={`w-4 h-4 flex-shrink-0 ${isUrgent ? 'text-red-400' : 'text-orange-400'}`} />
                    <div>
                      <p className="font-primary text-sm text-[#FAF8F5] font-semibold">
                        {(c.tenant as any)?.first_name} {(c.tenant as any)?.last_name}
                      </p>
                      {c.property_label && (
                        <p className="font-primary text-xs text-[#555]">{c.property_label}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-primary text-xs px-2.5 py-1 border rounded-full flex-shrink-0 ${
                    isUrgent
                      ? 'text-red-400 bg-red-400/10 border-red-400/30'
                      : 'text-orange-400 bg-orange-400/10 border-orange-400/30'
                  }`}>
                    {days <= 0 ? 'Expirado' : `Vence en ${days} días`}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          <Link to="/agente/propiedades/nueva" className="flex items-center gap-2 px-4 py-3 border border-[#C9A962] text-[#C9A962] font-primary text-sm hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all">
            <PlusCircle className="w-4 h-4" /> Nueva Propiedad
          </Link>
          <Link to="/agente/propiedades" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <List className="w-4 h-4" /> Ver Mis Propiedades
          </Link>
          <Link to="/agente/inquilinos/nuevo" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <Users className="w-4 h-4" /> Nuevo Inquilino
          </Link>
          <Link to="/agente/facturas/nueva" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <FileText className="w-4 h-4" /> Nueva Factura
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#C9A962]/5 border border-[#C9A962]/20 p-5">
        <p className="font-primary text-[#C9A962] text-sm font-bold mb-1">Tu espacio de trabajo</p>
        <p className="font-primary text-[#888888] text-sm">
          Solo ves las propiedades, facturas, inquilinos y contratos vinculados a tu cuenta.
          Cualquier dato que añadas quedará automáticamente registrado a tu nombre.
        </p>
      </div>
    </div>
  );
};
