import { useState, useEffect } from 'react';
import { Search, MessageSquare, User, Trash2, Copy, Check, X } from 'lucide-react';
import type { LeadCRM, ScoredProperty } from '../../hooks/useLeadsCRM';
import { useLeadsCRM, updateLeadStatus, updateLeadNotes, searchPropertiesForBot, deleteLead, createLeadWithPropertyClone } from '../../hooks/useLeadsCRM';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth.tsx';

export const AgentLeadsCRM = () => {
  const { user, userProfile } = useAuth();
  const [filterAgent, setFilterAgent] = useState<'mine' | 'all'>('mine');
  const [filterIntent, setFilterIntent] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadCRM | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const [filterPropertyRef, setFilterPropertyRef] = useState<string>('');
  const [whatsAppModalData, setWhatsAppModalData] = useState<{ phone: string; text: string } | null>(null);
  
  const { leads, loading, refetch } = useLeadsCRM({
    intent: filterIntent,
    status: filterStatus,
    search: searchQuery,
    agentId: filterAgent === 'mine' ? user?.id : undefined,
    year: filterYear,
    month: filterMonth,
    propertyRef: filterPropertyRef,
  });

  const [notes, setNotes] = useState('');
  const [isSearchingMatches, setIsSearchingMatches] = useState(false);
  const [leadMatches, setLeadMatches] = useState<ScoredProperty[] | null>(null);
  const [agentsList, setAgentsList] = useState<{ id: string; agent_name: string }[]>([]);
  const [inquiryHistory, setInquiryHistory] = useState<any[]>([]);

  // Create Lead Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [newLeadIntent, setNewLeadIntent] = useState<'alquilar' | 'comprar'>('alquilar');
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    propertyRef: '',
    budget: '',
    zones: '',
    bedrooms: '1',
    hasPets: false,
    moveInDate: '',
    mortgageApproved: false,
  });

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, agent_name')
        .eq('role', 'agent');
      if (data) setAgentsList(data);
    };
    fetchAgents();
  }, []);

  // Auto-select lead from URL parameter '?id=xxxx'
  useEffect(() => {
    if (!loading && leads && leads.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLeadId = searchParams.get('id');
      if (urlLeadId) {
        const matchedLead = leads.find(l => l.id === urlLeadId);
        if (matchedLead) {
          setSelectedLead(matchedLead);
          setNotes(matchedLead.agent_notes || '');
          setLeadMatches(null);
          // Remove parameter from URL without page reload
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      }
    }
  }, [loading, leads]);

  // Auto-cruce properties when selectedLead changes
  useEffect(() => {
    const autoMatch = async () => {
      if (selectedLead && (selectedLead.intent === 'comprar' || selectedLead.intent === 'alquilar')) {
        setIsSearchingMatches(true);
        const profile = selectedLead.search_profile;
        const searchParams = {
          operation: (selectedLead.intent === 'comprar' ? 'comprar' : 'alquilar') as 'comprar' | 'alquilar',
          min_price: profile?.min_price || undefined,
          max_price: profile?.max_price || selectedLead.max_rent || selectedLead.max_buy_price || undefined,
          min_bedrooms: profile?.min_bedrooms || undefined,
          min_bathrooms: profile?.min_bathrooms || undefined,
          zones: profile?.preferred_zones || [],
          cities: profile?.preferred_cities || [],
          is_room_rental: selectedLead.target_property?.is_room_rental ?? undefined,
          exclude_property_id: selectedLead.target_property_id || undefined,
          wants_terrace: profile?.wants_terrace || undefined,
          wants_parking: profile?.wants_parking || undefined,
          wants_pool: profile?.wants_pool || undefined,
          wants_elevator: profile?.wants_elevator || undefined,
          wants_furnished: profile?.wants_furnished || undefined,
          wants_air_conditioning: profile?.wants_air_conditioning || undefined,
          pets_needed: profile?.pets_needed || selectedLead.has_pets || undefined,
          wants_garden: profile?.wants_garden || undefined,
          property_types: profile?.property_types || [],
          keywords: profile?.search_keywords || undefined,
          agent_id: user?.id || undefined,
        };
        const matches = await searchPropertiesForBot(searchParams);
        setLeadMatches(matches);
        setIsSearchingMatches(false);
      } else {
        setLeadMatches(null);
      }
    };
    autoMatch();
  }, [selectedLead]);

  // Fetch inquiry history when selectedLead changes
  useEffect(() => {
    const fetchInquiryHistory = async () => {
      if (selectedLead) {
        let query = supabase
          .from('inquiries')
          .select('*, property:properties(reference, price, zone, main_image, slug)')
          .order('created_at', { ascending: false });

        if (selectedLead.email && selectedLead.phone) {
          query = query.or(`email.eq.${selectedLead.email},phone.eq.${selectedLead.phone}`);
        } else if (selectedLead.email) {
          query = query.eq('email', selectedLead.email);
        } else if (selectedLead.phone) {
          query = query.eq('phone', selectedLead.phone);
        } else {
          setInquiryHistory([]);
          return;
        }

        const { data } = await query;
        if (data) {
          const processed = data.map((item: any) => ({
            ...item,
            property: Array.isArray(item.property) ? item.property[0] : item.property
          }));
          setInquiryHistory(processed);
        } else {
          setInquiryHistory([]);
        }
      } else {
        setInquiryHistory([]);
      }
    };
    fetchInquiryHistory();
  }, [selectedLead]);

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
      alert('Notas guardadas correctamente');
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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadData.name || !newLeadData.phone) {
      alert('Nombre y teléfono son obligatorios.');
      return;
    }

    const zonesArray = newLeadData.zones
      ? newLeadData.zones.split(',').map(z => z.trim()).filter(Boolean)
      : [];

    const leadInsertData: any = {
      intent: newLeadIntent,
      name: newLeadData.name,
      phone: newLeadData.phone,
      email: newLeadData.email,
      source: 'manual',
      num_people: 1,
      agent_id: user?.id || null, // Auto-assign to current agent
    };

    const searchProfileData: any = {
      preferred_zones: zonesArray,
      min_bedrooms: parseInt(newLeadData.bedrooms) || undefined,
      is_active: true,
    };

    if (newLeadIntent === 'alquilar') {
      leadInsertData.max_rent = newLeadData.budget ? parseFloat(newLeadData.budget) : undefined;
      leadInsertData.has_pets = newLeadData.hasPets;
      leadInsertData.move_in_date = newLeadData.moveInDate || undefined;

      searchProfileData.max_price = leadInsertData.max_rent;
      searchProfileData.pets_needed = newLeadData.hasPets;
    } else {
      leadInsertData.max_buy_price = newLeadData.budget ? parseFloat(newLeadData.budget) : undefined;
      leadInsertData.mortgage_approved = newLeadData.mortgageApproved;

      searchProfileData.max_price = leadInsertData.max_buy_price;
    }

    try {
      const result = await createLeadWithPropertyClone(
        leadInsertData,
        newLeadData.propertyRef || undefined,
        searchProfileData
      );

      if (result) {
        setIsCreateModalOpen(false);
        setCreateStep(1);
        setNewLeadData({
          name: '',
          phone: '',
          email: '',
          propertyRef: '',
          budget: '',
          zones: '',
          bedrooms: '1',
          hasPets: false,
          moveInDate: '',
          mortgageApproved: false,
        });
        refetch();
        alert('Lead creado exitosamente');
      } else {
        alert('Error al crear el lead');
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear el lead');
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

  const getWhatsAppDetails = (leadPhone: string, intent: string, property: { reference: string; slug: string; is_room_rental?: boolean }) => {
    const cleanPhone = leadPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('34') || cleanPhone.length > 9 ? cleanPhone : `34${cleanPhone}`;
    
    const isRoom = property.is_room_rental || false;
    const propertyTypeStr = isRoom ? 'habitación' : 'propiedad';
    
    const originUrl = `https://gelaberthomes.es/propiedades/${property.slug || property.reference}`;
    
    const rawName = selectedLead?.name || '';
    const isGeneric = !rawName || rawName.toLowerCase().includes('contacto') || rawName.toLowerCase().includes('idealista');
    const formattedName = isGeneric 
      ? '' 
      : ` ${rawName.split(' ')[0].charAt(0).toUpperCase() + rawName.split(' ')[0].slice(1).toLowerCase()}`;

    const agentName = userProfile?.agent_name || 'Jose';
    let text = '';
    if (intent === 'alquilar') {
      text = `Hola${formattedName}, mi nombre es ${agentName}, y le escribo de Gelabert Homes, tenemos una solicitud de información con respecto a la siguiente ${propertyTypeStr} en alquiler 👇\n\n${originUrl}\n\nDéjeme saber en qué horario le vendría bien agendar una llamada y le brindaremos toda la información. Un saludo`;
    } else {
      text = `Hola${formattedName}, mi nombre es ${agentName}, y le escribo de Gelabert Homes, tenemos una solicitud de información con respecto a la siguiente propiedad en venta 👇\n\n${originUrl}\n\nDéjeme saber en qué horario le vendría bien agendar una llamada y le brindaremos toda la información. Un saludo`;
    }
    
    // Add suggested properties if available
    if (leadMatches && leadMatches.length > 0) {
      const suggestions = leadMatches.filter(p => p.reference !== property.reference).slice(0, 3);
      if (suggestions.length > 0) {
        text += `\n\nPropiedades sugeridas que creemos que también pueden encajar contigo:`;
        suggestions.forEach(s => {
          text += `\n- https://gelaberthomes.es/propiedades/${s.slug || s.reference}`;
        });
      }
    }
    
    return { phone: phoneWithCountry, text };
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
          {/* New Lead Button */}
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setCreateStep(1);
            }}
            className="bg-[#C9A962] hover:bg-[#D4B673] text-[#0A0A0A] font-primary text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm transition-all"
          >
            + Nuevo Lead
          </button>

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
        {/* Left column: List (Idealista style) */}
        <div className="w-full lg:w-1/3 flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 border-b border-[#1F1F1F]">
            <button
              onClick={() => setFilterAgent('mine')}
              className={`py-3 text-xs font-primary uppercase font-bold tracking-wider text-center border-b-2 transition-all ${filterAgent === 'mine' ? 'border-[#C9A962] text-[#C9A962] bg-[#111]' : 'border-transparent text-[#666] hover:text-[#FAF8F5]'}`}
            >
              Mis Leads
            </button>
            <button
              onClick={() => setFilterAgent('all')}
              className={`py-3 text-xs font-primary uppercase font-bold tracking-wider text-center border-b-2 transition-all ${filterAgent === 'all' ? 'border-[#C9A962] text-[#C9A962] bg-[#111]' : 'border-transparent text-[#666] hover:text-[#FAF8F5]'}`}
            >
              Todos los Leads
            </button>
          </div>
          
          <div className="p-4 border-b border-[#1F1F1F] space-y-3">
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
                className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-xs text-[#FAF8F5] focus:border-[#C9A962] outline-none"
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
                className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-xs text-[#FAF8F5] focus:border-[#C9A962] outline-none"
              >
                <option value="todos">Todo estado</option>
                <option value="nuevo">Pendiente de contactar</option>
                <option value="contactado">Contactado</option>
                <option value="cualificado">Cualificado</option>
                <option value="cerrado">Cerrado</option>
                <option value="descartado">Descartado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  if (e.target.value === 'todos') {
                    setFilterMonth('todos');
                  }
                }}
                className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-xs text-[#FAF8F5] focus:border-[#C9A962] outline-none"
              >
                <option value="todos">Cualquier Año</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                disabled={filterYear === 'todos'}
                className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-xs text-[#FAF8F5] focus:border-[#C9A962] outline-none disabled:opacity-50"
              >
                <option value="todos">Cualquier Mes</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por Ref. de Propiedad (ej. GH-101)..."
                value={filterPropertyRef}
                onChange={(e) => setFilterPropertyRef(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333333] rounded-md px-3 py-2 text-xs text-[#FAF8F5] focus:border-[#C9A962] focus:ring-1 focus:ring-[#C9A962] outline-none"
              />
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
                    className={`w-full text-left p-3 hover:bg-[#1A1A1A] transition-colors flex gap-3 relative ${selectedLead?.id === lead.id ? 'bg-[#1A1A1A] border-l-2 border-[#C9A962]' : 'border-l-2 border-transparent'}`}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-[#151515] rounded border border-[#333333] flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                      {lead.target_property?.main_image ? (
                        <img src={lead.target_property.main_image} alt={lead.target_property.reference} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">
                          {lead.intent === 'comprar' ? '🏦' : '🔑'}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={lead.status === 'contactado'}
                            onChange={async (e) => {
                              e.stopPropagation();
                              const newStatus = lead.status === 'contactado' ? 'nuevo' : 'contactado';
                              await handleUpdateStatus(lead.id, newStatus);
                            }}
                            className="w-3.5 h-3.5 accent-[#C9A962] border-[#333] rounded bg-[#111] cursor-pointer flex-shrink-0"
                          />
                          <span className="font-primary text-[#FAF8F5] font-bold text-sm truncate">{lead.name || 'Sin nombre'}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-[#88] truncate mb-1">
                        {lead.phone || lead.email || 'Sin contacto'}
                      </div>

                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {/* Intent */}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111] border border-[#222] text-[#C9A962] font-semibold uppercase tracking-wider">
                          {lead.intent === 'comprar' ? 'Compra' : lead.intent === 'alquilar' ? 'Alquiler' : lead.intent}
                        </span>

                        {/* Source */}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#222] text-gray-300 font-medium capitalize">
                          {lead.source || 'Manual'}
                        </span>

                        {/* Status */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${getStatusColor(lead.status)}`}>
                          {lead.status === 'nuevo' ? 'pendiente' : lead.status}
                        </span>

                        {/* Occupation Tag */}
                        {lead.occupation && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9A962]/10 border border-[#C9A962]/20 text-[#C9A962] font-semibold uppercase tracking-wider">
                            👤 {lead.occupation}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Absolute Time & Ver piso Link */}
                    <div className="absolute right-3 top-3 text-[9px] text-gray-500 font-mono">
                      {format(new Date(lead.created_at), "dd/MM", { locale: es })}
                    </div>

                    {lead.target_property && (
                      <a
                        href={`/propiedades/${lead.target_property.slug || lead.target_property.reference}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-3 right-3 text-[9px] bg-[#0A0A0A] hover:bg-[#C9A962] text-[#FAF8F5] hover:text-[#0A0A0A] px-2 py-0.5 rounded border border-[#333] transition-colors uppercase font-bold"
                      >
                        Piso
                      </a>
                    )}
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
              {/* Detail Header with quick action buttons */}
              <div className="p-6 border-b border-[#1F1F1F] flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-secondary text-[#FAF8F5]">{selectedLead.name}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#222] text-gray-300 font-medium capitalize border border-[#333]">
                      Origen: {selectedLead.source || 'Manual'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 font-primary text-xs text-[#888888] uppercase tracking-wider">
                    {selectedLead.email && <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {selectedLead.email}</span>}
                    {selectedLead.phone && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedLead.phone}</span>}
                    <span>Fecha: {format(new Date(selectedLead.created_at), "d MMMM yyyy HH:mm", { locale: es })}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto items-end">
                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedLead.id, 'nuevo')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${selectedLead.status === 'nuevo' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-blue-400 border-blue-500/20 hover:bg-blue-500/10'}`}
                    >
                      ⏳ Pendiente
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedLead.id, selectedLead.status === 'contactado' ? 'nuevo' : 'contactado')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${selectedLead.status === 'contactado' ? 'bg-yellow-500 text-[#0A0A0A] border-yellow-500' : 'bg-transparent text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10'}`}
                    >
                      ✅ Contactado
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedLead.id, selectedLead.status === 'cualificado' ? 'nuevo' : 'cualificado')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${selectedLead.status === 'cualificado' ? 'bg-purple-500 text-white border-purple-500' : 'bg-transparent text-purple-400 border-purple-500/20 hover:bg-purple-500/10'}`}
                    >
                      ⭐ Cualificar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedLead.id, selectedLead.status === 'descartado' ? 'nuevo' : 'descartado')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${selectedLead.status === 'descartado' ? 'bg-red-500 text-white border-red-500' : 'bg-transparent text-red-400 border-red-500/20 hover:bg-red-500/10'}`}
                    >
                      ✖ Descartar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedLead.id, selectedLead.status === 'cerrado' ? 'nuevo' : 'cerrado')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${selectedLead.status === 'cerrado' ? 'bg-green-500 text-[#0A0A0A] border-green-500' : 'bg-transparent text-green-400 border-green-500/20 hover:bg-green-500/10'}`}
                    >
                      🔒 Cerrar
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#888888] font-bold uppercase tracking-wider mr-1">Asignar Agente:</span>
                    <select
                      value={selectedLead.agent_id || ''}
                      onChange={(e) => handleAssignAgent(selectedLead.id, e.target.value || null)}
                      className="text-xs px-2.5 py-1.5 rounded border border-[#1F1F1F] outline-none cursor-pointer uppercase tracking-wider bg-[#1A1A1A] text-[#FAF8F5] focus:border-[#C9A962]"
                    >
                      <option value="">Sin Asignar</option>
                      {agentsList.map(a => (
                        <option key={a.id} value={a.id}>{a.agent_name}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeleteLead(selectedLead.id)}
                      className="p-1.5 text-[#888888] hover:text-red-500 transition-colors border border-[#1F1F1F] rounded hover:border-red-500/20 bg-[#1A1A1A]"
                      title="Eliminar Lead"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Main target property of interest */}
                {selectedLead.target_property && (
                  <section className="bg-[#111] border border-[#1F1F1F] rounded-lg p-4 flex flex-col md:flex-row gap-4 items-center">
                    {selectedLead.target_property.main_image && (
                      <img
                        src={selectedLead.target_property.main_image}
                        alt={selectedLead.target_property.reference}
                        className="w-full md:w-32 h-24 object-cover rounded border border-[#333] flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 text-center md:text-left">
                      <span className="text-[9px] text-[#88] uppercase font-bold tracking-wider block">Propiedad de interés principal</span>
                      <h4 className="font-secondary text-lg text-[#FAF8F5] mt-0.5">
                        Ref: {selectedLead.target_property.reference}
                      </h4>
                      <p className="text-sm text-[#C9A962] font-semibold mt-1">
                        {selectedLead.target_property.price}€ • {selectedLead.target_property.zone}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <a
                        href={`/propiedades/${selectedLead.target_property.slug || selectedLead.target_property.reference}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#1A1A1A] border border-[#33] hover:border-[#C9A962] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm text-center transition-all block"
                      >
                        Ver Ficha
                      </a>
                      {selectedLead.phone && (
                        <button
                          onClick={() => setWhatsAppModalData(getWhatsAppDetails(selectedLead.phone!, selectedLead.intent, selectedLead.target_property!))}
                          className="bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm text-center flex items-center justify-center gap-1.5 transition-all block w-full"
                        >
                          💬 WhatsApp
                        </button>
                      )}
                    </div>
                  </section>
                )}

                {/* Perfil del Inquilino / Solvencia */}
                {(selectedLead.occupation || selectedLead.monthly_income || selectedLead.employment_seniority || selectedLead.num_people !== null || selectedLead.has_pets !== null || selectedLead.age || selectedLead.nationality || selectedLead.city_origin) && (
                  <section className="bg-[#111]/40 border border-[#1F1F1F] rounded-lg p-5">
                    <h3 className="text-[#C9A962] font-primary text-xs uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2 font-bold flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Perfil del Inquilino
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm font-primary">
                      {selectedLead.occupation && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Ocupación / Situación</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.occupation}</span>
                        </div>
                      )}
                      {selectedLead.monthly_income && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Ingresos Mensuales</span>
                          <span className="text-[#FAF8F5] font-semibold">{Number(selectedLead.monthly_income).toLocaleString('es-ES')} €</span>
                        </div>
                      )}
                      {selectedLead.employment_seniority && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Antigüedad / Contrato</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.employment_seniority}</span>
                        </div>
                      )}
                      {selectedLead.num_people !== null && selectedLead.num_people !== undefined && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Nº Personas</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.num_people}</span>
                        </div>
                      )}
                      {selectedLead.age && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Edad</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.age} años</span>
                        </div>
                      )}
                      {selectedLead.nationality && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Nacionalidad</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.nationality}</span>
                        </div>
                      )}
                      {selectedLead.city_origin && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Origen</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.city_origin}</span>
                        </div>
                      )}
                      {selectedLead.has_pets !== null && selectedLead.has_pets !== undefined && (
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Mascotas</span>
                          <span className="text-[#FAF8F5] font-semibold">{selectedLead.has_pets ? 'Sí tiene' : 'No tiene'}</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Lead Search Profile Summary */}
                <section className="bg-[#111]/40 border border-[#1F1F1F] rounded-lg p-5">
                  <h3 className="text-[#C9A962] font-primary text-xs uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2 font-bold">
                    Perfil de Búsqueda
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm font-primary">
                    <div>
                      <span className="block text-[#666666] text-xs mb-1">Presupuesto Máximo</span>
                      <span className="text-[#FAF8F5] font-semibold">
                        {selectedLead.max_rent || selectedLead.max_buy_price || selectedLead.search_profile?.max_price
                          ? `${selectedLead.max_rent || selectedLead.max_buy_price || selectedLead.search_profile?.max_price}€`
                          : 'No especificado'}
                      </span>
                    </div>
                    
                    <div>
                      <span className="block text-[#666666] text-xs mb-1">Zonas Preferidas</span>
                      <span className="text-[#FAF8F5]">
                        {selectedLead.search_profile?.preferred_zones && selectedLead.search_profile.preferred_zones.length > 0
                          ? selectedLead.search_profile.preferred_zones.join(', ')
                          : 'Cualquiera'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[#666666] text-xs mb-1">Habitaciones Mínimas</span>
                      <span className="text-[#FAF8F5]">
                        {selectedLead.search_profile?.min_bedrooms || 'Cualquiera'}
                      </span>
                    </div>

                    {selectedLead.intent === 'comprar' && (
                      <div>
                        <span className="block text-[#666666] text-xs mb-1">Hipoteca Aprobada</span>
                        <span className="text-[#FAF8F5]">
                          {selectedLead.mortgage_approved ? 'Sí' : 'No / No especificado'}
                        </span>
                      </div>
                    )}

                    {selectedLead.intent === 'alquilar' && (
                      <>
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Fecha Entrada</span>
                          <span className="text-[#FAF8F5]">
                            {selectedLead.move_in_date
                              ? format(new Date(selectedLead.move_in_date), "dd/MM/yyyy")
                              : 'Inmediata / No especificada'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[#666666] text-xs mb-1">Tiene Mascotas</span>
                          <span className="text-[#FAF8F5]">
                            {selectedLead.has_pets ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Suggested Matches (Carrusel) */}
                {(selectedLead.intent === 'alquilar' || selectedLead.intent === 'comprar') && (
                  <section className="bg-[#111]/40 border border-[#1F1F1F] rounded-lg p-5">
                    <h3 className="text-[#C9A962] font-primary text-xs uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2 font-bold">
                      Propiedades Sugeridas
                    </h3>
                    
                    {isSearchingMatches ? (
                      <div className="py-4 text-[#888888] text-xs italic">Buscando coincidencias por perfil...</div>
                    ) : leadMatches && leadMatches.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar">
                        {leadMatches.map(p => (
                          <div key={p.id} className="min-w-[200px] max-w-[200px] bg-[#111] border border-[#1F1F1F] rounded-lg overflow-hidden flex-shrink-0 flex flex-col justify-between">
                            <div>
                              <div className="h-24 bg-[#1A1A1A] relative">
                                {p.main_image ? (
                                  <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">Sin foto</div>
                                )}
                                <div className="absolute top-2 right-2 bg-[#C9A962] text-[#0A0A0A] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {p.score}% Match
                                </div>
                              </div>
                              <div className="p-2.5">
                                <span className="text-[8px] text-[#88] uppercase block">Ref: {p.reference}</span>
                                <h4 className="font-secondary text-xs text-[#FAF8F5] truncate mt-0.5" title={p.title}>{p.title}</h4>
                                <p className="text-xs text-[#C9A962] font-semibold mt-1">{p.price}€</p>
                                <p className="text-[9px] text-gray-500 truncate mt-0.5">{p.zone}</p>
                              </div>
                            </div>
                            <div className="p-2.5 pt-0 flex gap-1">
                              <a
                                href={`/propiedades/${p.slug || p.reference}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 text-center py-1 border border-[#333] text-[#FAF8F5] hover:border-[#C9A962] transition-colors rounded text-[9px] uppercase font-bold"
                              >
                                Ficha
                              </a>
                              {selectedLead.phone && (
                                <button
                                  onClick={() => setWhatsAppModalData(getWhatsAppDetails(selectedLead.phone!, selectedLead.intent, p))}
                                  className="flex-1 text-center py-1 bg-[#25D366] hover:bg-[#20ba5a] text-black transition-colors rounded text-[9px] uppercase font-bold flex items-center justify-center gap-0.5"
                                >
                                  <span>WhatsApp</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[#888888] italic py-2">No se encontraron propiedades que superen el 70% de coincidencia actualmente.</div>
                    )}
                  </section>
                )}

                {/* Historial de Consultas Web */}
                {inquiryHistory && inquiryHistory.length > 0 && (
                  <section className="bg-[#111]/40 border border-[#1F1F1F] rounded-lg p-5">
                    <h3 className="text-[#C9A962] font-primary text-xs uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2 font-bold">
                      Historial de Consultas Web
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {inquiryHistory.map((inq) => (
                        <div key={inq.id} className="bg-[#151515] p-3 rounded border border-[#1F1F1F] flex gap-3 text-xs">
                          {inq.property?.main_image && (
                            <img
                              src={inq.property.main_image}
                              alt={inq.property.reference}
                              className="w-16 h-12 object-cover rounded border border-[#333] flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-[#FAF8F5]">
                                {inq.property ? `Ref: ${inq.property.reference}` : 'Consulta General'}
                              </span>
                              <span className="text-[9px] text-[#666] font-mono">
                                {format(new Date(inq.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                              </span>
                            </div>
                            {inq.property && (
                              <p className="text-[10px] text-[#C9A962] font-semibold">
                                {inq.property.price}€ • {inq.property.zone}
                              </p>
                            )}
                            <p className="text-gray-400 mt-1 italic whitespace-pre-wrap">
                              "{inq.message || 'Sin mensaje'}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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
                            <p className="text-xs font-bold mb-1 opacity-60 uppercase">{msg.role === 'user' ? 'Cliente' : 'Asistente'}</p>
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
                        className="px-4 py-2 bg-[#C9A962] text-[#0A0A0A] font-primary text-xs font-bold uppercase tracking-wider hover:bg-[#D4B673] transition-colors rounded-sm"
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
              <p className="uppercase tracking-wider text-xs font-bold">Selecciona un lead de la lista para ver sus detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* New Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#111]">
              <h3 className="text-xs font-secondary uppercase text-[#C9A962] tracking-wider font-bold">
                Nuevo Lead — Paso {createStep} de 2
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#888] hover:text-[#FAF8F5] text-sm"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              {createStep === 1 ? (
                <div className="space-y-4">
                  <label className="block text-xs uppercase font-bold text-[#888] tracking-wider">
                    Tipo de Intención
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewLeadIntent('comprar')}
                      className={`p-6 rounded border text-center transition-all flex flex-col items-center justify-center gap-2 ${newLeadIntent === 'comprar' ? 'bg-[#C9A962]/10 border-[#C9A962] text-[#C9A962]' : 'bg-[#111] border-[#1F1F1F] text-gray-400 hover:border-gray-700'}`}
                    >
                      <span className="text-3xl">🏦</span>
                      <span className="text-sm font-bold uppercase tracking-wide">Comprador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewLeadIntent('alquilar')}
                      className={`p-6 rounded border text-center transition-all flex flex-col items-center justify-center gap-2 ${newLeadIntent === 'alquilar' ? 'bg-[#C9A962]/10 border-[#C9A962] text-[#C9A962]' : 'bg-[#111] border-[#1F1F1F] text-gray-400 hover:border-gray-700'}`}
                    >
                      <span className="text-3xl">🔑</span>
                      <span className="text-sm font-bold uppercase tracking-wide">Inquilino (Alquiler)</span>
                    </button>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setCreateStep(2)}
                      className="bg-[#C9A962] hover:bg-[#D4B673] text-[#0A0A0A] font-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={newLeadData.name}
                        onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Teléfono *</label>
                      <input
                        type="text"
                        required
                        value={newLeadData.phone}
                        onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Email</label>
                      <input
                        type="email"
                        value={newLeadData.email}
                        onChange={(e) => setNewLeadData({ ...newLeadData, email: e.target.value })}
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Ref. Inmueble Interés (Opcional)</label>
                      <input
                        type="text"
                        placeholder="ej. GH-101"
                        value={newLeadData.propertyRef}
                        onChange={(e) => setNewLeadData({ ...newLeadData, propertyRef: e.target.value })}
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Presupuesto Máximo (€)</label>
                      <input
                        type="number"
                        value={newLeadData.budget}
                        onChange={(e) => setNewLeadData({ ...newLeadData, budget: e.target.value })}
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Habitaciones Mínimas</label>
                      <select
                        value={newLeadData.bedrooms}
                        onChange={(e) => setNewLeadData({ ...newLeadData, bedrooms: e.target.value })}
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#888] mb-1">Zonas Preferidas (separadas por comas)</label>
                    <input
                      type="text"
                      placeholder="ej. El Palo, Pedregalejo, Centro"
                      value={newLeadData.zones}
                      onChange={(e) => setNewLeadData({ ...newLeadData, zones: e.target.value })}
                      className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                    />
                  </div>

                  {newLeadIntent === 'comprar' ? (
                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="mortgageApproved"
                        checked={newLeadData.mortgageApproved}
                        onChange={(e) => setNewLeadData({ ...newLeadData, mortgageApproved: e.target.checked })}
                        className="rounded border-[#1F1F1F] bg-[#111] text-[#C9A962] focus:ring-[#C9A962]"
                      />
                      <label htmlFor="mortgageApproved" className="text-xs text-[#88] uppercase font-bold select-none cursor-pointer">
                        ¿Tiene Hipoteca Aprobada?
                      </label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hasPets"
                          checked={newLeadData.hasPets}
                          onChange={(e) => setNewLeadData({ ...newLeadData, hasPets: e.target.checked })}
                          className="rounded border-[#1F1F1F] bg-[#111] text-[#C9A962] focus:ring-[#C9A962]"
                        />
                        <label htmlFor="hasPets" className="text-xs text-[#88] uppercase font-bold select-none cursor-pointer">
                          ¿Tiene Mascotas?
                        </label>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#88] mb-1">Fecha Entrada Deseada</label>
                        <input
                          type="date"
                          value={newLeadData.moveInDate}
                          onChange={(e) => setNewLeadData({ ...newLeadData, moveInDate: e.target.value })}
                          className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-[#1F1F1F]">
                    <button
                      type="button"
                      onClick={() => setCreateStep(1)}
                      className="border border-[#333] hover:border-[#555] text-gray-300 font-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="bg-[#C9A962] hover:bg-[#D4B673] text-[#0A0A0A] font-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all"
                    >
                      Crear Lead
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {whatsAppModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#1F1F1F] flex justify-between items-center bg-[#111]">
              <h3 className="text-xs font-secondary uppercase text-[#C9A962] tracking-wider font-bold">
                Enviar Mensaje por WhatsApp
              </h3>
              <button
                onClick={() => setWhatsAppModalData(null)}
                className="text-[#888] hover:text-[#FAF8F5] p-1 rounded hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#888] mb-1.5 tracking-wider">
                  Teléfono Destinatario
                </label>
                <input
                  type="text"
                  readOnly
                  value={whatsAppModalData.phone}
                  className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#888888] outline-none focus:border-[#C9A962]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#888] mb-1.5 tracking-wider">
                  Texto del Mensaje
                </label>
                <textarea
                  value={whatsAppModalData.text}
                  onChange={(e) => setWhatsAppModalData({ ...whatsAppModalData, text: e.target.value })}
                  className="w-full bg-[#111] border border-[#1F1F1F] rounded px-3 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] min-h-[180px] resize-none font-primary"
                  placeholder="Escribe el mensaje..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1F1F1F]">
                <button
                  type="button"
                  onClick={() => setWhatsAppModalData(null)}
                  className="border border-[#333] hover:border-[#555] text-gray-300 font-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all"
                >
                  Cancelar
                </button>
                <a
                  href={`https://wa.me/${whatsAppModalData.phone}?text=${encodeURIComponent(whatsAppModalData.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsAppModalData(null)}
                  className="bg-[#25D366] hover:bg-[#20ba5a] text-black font-primary text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm text-center transition-all flex items-center justify-center gap-1.5"
                >
                  💬 Enviar WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
