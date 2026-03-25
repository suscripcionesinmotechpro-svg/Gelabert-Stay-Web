import { Link } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useProperties';
import { useExpiringContracts, useContracts } from '../../hooks/useContracts';
import { useTenants } from '../../hooks/useTenants';
import { useTranslation, Trans } from 'react-i18next';
import { Building2, Eye, FileText, TrendingUp, PlusCircle, List, Users, AlertTriangle, CalendarClock } from 'lucide-react';
import { daysUntilExpiry } from '../../types/tenant';

export const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();
  const { t } = useTranslation();
  const { tenants } = useTenants();
  const { contracts } = useContracts();
  const { contracts: expiring } = useExpiringContracts(60);

  const activeContracts = contracts.filter(c => c.status === 'active').length;

  const statCards = [
    { label: t('admin.dashboard.stats.total'), value: stats.total, icon: <Building2 className="w-5 h-5" />, color: 'text-[#C9A962]' },
    { label: t('admin.dashboard.stats.published'), value: stats.publicadas, icon: <Eye className="w-5 h-5" />, color: 'text-green-400' },
    { label: t('admin.dashboard.stats.drafts'), value: stats.borradores, icon: <FileText className="w-5 h-5" />, color: 'text-yellow-400' },
    { label: t('admin.dashboard.stats.rent'), value: stats.alquiler, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-400' },
    { label: t('admin.dashboard.stats.sale'), value: stats.venta, icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400' },
    { label: t('admin.dashboard.stats.transfer'), value: stats.traspaso, icon: <TrendingUp className="w-5 h-5" />, color: 'text-orange-400' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">{t('admin.dashboard.title')}</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">{t('admin.dashboard.subtitle')}</p>
        </div>
        <Link
          to="/admin/propiedades/nueva"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          {t('admin.dashboard.quick_actions.add_property')}
        </Link>
      </div>

      {/* Expiry Alert */}
      {expiring.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <p className="font-primary text-orange-400 font-bold text-sm uppercase tracking-wider">
              {expiring.length === 1 ? '1 contrato próximo a vencer' : `${expiring.length} contratos próximos a vencer`}
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
                          {(c.tenant as any)?.first_name} {(c.tenant as any)?.last_name}
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
                      {days <= 0 ? 'Expirado' : `${days} días`}
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      {/* Tenant Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/admin/inquilinos" className="bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#C9A962]/30 transition-colors p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#C9A962]">
            <Users className="w-5 h-5" />
            <span className="font-primary text-xs uppercase tracking-wider text-[#666]">Inquilinos</span>
          </div>
          <p className="font-secondary text-4xl text-[#C9A962]">{tenants.length}</p>
        </Link>
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-teal-400">
            <CalendarClock className="w-5 h-5" />
            <span className="font-primary text-xs uppercase tracking-wider text-[#666]">Contratos Activos</span>
          </div>
          <p className="font-secondary text-4xl text-teal-400">{activeContracts}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-4">
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">{t('admin.dashboard.quick_actions.title')}</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link to="/admin/propiedades/nueva" className="flex items-center gap-2 px-4 py-3 border border-[#C9A962] text-[#C9A962] font-primary text-sm hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all">
            <PlusCircle className="w-4 h-4" /> {t('admin.dashboard.quick_actions.add_property')}
          </Link>
          <Link to="/admin/propiedades" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <List className="w-4 h-4" /> {t('admin.dashboard.quick_actions.view_all')}
          </Link>
          <Link to="/admin/inquilinos/nuevo" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <Users className="w-4 h-4" /> Nuevo Inquilino
          </Link>
          <a href="/propiedades" target="_blank" className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all">
            <Eye className="w-4 h-4" /> {t('admin.dashboard.quick_actions.view_public')}
          </a>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#C9A962]/5 border border-[#C9A962]/20 p-5">
        <p className="font-primary text-[#C9A962] text-sm font-bold mb-1">{t('admin.dashboard.tips.title')}</p>
        <p className="font-primary text-[#888888] text-sm">
          <Trans i18nKey="admin.dashboard.tips.description">
            Las propiedades con estado <strong className="text-[#FAF8F5]">Publicada</strong> aparecen automáticamente en la web pública.
            Las marcadas como <strong className="text-[#FAF8F5]">Borrador</strong> son solo visibles aquí.
          </Trans>
        </p>
      </div>
    </div>
  );
};
