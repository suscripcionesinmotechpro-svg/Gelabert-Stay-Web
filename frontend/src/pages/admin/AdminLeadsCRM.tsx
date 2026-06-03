import { useState, useEffect } from 'react';
import { Search, MessageSquare, User, Trash2, ExternalLink, Copy, Check, Filter } from 'lucide-react';
import type { LeadCRM, ScoredProperty } from '../../hooks/useLeadsCRM';
import { useLeadsCRM, updateLeadStatus, updateLeadNotes, searchPropertiesForBot, deleteLead } from '../../hooks/useLeadsCRM';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

export const AdminLeadsCRM = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  
  const [filterIntent, setFilterIntent] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadCRM | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  const agentId = selectedAgentId === 'all' ? undefined : selectedAgentId;

  const { leads, loading, refetch } = useLeadsCRM({
    intent: filterIntent,
    status: filterStatus,
    search: searchQuery,
    agentId,
  });

  const [notes, setNotes] = useState('');
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [leadMatches, setLeadMatches] = useState<ScoredProperty[] | null>(null);
  const [agentsList, setAgentsList] = useState<{ id: string; agent_name: string; role: string }[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, agent_name, role')
        .in('role', ['admin', 'agent']);
      if (data) setAgentsList(data);
    };
    fetchAgents();
  }, []);

  const handleUpdateStatus = async (id: string, status: LeadCRM['status']) => {
    try {
      await updateLeadStatus(id, status);
      refetch();
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead({ ...selectedLead, status });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    try {
      await updateLeadNotes(selectedLead.id, notes);
      refetch();
      setSelectedLead({ ...selectedLead, agent_notes: notes });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este lead? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteLead(id);
      setSelectedLead(null);
      refetch();
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el lead');
    }
  };

  const handleAssignAgent = async (leadId: string, agentId: string | null) => {
    try {
      const { error } = await supabase
        .from('leads_crm')
        .update({ agent_id: agentId })
        .eq('id', leadId);
      if (error) throw error;
      refetch();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, agent_id: agentId });
      }
    } catch (e) {
      console.error(e);
      alert('Error al asignar agente');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nuevo': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'contactado': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'cualificado': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'cerrado': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'descartado': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    const fullUrl = `${window.location.origin}${text}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const captureLinks = [
    { id: 'tenants', label: 'Inquilinos', path: '/inquilinos', color: 'text-blue-400' },
    { id: 'sale', label: 'Propietarios (Venta)', path: '/propietarios-venta', color: 'text-[#C9A962]' },
    { id: 'rent', label: 'Propietarios (Alquiler)', path: '/propietarios-alquiler', color: 'text-green-400' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 bg-[#111111] p-6 border border-[#1F1F1F] rounded-lg">
        <div>
          <h1 className="text-2xl font-secondary text-[#C9A962] uppercase tracking-widest">CRM Leads</h1>
          <p className="text-[#888888] font-primary text-xs mt-1 uppercase tracking-wider">Gestión de prospectos captados</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Agent Selector Dropdown */}
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-2.5 rounded-sm">
            <Filter className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-xs text-[#666] uppercase tracking-wider font-bold">Filtrar por Agente:</span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-transparent text-[#C9A962] font-primary text-xs uppercase tracking-wider font-bold outline-none cursor-pointer"
            >
              <option value="all">Todos los Leads</option>
              {agentsList.map(a => (
                <option key={a.id} value={a.id}>
                  {a.agent_name} ({a.role === 'admin' ? 'Admin' : 'Agente'})
                </option>
              ))}
            </select>
          </div>

          {captureLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => copyToClipboard(link.path, link.id)}
              className="group flex items-center gap-3 bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-2.5 rounded-sm hover:border-[#C9A962] transition-all"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-[#555555] uppercase font-bold tracking-tighter">Copiar Link</span>
                <span className={`text-xs font-bold uppercase tracking-wide ${link.color}`}>{link.label}</span>
              </div>
              {copiedLink === link.id ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-[#444444] group-hover:text-[#C9A962] transition-colors" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left column: List */}
        <div className="w-full lg:w-1/3 flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#1F1F1F] space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                type="text"
                placeholder="Buscar por nombre, email, teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333333] rounded-md pl-10 pr-4 py-2 text-sm text-[#FAF8F5] focus:border-[#C9A962] focus:ring-1 focus:ring-[#C9A962] outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterIntent}
                onChange={(e) => setFilterIntent(e.target.value)}
                className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none"
              >
                <option value="todos">Toda intención</option>
                <option value="alquilar">Alquilar (Inquilino)</option>
                <option value="alquilar_propietario">Alquilar (Propietario)</option>
                <option value="comprar">Comprar</option>
                <option value="vender">Vender</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none"
              >
                <option value="todos">Todo estado</option>
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="cualificado">Cualificado</option>
                <option value="cerrado">Cerrado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[#888888]">Cargando leads...</div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-[#888888]">No se encontraron leads</div>
            ) : (
              <div className="divide-y divide-[#1F1F1F]">
                {leads.map((lead: LeadCRM) => (
                  <button
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setNotes(lead.agent_notes || '');
                      setLeadMatches(null);
                    }}
                    className={`w-full text-left p-4 hover:bg-[#1A1A1A] transition-colors ${selectedLead?.id === lead.id ? 'bg-[#1A1A1A] border-l-2 border-[#C9A962]' : 'border-l-2 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-primary text-[#FAF8F5] font-medium">{lead.name || 'Sin nombre'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#888888] mb-1">
                      <span className="capitalize text-[#C9A962]">
                        {lead.intent === 'alquilar_propietario' ? 'Alquilar (Propietario)' : lead.intent}
                      </span>
                      <span>•</span>
                      <span>{format(new Date(lead.created_at), "d MMM yyyy HH:mm", { locale: es })}</span>
                    </div>
                    <div className="text-xs text-[#666666] truncate">{lead.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Details */}
        <div className="w-full lg:w-2/3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col">
          {selectedLead ? (
            <>
              <div className="p-6 border-b border-[#1F1F1F] flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-secondary text-[#FAF8F5]">{selectedLead.name}</h2>
                  <div className="flex flex-wrap gap-4 mt-2 font-primary text-sm text-[#888888]">
                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {selectedLead.email}</span>
                    {selectedLead.phone && <span className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedLead.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#888888] mr-2">Estado:</span>
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as LeadCRM['status'])}
                      className={`text-xs px-3 py-1.5 rounded-md border outline-none cursor-pointer uppercase tracking-wider ${getStatusColor(selectedLead.status)}`}
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="contactado">Contactado</option>
                      <option value="cualificado">Cualificado</option>
                      <option value="cerrado">Cerrado</option>
                      <option value="descartado">Descartado</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#888888] mr-2">Agente:</span>
                    <select
                      value={selectedLead.agent_id || ''}
                      onChange={(e) => handleAssignAgent(selectedLead.id, e.target.value || null)}
                      className="text-xs px-3 py-1.5 rounded-md border border-[#1F1F1F] outline-none cursor-pointer uppercase tracking-wider bg-[#1A1A1A] text-[#FAF8F5] focus:border-[#C9A962]"
                    >
                      <option value="">Sin Asignar</option>
                      {agentsList.map(a => (
                        <option key={a.id} value={a.id}>{a.agent_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="p-2 text-[#888888] hover:text-red-500 transition-colors border border-[#1F1F1F] rounded-md hover:border-red-500/20 bg-[#1A1A1A]"
                    title="Eliminar Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Intent Specific Details */}
                <section>
                  <h3 className="text-[#C9A962] font-primary text-sm uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2">
                    Detalles de la Solicitud ({selectedLead.intent})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 font-primary text-sm">
                    {/* Alquiler / Compra fields */}
                    {selectedLead.search_profile?.min_price || selectedLead.search_profile?.max_price ? (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Presupuesto</span>
                        <span className="text-[#FAF8F5]">
                          {selectedLead.search_profile.min_price ? `Desde ${selectedLead.search_profile.min_price}€` : ''} 
                          {selectedLead.search_profile.max_price ? ` Hasta ${selectedLead.search_profile.max_price}€` : ''}
                        </span>
                      </div>
                    ) : null}
                    
                    {selectedLead.search_profile?.preferred_zones && selectedLead.search_profile.preferred_zones.length > 0 && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Zonas</span>
                        <span className="text-[#FAF8F5]">{selectedLead.search_profile.preferred_zones.join(', ')}</span>
                      </div>
                    )}

                    {selectedLead.monthly_income && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Ingresos Mensuales</span>
                        <span className="text-[#FAF8F5]">{selectedLead.monthly_income}€ {selectedLead.income_provable ? '(Demostrables)' : ''}</span>
                      </div>
                    )}
                    
                    {selectedLead.occupation && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Ocupación</span>
                        <span className="text-[#FAF8F5]">{selectedLead.occupation}</span>
                      </div>
                    )}

                    {selectedLead.num_people && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Personas</span>
                        <span className="text-[#FAF8F5]">{selectedLead.num_people}</span>
                      </div>
                    )}

                    {/* Venta / Alquilar Propietario Fields */}
                    {selectedLead.sell_property_address && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Dirección a Vender</span>
                        <span className="text-[#FAF8F5]">{selectedLead.sell_property_address}</span>
                      </div>
                    )}
                    
                    {selectedLead.sell_property_type && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Tipo de Inmueble</span>
                        <span className="text-[#FAF8F5]">{selectedLead.sell_property_type}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Form Specific Details */}
                {(selectedLead.occupants || selectedLead.property_ad_url || selectedLead.property_features || selectedLead.rental_price) && (
                  <section>
                    <h3 className="text-[#C9A962] font-primary text-sm uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2">
                      Información Adicional del Formulario
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedLead.property_ad_url && (
                          <div className="col-span-full">
                            <span className="block text-[#666666] text-xs mb-1">URL del Anuncio</span>
                            <a 
                              href={selectedLead.property_ad_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[#C9A962] hover:underline flex items-center gap-1 text-sm break-all"
                            >
                              {selectedLead.property_ad_url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
                        )}
                        
                        {selectedLead.rental_price && (
                          <div>
                            <span className="block text-[#666666] text-xs mb-1">Precio Solicitado</span>
                            <span className="text-[#FAF8F5] text-sm font-medium">{selectedLead.rental_price}</span>
                          </div>
                        )}
                      </div>

                      {selectedLead.property_features && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Características de la Vivienda</span>
                          <div className="text-[#FAF8F5] text-sm bg-[#151515] p-3 rounded border border-[#333333] whitespace-pre-wrap">
                            {selectedLead.property_features}
                          </div>
                        </div>
                      )}

                      {selectedLead.occupants && selectedLead.occupants.length > 0 && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-3">Perfil de Ocupantes</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedLead.occupants.map((occ: { name?: string; age?: number | string; occupation?: string; income?: number | string }, i: number) => (
                              <div key={i} className="bg-[#151515] p-4 rounded border border-[#333333] shadow-sm">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#333333]/50">
                                  <User className="w-4 h-4 text-[#C9A962]" />
                                  <span className="font-primary font-bold text-[#FAF8F5] text-sm">Ocupante {i + 1}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs font-primary">
                                  <div>
                                    <span className="block text-[#666666] mb-0.5">Nombre</span>
                                    <span className="text-[#FAF8F5] font-medium">{occ.name || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[#666666] mb-0.5">Edad</span>
                                    <span className="text-[#FAF8F5] font-medium">{occ.age || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[#666666] mb-0.5">Ocupación</span>
                                    <span className="text-[#FAF8F5] font-medium">{occ.occupation || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[#666666] mb-0.5">Ingresos</span>
                                    <span className="text-[#C9A962] font-bold">{occ.income ? `${occ.income}€` : '-'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Reverse Matching (Mejora C) */}
                {(selectedLead.intent === 'alquilar' || selectedLead.intent === 'comprar') && selectedLead.search_profile && (
                  <section>
                    <div className="flex items-center justify-between mb-4 border-b border-[#1F1F1F] pb-2">
                      <h3 className="text-[#C9A962] font-primary text-sm uppercase tracking-wider">
                        Cruce Inverso Automático
                      </h3>
                      <button
                        onClick={async () => {
                          if (!selectedLead.search_profile) return;
                          setIsSearchingMatches(true);
                          const profile = selectedLead.search_profile;
                          const searchParams = {
                            operation: (profile.intent === 'alquilar' || profile.intent === 'comprar' || profile.intent === 'vender') 
                              ? profile.intent as 'alquilar' | 'comprar' | 'vender'
                              : 'alquilar' as const,
                            min_price: profile.min_price,
                            max_price: profile.max_price,
                            min_bedrooms: profile.min_bedrooms,
                            min_bathrooms: profile.min_bathrooms,
                            zones: profile.preferred_zones,
                            wants_terrace: profile.wants_terrace,
                            wants_parking: profile.wants_parking,
                            wants_pool: profile.wants_pool,
                            wants_elevator: profile.wants_elevator,
                            wants_furnished: profile.wants_furnished,
                            wants_air_conditioning: profile.wants_air_conditioning,
                            pets_needed: profile.pets_needed,
                            wants_garden: profile.wants_garden,
                            property_types: profile.property_types,
                            keywords: profile.search_keywords,
                          };
                          const matches = await searchPropertiesForBot(searchParams);
                          setLeadMatches(matches);
                          setIsSearchingMatches(false);
                        }}
                        disabled={isSearchingMatches}
                        className="text-xs bg-[#C9A962] text-[#0A0A0A] px-3 py-1.5 rounded uppercase font-bold hover:bg-[#D4B673] transition-colors disabled:opacity-50"
                      >
                        {isSearchingMatches ? 'Buscando...' : 'Buscar Coincidencias Ahora'}
                      </button>
                    </div>
                    
                    {leadMatches && leadMatches.length > 0 && (
                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {leadMatches.map(p => (
                          <div key={p.id} className="min-w-[200px] max-w-[200px] bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden flex-shrink-0">
                            <div className="h-24 bg-gray-800 relative">
                              {p.main_image && <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />}
                              <div className="absolute top-2 right-2 bg-[#C9A962] text-[#0A0A0A] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {p.score}% Match
                              </div>
                            </div>
                            <div className="p-2.5">
                              <h4 className="font-secondary text-xs text-[#FAF8F5] truncate mb-1">{p.title}</h4>
                              <p className="text-sm text-[#C9A962] font-semibold">{p.price}€</p>
                              <a href={`/propiedades/${p.reference || p.slug || p.id}`} target="_blank" rel="noreferrer" className="mt-2 block text-center py-1 border border-[#C9A962] text-[#C9A962] hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors rounded text-[10px] uppercase font-bold w-full">Ver Propiedad</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {leadMatches && leadMatches.length === 0 && (
                      <div className="text-sm text-[#888888] italic">No se encontraron propiedades que superen el 70% de coincidencia actualmente.</div>
                    )}
                  </section>
                )}

                {/* AI Chat Transcript */}
                {selectedLead.chat_transcript && selectedLead.chat_transcript.length > 0 && (
                  <section>
                    <h3 className="text-[#C9A962] font-primary text-sm uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2">
                      Transcripción del Chat
                    </h3>
                    <div className="bg-[#151515] rounded-md p-4 space-y-4 font-primary text-sm max-h-60 overflow-y-auto">
                      {selectedLead.chat_transcript.map((msg: { role: string; content: string }, i: number) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'bg-[#1F1F1F] text-[#FAF8F5]'}`}>
                            <p className="text-xs font-bold mb-1 opacity-60 uppercase">{msg.role === 'user' ? 'Cliente' : 'Gelabot'}</p>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Agent Notes */}
                <section>
                  <h3 className="text-[#C9A962] font-primary text-sm uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2">
                    Notas Internas
                  </h3>
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Añade notas sobre llamadas, estado de la negociación, etc..."
                      className="w-full bg-[#151515] border border-[#333333] rounded-md p-3 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none min-h-[120px] resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveNotes}
                        className="px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
                      >
                        Guardar Notas
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#888888] font-primary p-8 text-center">
              <MessageSquare className="w-12 h-12 text-[#1F1F1F] mb-4" />
              <p>Selecciona un lead de la lista para ver sus detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
