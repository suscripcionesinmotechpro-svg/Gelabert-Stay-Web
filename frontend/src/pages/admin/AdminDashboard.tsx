import { Link } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useProperties';
import { useTranslation, Trans } from 'react-i18next';
import { Building2, Eye, FileText, TrendingUp, PlusCircle, List } from 'lucide-react';

export const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();
  const { t } = useTranslation();

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

      {/* Stats Grid */}
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

      {/* Quick Actions */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-6 flex flex-col gap-4">
        <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">{t('admin.dashboard.quick_actions.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/admin/propiedades/nueva"
            className="flex items-center gap-2 px-4 py-3 border border-[#C9A962] text-[#C9A962] font-primary text-sm hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {t('admin.dashboard.quick_actions.add_property')}
          </Link>
          <Link
            to="/admin/propiedades"
            className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all"
          >
            <List className="w-4 h-4" />
            {t('admin.dashboard.quick_actions.view_all')}
          </Link>
          <a
            href="/propiedades"
            target="_blank"
            className="flex items-center gap-2 px-4 py-3 border border-[#1F1F1F] text-[#888888] font-primary text-sm hover:border-[#FAF8F5] hover:text-[#FAF8F5] transition-all"
          >
            <Eye className="w-4 h-4" />
            {t('admin.dashboard.quick_actions.view_public')}
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
