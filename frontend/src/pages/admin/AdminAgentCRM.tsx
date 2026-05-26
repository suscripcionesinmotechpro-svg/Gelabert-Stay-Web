import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users, Building2, Receipt, TrendingUp, Target, Clock, CheckCircle2, BarChart3, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AgentProfile {
  id: string;
  agent_name: string;
  role: string;
}

interface AgentStats {
  id: string;
  agent_name: string;
  role: string;
  properties_total: number;
  properties_published: number;
  properties_rent: number;
  properties_sale: number;
  invoices_total: number;
  invoices_income: number;
  invoices_expense: number;
  leads_total: number;
  leads_converted: number;
  tenants_total: number;
  contracts_active: number;
}

interface PropertyData {
  id: string;
  title: string;
  reference: string | null;
  price: number | null;
  operation: string;
  status: string;
  commercial_status: string | null;
  created_at: string;
  agent_id: string | null;
}

interface ContractData {
  id: string;
  start_date: string | null;
  end_date: string | null;
  property_label: string | null;
  monthly_rent: number | null;
  status: string;
  created_at: string;
  agent_id: string | null;
  tenant_id: string | null;
  tenant: {
    first_name: string;
    last_name: string;
  } | null;
}

interface InvoiceData {
  id: string;
  invoice_number: string | null;
  client_name: string;
  amount: number;
  total_amount: number;
  type: 'income' | 'expense';
  status: string;
  invoice_date: string | null;
  created_at: string;
  agent_id: string | null;
}

interface LeadData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  intent: string;
  created_at: string;
  agent_id: string | null;
}

interface TenantData {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  agent_id: string | null;
}

const emptyStats = (id: string, name: string, role: string): AgentStats => ({
  id,
  agent_name: name,
  role,
  properties_total: 0,
  properties_published: 0,
  properties_rent: 0,
  properties_sale: 0,
  invoices_total: 0,
  invoices_income: 0,
  invoices_expense: 0,
  leads_total: 0,
  leads_converted: 0,
  tenants_total: 0,
  contracts_active: 0,
});

export const AdminAgentCRM = () => {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Time filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // Raw fetched data for client-side filtering
  const [rawProperties, setRawProperties] = useState<PropertyData[]>([]);
  const [rawContracts, setRawContracts] = useState<ContractData[]>([]);
  const [rawInvoices, setRawInvoices] = useState<InvoiceData[]>([]);
  const [rawLeads, setRawLeads] = useState<LeadData[]>([]);
  const [rawTenants, setRawTenants] = useState<TenantData[]>([]);

  // Selected agent for detailed operations view
  const [detailAgentId, setDetailAgentId] = useState<string>('all');
  const [detailTab, setDetailTab] = useState<'properties' | 'contracts' | 'invoices' | 'leads'>('properties');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch agent profiles (both admin and agent roles)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, agent_name, role')
        .in('role', ['admin', 'agent']);

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }
      setAgents(profiles);

      // 2. Fetch all raw tables
      const [propsRes, contractsRes, invoicesRes, leadsRes, tenantsRes] = await Promise.all([
        supabase.from('properties').select('id, title, reference, price, operation, status, commercial_status, created_at, agent_id'),
        supabase.from('contracts').select('id, start_date, end_date, property_label, monthly_rent, status, created_at, agent_id, tenant_id, tenant:tenants(first_name, last_name)'),
        supabase.from('invoices').select('id, invoice_number, client_name, amount, total_amount, type, status, invoice_date, created_at, agent_id'),
        supabase.from('leads_crm').select('id, name, email, phone, status, intent, created_at, agent_id'),
        supabase.from('tenants').select('id, first_name, last_name, email, phone, created_at, agent_id')
      ]);

      setRawProperties((propsRes.data as unknown as PropertyData[]) || []);
      setRawContracts((contractsRes.data as unknown as ContractData[]) || []);
      setRawInvoices((invoicesRes.data as unknown as InvoiceData[]) || []);
      setRawLeads((leadsRes.data as unknown as LeadData[]) || []);
      setRawTenants((tenantsRes.data as unknown as TenantData[]) || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  // Helper to check if a date string falls within the selected period
  const matchPeriod = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    
    // Year check
    if (selectedYear !== 'all' && date.getFullYear() !== selectedYear) {
      return false;
    }

    // Month index: 0-11
    const month = date.getMonth(); 
    const monthNum = month + 1; // 1-12

    // Quarter check
    if (selectedQuarter !== 'all') {
      const qMonths: Record<number, number[]> = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12]
      };
      if (!qMonths[selectedQuarter].includes(monthNum)) {
        return false;
      }
    }

    // Month check
    if (selectedMonth !== 'all' && monthNum !== selectedMonth) {
      return false;
    }

    return true;
  };

  // Filtered raw lists based on selected period
  const filteredProperties = rawProperties.filter(p => matchPeriod(p.created_at));
  const filteredContracts = rawContracts.filter(c => matchPeriod(c.start_date || c.created_at));
  const filteredInvoices = rawInvoices.filter(i => matchPeriod(i.invoice_date || i.created_at));
  const filteredLeads = rawLeads.filter(l => matchPeriod(l.created_at));
  const filteredTenants = rawTenants.filter(t => matchPeriod(t.created_at));

  // Calculate statistics per agent + combined total
  const agentStatsList: AgentStats[] = agents.map(agent => {
    const s = emptyStats(agent.id, agent.agent_name, agent.role);

    // Filter metrics for this agent
    const pList = filteredProperties.filter(p => p.agent_id === agent.id);
    const cList = filteredContracts.filter(c => c.agent_id === agent.id);
    const iList = filteredInvoices.filter(i => i.agent_id === agent.id);
    const lList = filteredLeads.filter(l => l.agent_id === agent.id);
    const tList = filteredTenants.filter(t => t.agent_id === agent.id);

    s.properties_total = pList.length;
    s.properties_published = pList.filter(p => p.status === 'publicada').length;
    s.properties_rent = pList.filter(p => p.operation === 'alquiler').length;
    s.properties_sale = pList.filter(p => p.operation === 'venta').length;

    s.invoices_income = iList.filter(i => i.type === 'income').reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
    s.invoices_expense = iList.filter(i => i.type === 'expense').reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0);
    s.invoices_total = s.invoices_income; // Facturacion is usually total income

    s.leads_total = lList.length;
    s.leads_converted = lList.filter(l => l.status === 'cerrado').length;

    s.tenants_total = tList.length;
    s.contracts_active = cList.filter(c => c.status === 'active').length;

    return s;
  });

  // Calculate combined totals
  const totalStats: AgentStats = {
    id: 'all',
    agent_name: 'Total / Oficina',
    role: 'combined',
    properties_total: filteredProperties.length,
    properties_published: filteredProperties.filter(p => p.status === 'publicada').length,
    properties_rent: filteredProperties.filter(p => p.operation === 'alquiler').length,
    properties_sale: filteredProperties.filter(p => p.operation === 'venta').length,
    invoices_income: filteredInvoices.filter(i => i.type === 'income').reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0),
    invoices_expense: filteredInvoices.filter(i => i.type === 'expense').reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0),
    invoices_total: filteredInvoices.filter(i => i.type === 'income').reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0),
    leads_total: filteredLeads.length,
    leads_converted: filteredLeads.filter(l => l.status === 'cerrado').length,
    tenants_total: filteredTenants.length,
    contracts_active: filteredContracts.filter(c => c.status === 'active').length,
  };

  const allColumns = [...agentStatsList, totalStats];

  const formatEur = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const conversionRate = (leadsTotal: number, leadsConverted: number) =>
    leadsTotal > 0 ? ((leadsConverted / leadsTotal) * 100).toFixed(1) : '0.0';

  const metrics = [
    { key: 'Propiedades añadidas', icon: <Building2 className="w-4 h-4 text-[#C9A962]" />, getValue: (a: AgentStats) => a.properties_total },
    { key: 'Publicadas', icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, getValue: (a: AgentStats) => a.properties_published },
    { key: 'En Alquiler', icon: <TrendingUp className="w-4 h-4 text-blue-400" />, getValue: (a: AgentStats) => a.properties_rent },
    { key: 'En Venta', icon: <TrendingUp className="w-4 h-4 text-purple-400" />, getValue: (a: AgentStats) => a.properties_sale },
    { key: 'Facturación / Ingresos', icon: <Receipt className="w-4 h-4 text-[#C9A962]" />, getValue: (a: AgentStats) => formatEur(a.invoices_income) },
    { key: 'Gastos imputados', icon: <Receipt className="w-4 h-4 text-red-400" />, getValue: (a: AgentStats) => formatEur(a.invoices_expense) },
    { key: 'Balance neto', icon: <BarChart3 className="w-4 h-4 text-emerald-400" />, getValue: (a: AgentStats) => formatEur(a.invoices_income - a.invoices_expense) },
    { key: 'Leads recibidos', icon: <Target className="w-4 h-4 text-pink-400" />, getValue: (a: AgentStats) => a.leads_total },
    { key: 'Leads cerrados/ganados', icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />, getValue: (a: AgentStats) => a.leads_converted },
    { key: 'Tasa de conversión', icon: <BarChart3 className="w-4 h-4 text-orange-400" />, getValue: (a: AgentStats) => `${conversionRate(a.leads_total, a.leads_converted)}%` },
    { key: 'Inquilinos registrados', icon: <Users className="w-4 h-4 text-[#C9A962]" />, getValue: (a: AgentStats) => a.tenants_total },
    { key: 'Contratos activos', icon: <Clock className="w-4 h-4 text-indigo-400" />, getValue: (a: AgentStats) => a.contracts_active },
  ];

  // For Detail Operations List
  const detailProperties = filteredProperties.filter(p => detailAgentId === 'all' || p.agent_id === detailAgentId);
  const detailContracts = filteredContracts.filter(c => detailAgentId === 'all' || c.agent_id === detailAgentId);
  const detailInvoices = filteredInvoices.filter(i => detailAgentId === 'all' || i.agent_id === detailAgentId);
  const detailLeads = filteredLeads.filter(l => detailAgentId === 'all' || l.agent_id === detailAgentId);

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.2em]">Gerencial</span>
          </div>
          <h1 className="font-secondary text-3xl text-[#FAF8F5]">CRM de Agentes</h1>
          <p className="font-primary text-[#666666] text-sm mt-1">Métricas comparativas, rendimiento del equipo y operaciones</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-[#C9A962]">
          <Filter className="w-4 h-4" />
          <span className="font-primary text-xs uppercase tracking-wider font-bold">Filtros Periodo:</span>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs text-[#666]">Año:</span>
          <select
            value={selectedYear}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedYear(val === 'all' ? 'all' : parseInt(val));
            }}
            className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962]"
          >
            <option value="all">Todos</option>
            {Array.from({ length: 4 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Quarter Filter */}
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs text-[#666]">Trimestre:</span>
          <select
            value={selectedQuarter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedQuarter(val === 'all' ? 'all' : parseInt(val));
              if (val !== 'all') setSelectedMonth('all'); // Clear specific month if quarter is selected
            }}
            className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962]"
          >
            <option value="all">Todos</option>
            <option value={1}>Q1 (Ene - Mar)</option>
            <option value={2}>Q2 (Abr - Jun)</option>
            <option value={3}>Q3 (Jul - Sep)</option>
            <option value={4}>Q4 (Oct - Dic)</option>
          </select>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <span className="font-primary text-xs text-[#666]">Mes:</span>
          <select
            value={selectedMonth}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedMonth(val === 'all' ? 'all' : parseInt(val));
              if (val !== 'all') setSelectedQuarter('all'); // Clear quarter if specific month is selected
            }}
            className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-xs text-[#FAF8F5] outline-none focus:border-[#C9A962]"
          >
            <option value="all">Todos</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>

        {/* Selected Period indicator */}
        <div className="ml-auto font-primary text-[10px] uppercase tracking-widest text-[#666]">
          Filtrando por:{' '}
          <strong className="text-[#C9A962]">
            {selectedYear === 'all' ? 'Todos los Años' : selectedYear}{' '}
            {selectedQuarter !== 'all' ? `— Q${selectedQuarter}` : ''}{' '}
            {selectedMonth !== 'all' ? `— ${MONTH_NAMES[selectedMonth - 1]}` : ''}
          </strong>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[#0A0A0A] border border-[#1F1F1F] animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          {/* Comparative Table */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto rounded-sm shadow-xl">
            <div className="p-5 border-b border-[#1F1F1F] flex items-center justify-between">
              <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">KPIs Comparativos e Integrados</h2>
              <span className="font-primary text-[10px] text-[#555] uppercase tracking-wider">Side-by-Side</span>
            </div>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1F1F1F] bg-[#111]">
                  <th className="px-6 py-4 text-left font-primary text-[10px] text-[#666] uppercase tracking-wider">Métrica de Operación</th>
                  {allColumns.map(col => (
                    <th
                      key={col.id}
                      className={`px-6 py-4 text-center font-primary text-[10px] uppercase tracking-wider ${
                        col.id === 'all' ? 'text-[#C9A962] bg-[#C9A962]/5 font-bold border-l border-[#1F1F1F]' : 'text-[#FAF8F5]'
                      }`}
                    >
                      <span className="block text-xs">{col.agent_name}</span>
                      <span className="block text-[8px] text-[#444] font-normal tracking-wider mt-0.5">
                        {col.id === 'all' ? 'Oficina' : col.role === 'admin' ? 'Admin' : 'Agente'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {metrics.map((m, i) => (
                  <tr key={i} className={`hover:bg-[#0D0D0D] transition-colors ${i % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#070707]'}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {m.icon}
                        <span className="font-primary text-sm text-[#888]">{m.key}</span>
                      </div>
                    </td>
                    {allColumns.map(col => {
                      const val = m.getValue(col);
                      const isTotalCol = col.id === 'all';
                      return (
                        <td
                          key={col.id}
                          className={`px-6 py-3.5 text-center font-primary text-sm ${
                            isTotalCol 
                              ? 'text-[#C9A962] font-bold bg-[#C9A962]/5 border-l border-[#1F1F1F]' 
                              : 'text-[#FAF8F5]'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section: Detailed Operations */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-4">
              <div>
                <h3 className="font-secondary text-xl text-[#C9A962]">Detalle de Operaciones Individuales</h3>
                <p className="font-primary text-[#666] text-xs mt-1">Inspección de las transacciones del periodo seleccionado</p>
              </div>

              {/* Agent Filter selector for operations list */}
              <div className="flex items-center gap-2">
                <span className="font-primary text-xs text-[#666] uppercase">Ver Operaciones de:</span>
                <select
                  value={detailAgentId}
                  onChange={(e) => setDetailAgentId(e.target.value)}
                  className="h-9 bg-[#111] border border-[#1F1F1F] px-3 font-primary text-xs text-[#C9A962] font-bold outline-none focus:border-[#C9A962]"
                >
                  <option value="all">Juntos (Toda la Oficina)</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.agent_name} ({a.role === 'admin' ? 'Admin' : 'Agente'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List tabs */}
            <div className="flex border-b border-[#1F1F1F] bg-[#111] p-1 gap-1 self-start rounded-sm">
              {([
                { id: 'properties', label: 'Propiedades', count: detailProperties.length },
                { id: 'contracts', label: 'Contratos', count: detailContracts.length },
                { id: 'invoices', label: 'Facturas / Pagos', count: detailInvoices.length },
                { id: 'leads', label: 'Leads', count: detailLeads.length }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`px-4 py-2 font-primary text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                    detailTab === tab.id
                      ? 'bg-[#C9A962] text-[#0A0A0A]'
                      : 'text-[#666] hover:text-[#FAF8F5]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Tab content lists */}
            <div className="overflow-x-auto">
              {detailTab === 'properties' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Referencia</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Propiedad</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Operación</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-right">Precio</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-center">Estado</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F] font-primary text-xs">
                    {detailProperties.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#444] italic">No se registraron propiedades en este periodo</td>
                      </tr>
                    ) : (
                      detailProperties.map(p => (
                        <tr key={p.id} className="hover:bg-[#111] transition-colors">
                          <td className="px-4 py-3 font-bold text-[#C9A962]">{p.reference || 'S/R'}</td>
                          <td className="px-4 py-3 text-[#FAF8F5] font-semibold">{p.title}</td>
                          <td className="px-4 py-3 uppercase text-[#888]">{p.operation}</td>
                          <td className="px-4 py-3 text-right font-secondary font-bold text-[#C9A962]">{formatEur(p.price || 0)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest ${
                              p.status === 'publicada' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/admin/propiedades/${p.id}/editar`} className="text-[#C9A962] hover:underline font-bold">Editar →</Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {detailTab === 'contracts' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Inquilino</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Propiedad</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Vencimiento</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-right">Renta</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-center">Estado</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F] font-primary text-xs">
                    {detailContracts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#444] italic">No se registraron contratos en este periodo</td>
                      </tr>
                    ) : (
                      detailContracts.map(c => (
                        <tr key={c.id} className="hover:bg-[#111] transition-colors">
                          <td className="px-4 py-3 text-[#FAF8F5] font-semibold">
                            {c.tenant ? `${c.tenant.first_name} ${c.tenant.last_name}` : 'Sin nombre'}
                          </td>
                          <td className="px-4 py-3 text-[#888]">{c.property_label || 'Piso'}</td>
                          <td className="px-4 py-3 text-[#666]">{c.end_date ? new Date(c.end_date).toLocaleDateString('es-ES') : 'S/F'}</td>
                          <td className="px-4 py-3 text-right font-secondary font-bold text-[#C9A962]">{formatEur(c.monthly_rent || 0)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest ${
                              c.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/admin/contratos/${c.id}/editar`} className="text-[#C9A962] hover:underline font-bold">Editar →</Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {detailTab === 'invoices' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Nº Factura</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Cliente / Concepto</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-right">Total</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F] font-primary text-xs">
                    {detailInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#444] italic">No se registraron facturas en este periodo</td>
                      </tr>
                    ) : (
                      detailInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-[#111] transition-colors">
                          <td className="px-4 py-3 font-bold text-[#FAF8F5]">{inv.invoice_number || 'S/N'}</td>
                          <td className="px-4 py-3 text-[#888]">{inv.client_name}</td>
                          <td className="px-4 py-3 text-[#666]">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('es-ES') : 'S/F'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${inv.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                              {inv.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-secondary font-bold text-[#C9A962]">{formatEur(inv.total_amount || 0)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest ${
                              inv.status === 'pagado' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {detailTab === 'leads' && (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] bg-[#0E0E0E]">
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Contacto</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider">Intención</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-center">Estado</th>
                      <th className="px-4 py-3 font-primary text-[9px] text-[#666] uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F] font-primary text-xs">
                    {detailLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#444] italic">No se captaron leads en este periodo</td>
                      </tr>
                    ) : (
                      detailLeads.map(l => (
                        <tr key={l.id} className="hover:bg-[#111] transition-colors">
                          <td className="px-4 py-3 text-[#FAF8F5] font-semibold">{l.name}</td>
                          <td className="px-4 py-3 text-[#888]">
                            <div>{l.email}</div>
                            {l.phone && <div className="text-[10px] text-[#555]">{l.phone}</div>}
                          </td>
                          <td className="px-4 py-3 uppercase text-[#888] font-bold">{l.intent}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest bg-[#1F1F1F] text-[#FAF8F5]">
                              {l.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to="/admin/leads" className="text-[#C9A962] hover:underline font-bold">Ver Leads →</Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
