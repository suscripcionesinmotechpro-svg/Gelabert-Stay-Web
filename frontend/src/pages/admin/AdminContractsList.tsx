import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '../../hooks/useContracts';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, Search, Plus, MapPin, Calendar, 
  User, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '../../types/tenant';

export const AdminContractsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterAgent, setFilterAgent] = useState<'mine' | 'all'>('mine');
  const { contracts, loading } = useContracts(undefined, filterAgent === 'mine' ? user?.id : undefined);
  const [search, setSearch] = useState('');

  const filteredContracts = contracts.filter(c => {
    const tenantName = c.tenant ? `${c.tenant.first_name} ${c.tenant.last_name}` : '';
    const q = search.toLowerCase();
    return (
      tenantName.toLowerCase().includes(q) ||
      (c.property_label || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.landlord_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">Contratos</h1>
          <p className="font-primary text-[#666] text-sm mt-1">
            Gestiona todos los contratos de arrendamiento, inquilinos y propietarios
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/contratos/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Contrato
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-[#1F1F1F] bg-[#0A0A0A] p-1 gap-2 self-start rounded-sm">
        <button
          onClick={() => setFilterAgent('mine')}
          className={`px-6 py-2.5 text-xs font-primary uppercase font-bold tracking-wider rounded-sm transition-all ${
            filterAgent === 'mine'
              ? 'bg-[#C9A962] text-[#0A0A0A]'
              : 'text-[#666] hover:text-[#FAF8F5] bg-transparent'
          }`}
        >
          Mis Contratos
        </button>
        <button
          onClick={() => setFilterAgent('all')}
          className={`px-6 py-2.5 text-xs font-primary uppercase font-bold tracking-wider rounded-sm transition-all ${
            filterAgent === 'all'
              ? 'bg-[#C9A962] text-[#0A0A0A]'
              : 'text-[#666] hover:text-[#FAF8F5] bg-transparent'
          }`}
        >
          Todos los Contratos
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          <input
            type="text"
            placeholder="Buscar por inquilino, propiedad o propietario..."
            className="w-full bg-transparent border border-[#333] text-[#FAF8F5] px-10 py-2.5 font-primary text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contracts List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-20 bg-[#0A0A0A] border border-[#1F1F1F]">
            <FileText className="w-10 h-10 text-[#333] mx-auto mb-3" />
            <p className="font-primary text-[#666]">No se encontraron contratos</p>
          </div>
        ) : (
          filteredContracts.map(contract => (
            <div 
              key={contract.id} 
              className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-col md:flex-row gap-5 items-start justify-between group hover:border-[#333] transition-colors"
            >
              {/* Left Details */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Propiedad */}
                <div className="flex flex-col gap-1">
                  <span className="font-primary text-[10px] uppercase tracking-widest text-[#666]">Propiedad</span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C9A962] mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-primary text-sm text-[#FAF8F5]">
                        {contract.property_label || 'Sin propiedad vinculada'}
                      </span>
                      {contract.address && (
                        <span className="font-primary text-[11px] text-[#888] line-clamp-1">
                          {contract.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inquilino */}
                <div className="flex flex-col gap-1">
                  <span className="font-primary text-[10px] uppercase tracking-widest text-[#666]">Inquilino</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#666] flex-shrink-0" />
                    <span className="font-primary text-sm text-[#FAF8F5]">
                      {contract.tenant ? `${contract.tenant.first_name} ${contract.tenant.last_name}` : 'Sin inquilino'}
                    </span>
                  </div>
                </div>

                {/* Propietario */}
                <div className="flex flex-col gap-1">
                  <span className="font-primary text-[10px] uppercase tracking-widest text-[#666]">Propietario</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#C9A962] flex-shrink-0" />
                    <span className="font-primary text-sm text-[#FAF8F5]">
                      {contract.landlord_name || 'No especificado'}
                    </span>
                  </div>
                </div>

                {/* Fechas */}
                <div className="flex flex-col gap-1">
                  <span className="font-primary text-[10px] uppercase tracking-widest text-[#666]">Fechas</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#666] flex-shrink-0" />
                    <span className="font-primary text-sm text-[#FAF8F5]">
                      {new Date(contract.start_date).toLocaleDateString()} — {new Date(contract.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Actions & Status */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 self-stretch md:self-auto">
                <div className={`px-2.5 py-1 rounded-full border text-[10px] font-primary font-bold uppercase tracking-wider flex items-center gap-1.5 ${CONTRACT_STATUS_COLORS[contract.status]}`}>
                  {contract.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> :
                   contract.status === 'expired' ? <Clock className="w-3 h-3" /> :
                   <XCircle className="w-3 h-3" />}
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </div>
                
                <button
                  onClick={() => navigate(`/admin/contratos/${contract.id}/editar`)}
                  className="font-primary text-[11px] text-[#C9A962] uppercase tracking-widest hover:text-[#FAF8F5] transition-colors"
                >
                  Gestionar →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
