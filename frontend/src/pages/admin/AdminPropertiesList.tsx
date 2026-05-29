import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProperties, usePropertyMutations } from '../../hooks/useProperties';
import type { Property, PropertyStatus, CommercialStatus } from '../../types/property';
import { STATUS_LABELS, STATUS_COLORS, OPERATION_LABELS, COMMERCIAL_STATUS_LABELS, COMMERCIAL_STATUS_COLORS } from '../../types/property';
import { PlusCircle, Edit, Trash2, Star, Eye, EyeOff, ChevronDown, CheckCheck, LayoutGrid, FolderArchive, Loader2, Filter, CloudLightning, CloudOff, Cloud, X, Link2, Link2Off, RefreshCw } from 'lucide-react';
import { PropertyReference } from '../../components/PropertyReference';
import { getOptimizedImage } from '../../utils/images';
import { getCommunityShareMessage } from '../../utils/whatsapp';
import { downloadPropertyImagesAsZip } from '../../utils/downloadPropertyImages';
import { formatPropertyPrice } from '../../utils/textUtils';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const WhatsAppIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const StatusDropdown = ({ property, onStatusChange }: { property: Property; onStatusChange: () => void }) => {
  const [open, setOpen] = useState(false);
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
        {STATUS_LABELS[property.status]}
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
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CommercialStatusDropdown = ({ property, onStatusChange }: { property: Property; onStatusChange: () => void }) => {
  const [open, setOpen] = useState(false);
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
        {COMMERCIAL_STATUS_LABELS[property.commercial_status]}
        {property.is_manual_commercial_status && (
          <span className="ml-1 text-[8px] bg-white/20 px-1 rounded-full" title="Manual">M</span>
        )}
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
              {COMMERCIAL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminPropertiesList = () => {
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

  const { properties, loading, error, refetch } = useProperties(
    undefined, 
    true, 
    selectedAgentId === 'all' ? undefined : selectedAgentId
  );
  const { deleteProperty, toggleFeatured } = usePropertyMutations();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCommercial, setFilterCommercial] = useState('');
  const [filterOp, setFilterOp] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [downloadedZip, setDownloadedZip] = useState<string | null>(null);
  const [idealistaLoading, setIdealistaLoading] = useState<string | null>(null);
  const [idealistaStatuses, setIdealistaStatuses] = useState<Record<string, Property['idealista_status']>>({});

  // ── Idealista Import Modal ──
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  type ImportMatch = {
    idealista: { idealista_id: string; code: string; type: string; status: string; address: string; price: number | null };
    crm: Pick<Property, 'id' | 'title' | 'reference' | 'idealista_id' | 'idealista_status' | 'property_type' | 'city' | 'price' | 'main_image'> | null;
    auto_matched: boolean;
  };
  const [importMatches, setImportMatches] = useState<ImportMatch[]>([]);
  const [crmProperties, setCrmProperties] = useState<Pick<Property, 'id' | 'title' | 'reference' | 'idealista_id' | 'idealista_status' | 'property_type' | 'city' | 'price' | 'main_image'>[]>([]);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});

  const handleDownloadZip = async (p: Property) => {
    setDownloadingZip(p.id);
    try {
      await downloadPropertyImagesAsZip(p);
      setDownloadedZip(p.id);
      setTimeout(() => setDownloadedZip(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar el ZIP.';
      alert(msg);
    } finally {
      setDownloadingZip(null);
    }
  };

  const handleShareToChannel = (p: Property) => {
    const text = getCommunityShareMessage(p);
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 3000);
      window.open('https://whatsapp.com/channel/0029Vb7ZmzoJUM2Ugg1Tdt0m', '_blank');
    });
  };

  const filtered = properties.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterCommercial && p.commercial_status !== filterCommercial) return false;
    if (filterOp && p.operation !== filterOp) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.reference?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    await deleteProperty(id);
    setDeleting(null);
    refetch();
  };

  const handleToggleFeatured = async (p: Property) => {
    await toggleFeatured(p.id, !p.is_featured);
    refetch();
  };

  const handleIdealistaSync = async (p: Property) => {
    const isPublished = (idealistaStatuses[p.id] ?? p.idealista_status) === 'published';
    const action = isPublished ? 'deactivate' : 'publish';
    const confirmMsg = isPublished
      ? `¿Desactivar "${p.title}" en Idealista? El anuncio dejará de aparecer en el portal.`
      : `¿Publicar "${p.title}" en Idealista?`;
    if (!confirm(confirmMsg)) return;

    setIdealistaLoading(p.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ propertyId: p.id, action }),
        }
      );
      const result = await res.json();
      if (result.error) {
        toast.error(`Idealista: ${result.error}`);
        setIdealistaStatuses(prev => ({ ...prev, [p.id]: 'error' }));
      } else {
        const newStatus = action === 'publish' ? 'published' : 'not_published';
        setIdealistaStatuses(prev => ({ ...prev, [p.id]: newStatus }));
        toast.success(action === 'publish' ? '✅ Publicado en Idealista' : '☁️ Desactivado en Idealista');
      }
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
      setIdealistaStatuses(prev => ({ ...prev, [p.id]: 'error' }));
    } finally {
      setIdealistaLoading(null);
    }
  };

  const getIdealistaStatus = (p: Property) => idealistaStatuses[p.id] ?? p.idealista_status ?? 'not_published';

  const handleOpenImportModal = async () => {
    setImportModalOpen(true);
    setImportLoading(true);
    setImportMatches([]);
    setManualSelections({});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'fetch' }),
        }
      );
      const result = await res.json();
      if (result.error) {
        toast.error(`Error: ${result.error}`);
        setImportModalOpen(false);
      } else {
        setImportMatches(result.matches || []);
        setCrmProperties(result.crm_properties || []);
      }
    } catch (err: any) {
      toast.error(`Error de conexión: ${err.message}`);
      setImportModalOpen(false);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSaveImport = async () => {
    const mappings: { crm_id: string; idealista_id: string }[] = [];

    importMatches.forEach((m, idx) => {
      const manualCrmId = manualSelections[String(idx)];
      const crmId = manualCrmId || m.crm?.id;
      if (crmId && m.idealista.idealista_id) {
        mappings.push({ crm_id: crmId, idealista_id: m.idealista.idealista_id });
      }
    });

    if (mappings.length === 0) {
      toast.error('No hay emparejamientos para guardar.');
      return;
    }

    setImportSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idealista-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'save', mappings }),
        }
      );
      const result = await res.json();
      if (result.error) {
        toast.error(`Error guardando: ${result.error}`);
      } else {
        toast.success(`✅ ${result.saved} propiedades vinculadas con Idealista`);
        setImportModalOpen(false);
        refetch();
        // Update local statuses
        mappings.forEach(m => {
          setIdealistaStatuses(prev => ({ ...prev, [m.crm_id]: 'published' }));
        });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setImportSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Propiedades</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">
            {loading ? 'Cargando propiedades...' : (
              filtered.length === 1 
                ? '1 propiedad encontrada'
                : `${filtered.length} propiedades encontradas`
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start flex-wrap">
          <button
            onClick={handleOpenImportModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1F17] text-[#4ADE80] border border-[#4ADE80]/30 font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#4ADE80]/10 transition-colors"
            title="Importar y vincular propiedades ya publicadas en Idealista"
          >
            <Link2 className="w-4 h-4" />
            Vincular Idealista
          </button>
          <Link
            to="/admin/propiedades/organizar"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#161616] text-[#FAF8F5] border border-[#1F1F1F] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#1F1F1F] transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Organizar Listado
          </Link>
          <Link
            to="/admin/propiedades/nueva"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Propiedad
          </Link>
        </div>
      </div>

      {/* Agent Selector Dropdown */}
      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-2.5 self-start rounded-sm">
        <Filter className="w-4 h-4 text-[#C9A962]" />
        <span className="font-primary text-xs text-[#666] uppercase tracking-wider font-bold">Filtrar por Agente:</span>
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(e.target.value)}
          className="bg-transparent text-[#C9A962] font-primary text-xs uppercase tracking-wider font-bold outline-none cursor-pointer"
        >
          <option value="all">Todas las Propiedades</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>
              {a.agent_name} ({a.role === 'admin' ? 'Admin' : 'Agente'})
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-[#0A0A0A] border border-[#1F1F1F] p-4">
        <input
          type="text"
          placeholder="Buscar por título o referencia..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#FAF8F5] text-sm outline-none focus:border-[#C9A962] transition-colors placeholder:text-[#444444]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">Todos los estados</option>
          {(['publicada','borrador','oculta'] as PropertyStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterCommercial}
          onChange={e => setFilterCommercial(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">Todos los estados com.</option>
          {(['disponible','reservado','alquilado','vendido','traspasado'] as CommercialStatus[]).map(s => (
            <option key={s} value={s}>{COMMERCIAL_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterOp}
          onChange={e => setFilterOp(e.target.value)}
          className="h-9 bg-[#161616] border border-[#1F1F1F] px-3 font-primary text-[#888888] text-sm outline-none focus:border-[#C9A962] transition-colors"
        >
          <option value="">Todas las operaciones</option>
          <option value="alquiler">Alquiler</option>
          <option value="venta">Venta</option>
          <option value="traspaso">Traspaso</option>
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
          <p className="font-primary text-[#666666] text-sm">No se han encontrado propiedades.</p>
          <Link to="/admin/propiedades/nueva" className="font-primary text-[#C9A962] text-sm hover:underline">
            Añadir tu primera propiedad
          </Link>
        </div>
      ) : (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-[#1F1F1F] min-w-[980px]">
            {[
              { key: 'property', label: 'Propiedad' },
              { key: 'operation', label: 'Operación' },
              { key: 'price', label: 'Precio' },
              { key: 'status', label: 'Estado' },
              { key: 'commercial', label: 'Comercial' },
              { key: 'featured', label: 'Destacada' },
              { key: 'idealista', label: 'Idealista' },
              { key: 'actions', label: 'Acciones' }
            ].map(h => (
              <span key={h.key} className="font-primary text-xs text-[#444444] uppercase tracking-wider">{h.label}</span>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map(p => (
            <div
              key={p.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-4 border-b border-[#1F1F1F] items-center hover:bg-[#0F0F0F] transition-colors min-w-[980px]"
            >
              {/* Title + ref */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-[#1A1A1A] shrink-0 overflow-hidden border border-[#1F1F1F]">
                  {p.main_image ? (
                    <img src={getOptimizedImage(p.main_image, { width: 100, height: 100, format: 'webp' })} alt={p.title} className="w-full h-full object-cover" />
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
              <span className="font-primary text-[#888888] text-sm">{OPERATION_LABELS[p.operation]}</span>

              {/* Price */}
              <span className="font-secondary text-[#C9A962] text-sm">
                {formatPropertyPrice(p.price, p.price_type, p.max_price, p.currency, 'es')}
              </span>

              {/* Status dropdown */}
              <div><StatusDropdown property={p} onStatusChange={refetch} /></div>
              
              {/* Commercial Status dropdown */}
              <div><CommercialStatusDropdown property={p} onStatusChange={refetch} /></div>

              {/* Featured toggle */}
              <button
                onClick={() => handleToggleFeatured(p)}
                className={`transition-colors ${p.is_featured ? 'text-[#C9A962]' : 'text-[#333333] hover:text-[#C9A962]'}`}
                title={p.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
              >
                <Star className="w-4 h-4" fill={p.is_featured ? 'currentColor' : 'none'} />
              </button>

              {/* Idealista sync */}
              {(() => {
                const ist = getIdealistaStatus(p);
                const isLoading = idealistaLoading === p.id;
                const isPublished = ist === 'published';
                const isError = ist === 'error';
                return (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleIdealistaSync(p)}
                      disabled={isLoading}
                      title={isPublished ? 'Publicado en Idealista — click para desactivar' : isError ? 'Error en Idealista — click para reintentar' : 'Publicar en Idealista'}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-all disabled:opacity-50 ${
                        isLoading
                          ? 'text-[#C9A962] border-[#C9A962]/40 bg-[#C9A962]/5 cursor-wait'
                          : isPublished
                          ? 'text-[#4ADE80] border-[#4ADE80]/40 bg-[#4ADE80]/10 hover:bg-[#4ADE80]/20'
                          : isError
                          ? 'text-[#F87171] border-[#F87171]/40 bg-[#F87171]/10 hover:bg-[#F87171]/20'
                          : 'text-[#555] border-[#2A2A2A] hover:text-[#C9A962] hover:border-[#C9A962]/40'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isPublished ? (
                        <Cloud className="w-3 h-3" />
                      ) : isError ? (
                        <CloudOff className="w-3 h-3" />
                      ) : (
                        <CloudLightning className="w-3 h-3" />
                      )}
                      <span>{isLoading ? '...' : isPublished ? 'ON' : isError ? 'ERR' : 'OFF'}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/propiedades/${p.id}/editar`}
                  className="p-1.5 text-[#888888] hover:text-[#C9A962] border border-transparent hover:border-[#C9A962] transition-all"
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleShareToChannel(p)}
                  className={`p-1.5 border transition-all flex items-center justify-center gap-1 ${
                    copiedId === p.id 
                      ? 'text-[#4ADE80] border-[#4ADE80] bg-[#4ADE80]/10' 
                      : 'text-[#888888] hover:text-[#4ADE80] border-transparent hover:border-[#4ADE80]'
                  }`}
                  title="Compartir en Canal WhatsApp"
                >
                  {copiedId === p.id ? <CheckCheck className="w-3.5 h-3.5" /> : <WhatsAppIcon />}
                  {copiedId === p.id && <span className="text-[8px] font-bold uppercase tracking-tighter">Copiado</span>}
                </button>
                {/* ZIP download button */}
                <button
                  onClick={() => handleDownloadZip(p)}
                  disabled={downloadingZip === p.id}
                  className={`p-1.5 border transition-all disabled:opacity-50 ${
                    downloadedZip === p.id
                      ? 'text-[#4ADE80] border-[#4ADE80] bg-[#4ADE80]/10'
                      : 'text-[#888888] hover:text-[#C9A962] border-transparent hover:border-[#C9A962]'
                  }`}
                  title="Descargar fotos en ZIP"
                >
                  {downloadingZip === p.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : downloadedZip === p.id
                      ? <CheckCheck className="w-3.5 h-3.5" />
                      : <FolderArchive className="w-3.5 h-3.5" />}
                </button>
                {p.status === 'publicada' ? (
                  <a href={`/propiedades/${p.slug || p.id}`} target="_blank" className="p-1.5 text-[#888888] hover:text-[#FAF8F5] border border-transparent hover:border-[#1F1F1F] transition-all" title="Ver en la web">
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="p-1.5 text-[#333333]" title="No publicada">
                    <EyeOff className="w-3.5 h-3.5" />
                  </span>
                )}
                <button
                  onClick={() => handleDelete(p.id, p.title)}
                  disabled={deleting === p.id}
                  className="p-1.5 text-[#888888] hover:text-red-400 border border-transparent hover:border-red-400 transition-all disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Idealista Import Modal ── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-[#4ADE80]" />
                <div>
                  <h2 className="font-secondary text-xl text-[#FAF8F5]">Vincular con Idealista</h2>
                  <p className="font-primary text-xs text-[#666] mt-0.5">
                    Importa el estado de tus propiedades ya publicadas en Idealista y vincula con el CRM.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-2 text-[#666] hover:text-[#FAF8F5] border border-transparent hover:border-[#1F1F1F] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {importLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 className="w-8 h-8 text-[#4ADE80] animate-spin" />
                  <p className="font-primary text-[#666] text-sm">Consultando Idealista API...</p>
                </div>
              ) : importMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Link2Off className="w-10 h-10 text-[#333]" />
                  <p className="font-primary text-[#666] text-sm">No se encontraron propiedades en Idealista.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 px-3 py-2">
                    <span className="font-primary text-[10px] text-[#444] uppercase tracking-wider">Idealista</span>
                    <span className="font-primary text-[10px] text-[#444] uppercase tracking-wider text-center">Vinculación</span>
                    <span className="font-primary text-[10px] text-[#444] uppercase tracking-wider">CRM</span>
                  </div>

                  {importMatches.map((m, idx) => {
                    const selectedCrmId = manualSelections[String(idx)] ?? m.crm?.id ?? '';
                    const selectedCrm = crmProperties.find(c => c.id === selectedCrmId) ?? m.crm;
                    const isAutoMatched = m.auto_matched && !manualSelections[String(idx)];
                    const alreadyLinked = !!m.crm?.idealista_id;

                    return (
                      <div
                        key={m.idealista.idealista_id}
                        className={`grid grid-cols-[1fr_auto_1fr] gap-4 items-center p-3 border transition-colors ${
                          alreadyLinked
                            ? 'border-[#4ADE80]/20 bg-[#4ADE80]/5'
                            : isAutoMatched
                            ? 'border-[#C9A962]/20 bg-[#C9A962]/5'
                            : 'border-[#1F1F1F] bg-[#0F0F0F]'
                        }`}
                      >
                        {/* Idealista property */}
                        <div className="min-w-0">
                          <p className="font-primary text-xs text-[#FAF8F5] font-bold truncate">{m.idealista.address}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="font-primary text-[10px] text-[#666] bg-[#1A1A1A] px-1.5 py-0.5 rounded-sm">{m.idealista.code}</span>
                            <span className="font-primary text-[10px] text-[#666]">{m.idealista.type}</span>
                            {m.idealista.price && (
                              <span className="font-primary text-[10px] text-[#C9A962]">{m.idealista.price.toLocaleString('es-ES')} €</span>
                            )}
                            <span className={`font-primary text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                              m.idealista.status === 'activo' ? 'text-[#4ADE80] bg-[#4ADE80]/10' : 'text-[#888] bg-[#1A1A1A]'
                            }`}>
                              {m.idealista.status}
                            </span>
                          </div>
                        </div>

                        {/* Arrow / status indicator */}
                        <div className="flex flex-col items-center gap-1">
                          {alreadyLinked ? (
                            <Link2 className="w-4 h-4 text-[#4ADE80]" />
                          ) : (
                            <Link2Off className="w-4 h-4 text-[#444]" />
                          )}
                          {isAutoMatched && !alreadyLinked && (
                            <span className="font-primary text-[8px] text-[#C9A962] uppercase tracking-wider">Auto</span>
                          )}
                        </div>

                        {/* CRM selector */}
                        <div className="min-w-0">
                          {alreadyLinked ? (
                            <div>
                              <p className="font-primary text-xs text-[#4ADE80] font-bold truncate">{selectedCrm?.title ?? '—'}</p>
                              <p className="font-primary text-[10px] text-[#666] mt-0.5">Ya vinculado</p>
                            </div>
                          ) : (
                            <select
                              value={selectedCrmId}
                              onChange={e => setManualSelections(prev => ({ ...prev, [String(idx)]: e.target.value }))}
                              className="w-full bg-[#161616] border border-[#2A2A2A] text-[#FAF8F5] font-primary text-xs px-2 py-1.5 outline-none focus:border-[#C9A962] transition-colors"
                            >
                              <option value="">— Sin vincular —</option>
                              {crmProperties.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.title} {c.reference ? `[${c.reference}]` : ''}
                                  {c.idealista_id ? ' ✓' : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            {!importLoading && importMatches.length > 0 && (
              <div className="px-6 py-4 border-t border-[#1F1F1F] flex items-center justify-between gap-4">
                <div className="font-primary text-xs text-[#666]">
                  <span className="text-[#C9A962] font-bold">
                    {importMatches.filter((m, idx) => {
                      const id = manualSelections[String(idx)] ?? m.crm?.id;
                      return !!id && !m.crm?.idealista_id;
                    }).length}
                  </span>
                  {' '}nuevos vínculos a guardar
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenImportModal}
                    className="flex items-center gap-2 px-4 py-2 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:border-[#333] hover:text-[#FAF8F5] transition-colors"
                    title="Recargar datos de Idealista"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recargar
                  </button>
                  <button
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 border border-[#1F1F1F] text-[#888] font-primary text-sm hover:border-[#333] hover:text-[#FAF8F5] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveImport}
                    disabled={importSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-[#4ADE80] text-[#0A0A0A] font-primary font-bold text-sm hover:bg-[#22C55E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        Guardar vínculos
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
