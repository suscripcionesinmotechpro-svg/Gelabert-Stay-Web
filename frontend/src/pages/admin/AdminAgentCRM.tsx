import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users, Building2, Receipt, TrendingUp, AlertTriangle,
  Trophy, Target, Clock, CheckCircle2, BarChart3
} from 'lucide-react';

interface AgentStats {
  id: string;
  agent_name: string;
  email: string;
  properties_total: number;
  properties_published: number;
  properties_rent: number;
  properties_sale: number;
  invoices_total: number;
  invoices_month: number;
  leads_total: number;
  leads_converted: number;
  tenants_total: number;
  contracts_active: number;
  last_activity: string | null;
}

const emptyStats = (id: string, name: string, email: string): AgentStats => ({
  id, agent_name: name, email,
  properties_total: 0, properties_published: 0,
  properties_rent: 0, properties_sale: 0,
  invoices_total: 0, invoices_month: 0,
  leads_total: 0, leads_converted: 0,
  tenants_total: 0, contracts_active: 0,
  last_activity: null,
});

export const AdminAgentCRM = () => {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentStats = async () => {
      setLoading(true);

      // Fetch all agent profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, agent_name, role')
        .eq('role', 'agent');

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch emails from auth (via RPC if available, else use profiles)
      const statsPromises = profiles.map(async (profile) => {
        const agentId = profile.id;
        const s = emptyStats(agentId, profile.agent_name || 'Agente', '');

        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [props, propsPublished, propsRent, propsSale,
               invoicesAll, invoicesMonth,
               leadsAll, leadsConverted,
               tenantsAll, contractsActive] = await Promise.all([
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', agentId),
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).eq('status', 'publicada'),
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).eq('operation', 'alquiler'),
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).eq('operation', 'venta'),
          supabase.from('invoices').select('amount', { count: 'exact' }).eq('agent_id', agentId),
          supabase.from('invoices').select('amount', { count: 'exact' }).eq('agent_id', agentId).gte('created_at', firstOfMonth),
          supabase.from('leads_crm').select('id', { count: 'exact', head: true }).eq('agent_id', agentId),
          supabase.from('leads_crm').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).eq('status', 'convertido'),
          supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('agent_id', agentId),
          supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('agent_id', agentId).eq('status', 'active'),
        ]);

        // Sum invoice amounts
        const totalAmount = (invoicesAll.data || []).reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);
        const monthAmount = (invoicesMonth.data || []).reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);

        s.properties_total = props.count || 0;
        s.properties_published = propsPublished.count || 0;
        s.properties_rent = propsRent.count || 0;
        s.properties_sale = propsSale.count || 0;
        s.invoices_total = totalAmount;
        s.invoices_month = monthAmount;
        s.leads_total = leadsAll.count || 0;
        s.leads_converted = leadsConverted.count || 0;
        s.tenants_total = tenantsAll.count || 0;
        s.contracts_active = contractsActive.count || 0;

        return s;
      });

      const results = await Promise.all(statsPromises);
      setAgents(results);
      setLoading(false);
    };

    fetchAgentStats();
  }, []);

  const formatEur = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const conversionRate = (agent: AgentStats) =>
    agent.leads_total > 0 ? ((agent.leads_converted / agent.leads_total) * 100).toFixed(1) : '0.0';

  // Alerts
  const alerts: { type: string; message: string }[] = [];
  agents.forEach(a => {
    if (a.properties_total === 0) alerts.push({ type: 'warning', message: `${a.agent_name} no tiene propiedades registradas.` });
    if (a.leads_total > 0 && a.leads_converted === 0) alerts.push({ type: 'info', message: `${a.agent_name} tiene ${a.leads_total} leads sin convertir.` });
  });

  const topByProps = agents.length > 0 ? [...agents].sort((a, b) => b.properties_published - a.properties_published)[0] : null;
  const topByInvoices = agents.length > 0 ? [...agents].sort((a, b) => b.invoices_total - a.invoices_total)[0] : null;

  const metrics = [
    { key: 'Propiedades totales', icon: <Building2 className="w-4 h-4" />, getValue: (a: AgentStats) => a.properties_total },
    { key: 'Publicadas', icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, getValue: (a: AgentStats) => a.properties_published },
    { key: 'En Alquiler', icon: <TrendingUp className="w-4 h-4 text-blue-400" />, getValue: (a: AgentStats) => a.properties_rent },
    { key: 'En Venta', icon: <TrendingUp className="w-4 h-4 text-purple-400" />, getValue: (a: AgentStats) => a.properties_sale },
    { key: 'Facturación total (€)', icon: <Receipt className="w-4 h-4 text-[#C9A962]" />, getValue: (a: AgentStats) => formatEur(a.invoices_total) },
    { key: 'Facturación este mes (€)', icon: <Receipt className="w-4 h-4 text-yellow-400" />, getValue: (a: AgentStats) => formatEur(a.invoices_month) },
    { key: 'Leads recibidos', icon: <Target className="w-4 h-4 text-pink-400" />, getValue: (a: AgentStats) => a.leads_total },
    { key: 'Leads convertidos', icon: <CheckCircle2 className="w-4 h-4 text-teal-400" />, getValue: (a: AgentStats) => a.leads_converted },
    { key: 'Tasa de conversión', icon: <BarChart3 className="w-4 h-4 text-orange-400" />, getValue: (a: AgentStats) => `${conversionRate(a)}%` },
    { key: 'Inquilinos gestionados', icon: <Users className="w-4 h-4 text-[#C9A962]" />, getValue: (a: AgentStats) => a.tenants_total },
    { key: 'Contratos activos', icon: <Clock className="w-4 h-4 text-indigo-400" />, getValue: (a: AgentStats) => a.contracts_active },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-[#C9A962]" />
          <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.2em]">Gerencial</span>
        </div>
        <h1 className="font-secondary text-3xl text-[#FAF8F5]">CRM de Agentes</h1>
        <p className="font-primary text-[#666666] text-sm mt-1">Métricas comparativas y rendimiento del equipo</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[#0A0A0A] border border-[#1F1F1F] animate-pulse rounded" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-10 text-center">
          <Users className="w-8 h-8 text-[#333] mx-auto mb-3" />
          <p className="font-primary text-[#666666] text-sm">No hay agentes configurados aún.</p>
          <p className="font-primary text-[#444444] text-xs mt-1">
            Crea usuarios en Supabase Auth y asígnales <code className="text-[#C9A962]">role = 'agent'</code> en la tabla <code className="text-[#C9A962]">user_profiles</code>.
          </p>
        </div>
      ) : (
        <>
          {/* Ranking Cards */}
          {(topByProps || topByInvoices) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topByProps && (
                <div className="bg-[#0A0A0A] border border-[#C9A962]/30 p-5 flex items-start gap-4">
                  <Trophy className="w-6 h-6 text-[#C9A962] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-primary text-[#888888] text-xs uppercase tracking-wider mb-1">Más propiedades publicadas</p>
                    <p className="font-secondary text-xl text-[#C9A962]">{topByProps.agent_name}</p>
                    <p className="font-primary text-[#FAF8F5] text-sm mt-0.5">{topByProps.properties_published} propiedades publicadas</p>
                  </div>
                </div>
              )}
              {topByInvoices && (
                <div className="bg-[#0A0A0A] border border-[#C9A962]/30 p-5 flex items-start gap-4">
                  <Trophy className="w-6 h-6 text-[#C9A962] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-primary text-[#888888] text-xs uppercase tracking-wider mb-1">Mayor facturación total</p>
                    <p className="font-secondary text-xl text-[#C9A962]">{topByInvoices.agent_name}</p>
                    <p className="font-primary text-[#FAF8F5] text-sm mt-0.5">{formatEur(topByInvoices.invoices_total)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI Comparison Table */}
          <div className="bg-[#0A0A0A] border border-[#1F1F1F] overflow-x-auto">
            <div className="p-5 border-b border-[#1F1F1F]">
              <h2 className="font-primary text-[#FAF8F5] font-bold text-sm uppercase tracking-wider">KPIs Comparativos</h2>
            </div>
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[#1F1F1F]">
                  <th className="px-5 py-3 text-left font-primary text-[10px] text-[#555555] uppercase tracking-wider">Métrica</th>
                  {agents.map(a => (
                    <th key={a.id} className="px-5 py-3 text-center font-primary text-[10px] text-[#C9A962] uppercase tracking-wider">
                      {a.agent_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i} className={`border-b border-[#1F1F1F] ${i % 2 === 0 ? 'bg-[#0D0D0D]' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {m.icon}
                        <span className="font-primary text-sm text-[#888888]">{m.key}</span>
                      </div>
                    </td>
                    {agents.map(a => {
                      const val = m.getValue(a);
                      // Highlight the higher value between agents
                      const allVals = agents.map(ag => {
                        const v = m.getValue(ag);
                        return typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
                      });
                      const numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.]/g, ''));
                      const isTop = agents.length > 1 && numVal === Math.max(...allVals) && numVal > 0;

                      return (
                        <td key={a.id} className="px-5 py-3 text-center">
                          <span className={`font-primary text-sm font-semibold ${isTop ? 'text-[#C9A962]' : 'text-[#FAF8F5]'}`}>
                            {String(val)}
                          </span>
                          {isTop && agents.length > 1 && (
                            <span className="ml-1 text-[10px] text-[#C9A962]">★</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <p className="font-primary text-orange-400 font-bold text-sm uppercase tracking-wider">Alertas Gerenciales</p>
              </div>
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  <p className="font-primary text-[#888888] text-sm">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
