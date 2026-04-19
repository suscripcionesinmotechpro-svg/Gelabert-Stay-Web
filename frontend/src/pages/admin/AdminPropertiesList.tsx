import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProperties, usePropertyMutations } from '../../hooks/useProperties';
import type { Property, PropertyStatus, CommercialStatus } from '../../types/property';
import { STATUS_LABELS, STATUS_COLORS, OPERATION_LABELS, COMMERCIAL_STATUS_LABELS, COMMERCIAL_STATUS_COLORS } from '../../types/property';
import { PlusCircle, Edit, Trash2, Star, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { PropertyReference } from '../../components/PropertyReference';
import { useTranslation } from 'react-i18next';

const StatusDropdown = ({ property, onStatusChange }: { property: Property; onStatusChange: () => void }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { changeStatus } = usePropertyMutations();
  const statuses: PropertyStatus[] = ['publicada', 'borrador', 'oculta'];

  const handleChange = async (status: PropertyStatus) => {
    await changeStatus(property.id, status);
    setOpen(false);
    onStatusChange();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-primary font-bold rounded-sm ${STATUS_COLORS[property.status]}`}
      >
        {t(STATUS_LABELS[property.status])}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-[#161616] border border-[#1F1F1F] min-w-[140px] shadow-lg">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className={`w-full text-left px-3 py-2 font-primary text-xs transition-colors ${
                property.status === s ? 'text-[#C9A962] bg-[#C9A962]/10' : 'text-[#888888] hover:text-[#FAF8F5] hover:bg-[#1F1F1F]'
              }`}
            >
              {t(STATUS_LABELS[s])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CommercialStatusDropdown = ({ property, onStatusChange }: { property: Property; onStatusChange: () => void }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { changeCommercialStatus } = usePropertyMutations();
  const statuses: CommercialStatus[] = ['disponible', 'reservado', 'alquilado', 'vendido', 'traspasado'];

  const handleChange = async (status: CommercialStatus) => {
    await changeCommercialStatus(property.id, status);
    setOpen(false);
    onStatusChange();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-primary font-bold rounded-sm ${COMMERCIAL_STATUS_COLORS[property.commercial_status]}`}
      >
        {t(COMMERCIAL_STATUS_LABELS[property.commercial_status])}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-[#161616] border border-[#1F1F1F] min-w-[140px] shadow-lg">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className={`w-full text-left px-3 py-2 font-primary text-xs transition-colors ${
                property.commercial_status === s ? 'text-[#C9A962] bg-[#C9A962]/10' : 'text-[#888888] hover:text-[#FAF8F5] hover:bg-[#1F1F1F]'
              }`}
            >
              {t(COMMERCIAL_STATUS_LABELS[s])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminPropertiesList = () => {
  const { t, i18n } = useTranslation();
  const { properties, loading, error, refetch } = useProperties(undefined, true);
  const { deleteProperty, toggleFeatured } = usePropertyMutations();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCommercial, setFilterCommercial] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [search, setSearch] = useState('');

  const filtered = properties.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterCommercial && p.commercial_status !== filterCommercial) return false;
    if (filterOp && p.operation !== filterOp) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.reference?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(t('admin.properties.delete_confirm', { title }))) return;
    setDeleting(id);
    await deleteProperty(id);
    setDeleting(null);
    refetch();
  };

  const handleToggleFeatured = async (p: Property) => {
    await toggleFeatured(p.id, !p.is_featured);
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">{t('admin.properties.title')}</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">
            {loading ? t('admin.properties.loading') : (
              filtered.length === 1 
                ? t('admin.properties.property_count', { count: filtered.length })
                : t('admin.properties.properties_count', { count: filtered.length })
            )}
          </p>
        </div>
        <Link
          to="/admin/propiedades/nueva"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          {t('admin.properties.new_property')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-[#0A0A0A] border border-[#1F1F1F] p-4">
        <input
          type="text"
          placeholder={t('admin.properties.search_placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">{t('admin.properties.filter_status_all')}</option>
          {(['publicada','borrador','oculta'] as PropertyStatus[]).map(s => (
            <option key={s} value={s}>{t(STATUS_LABELS[s])}</option>
          ))}
        </select>
        <select
          value={filterCommercial}
          onChange={e => setFilterCommercial(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">{t('admin.properties.filter_commercial_all')}</option>
          {(['disponible','reservado','alquilado','vendido','traspasado'] as CommercialStatus[]).map(s => (
            <option key={s} value={s}>{t(COMMERCIAL_STATUS_LABELS[s])}</option>
          ))}
        </select>
        <select
          value={filterOp}
          onChange={e => setFilterOp(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">{t('admin.properties.filter_operation_all')}</option>
          <option value="alquiler">{t('property.labels.operation.alquiler')}</option>
          <option value="venta">{t('property.labels.operation.venta')}</option>
          <option value="traspaso">{t('property.labels.operation.traspaso')}</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4">
          <p className="font-primary text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] border border-[#1F1F1F] gap-4">
          <PlusCircle className="w-12 h-12 text-[#333333]" />
          <p className="font-primary text-[#666666] text-sm">{t('admin.properties.empty_state')}</p>
          <Link to="/admin/propiedades/nueva" className="font-primary text-[#C9A962] text-sm hover:underline">
            {t('admin.properties.add_first')}
          </Link>
        </div>
      ) : (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#1F1F1F] min-w-[900px]">
            {[
              { key: 'property', label: t('admin.properties.table.property') },
              { key: 'operation', label: t('admin.properties.table.operation') },
              { key: 'price', label: t('admin.properties.table.price') },
              { key: 'status', label: t('admin.properties.table.status') },
              { key: 'commercial', label: t('admin.properties.table.commercial') },
              { key: 'featured', label: t('admin.properties.table.featured') },
              { key: 'actions', label: t('admin.properties.table.actions') }
            ].map(h => (
              <span key={h.key} className="font-primary text-xs text-[#444444] uppercase tracking-wider">{h.label}</span>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map(p => (
            <div
              key={p.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-4 border-b border-[#1F1F1F] items-center hover:bg-[#0F0F0F] transition-colors min-w-[900px]"
            >
              {/* Title + ref */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-[#1A1A1A] shrink-0 overflow-hidden border border-[#1F1F1F]">
                  {p.main_image ? (
                    <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#333333]">
                      <Eye className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-primary text-[#FAF8F5] text-sm font-bold truncate">{p.title}</p>
                  <PropertyReference 
                    reference={p.reference || p.id.slice(0, 8)} 
                    variant="minimal" 
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Operation */}
              <span className="font-primary text-[#888888] text-sm">{t(OPERATION_LABELS[p.operation])}</span>

              {/* Price */}
              <span className="font-secondary text-[#C9A962] text-sm">
                {p.price ? `€${p.price.toLocaleString(i18n.language === 'es' ? 'es-ES' : 'en-US')}` : '—'}
              </span>

              {/* Status dropdown */}
              <div><StatusDropdown property={p} onStatusChange={refetch} /></div>
              
              {/* Commercial Status dropdown */}
              <div><CommercialStatusDropdown property={p} onStatusChange={refetch} /></div>

              {/* Featured toggle */}
              <button
                onClick={() => handleToggleFeatured(p)}
                className={`transition-colors ${p.is_featured ? 'text-[#C9A962]' : 'text-[#333333] hover:text-[#C9A962]'}`}
                title={p.is_featured ? t('admin.properties.featured_remove') : t('admin.properties.featured_add')}
              >
                <Star className="w-4 h-4" fill={p.is_featured ? 'currentColor' : 'none'} />
              </button>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/propiedades/${p.id}/editar`}
                  className="p-1.5 text-[#888888] hover:text-[#C9A962] border border-transparent hover:border-[#C9A962] transition-all"
                  title={t('common.edit')}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                {p.status === 'publicada' ? (
                  <a href={`/propiedades/${p.slug || p.id}`} target="_blank" className="p-1.5 text-[#888888] hover:text-[#FAF8F5] border border-transparent hover:border-[#1F1F1F] transition-all" title={t('admin.properties.view_on_web')}>
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="p-1.5 text-[#333333]" title={t('admin.properties.not_published')}>
                    <EyeOff className="w-3.5 h-3.5" />
                  </span>
                )}
                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  disabled={deleting === p.id}
                  className="p-1.5 text-[#888888] hover:text-red-400 border border-transparent hover:border-red-400 transition-all disabled:opacity-50"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
