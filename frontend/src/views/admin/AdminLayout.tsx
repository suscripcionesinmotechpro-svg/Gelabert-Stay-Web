import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Building2, PlusCircle, LogOut, Home, Menu, X,
  Receipt, Users, CalendarDays, Bot, FileText, LayoutGrid, BarChart3, Briefcase, Sparkles
} from 'lucide-react';
import { CaptacionesNotifications } from '../../components/captaciones/CaptacionesNotifications';

export const AdminLayout = () => {
  const { user, loading, signOut, userProfile } = useAuth();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    const fetchNewLeads = async () => {
      const { count } = await supabase
        .from('leads_crm')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'nuevo');
      setNewLeadsCount(count || 0);
    };
    if (user) fetchNewLeads();

    // Subscribe to new leads
    const channel = supabase.channel('leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_crm' }, () => {
        fetchNewLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);


  const navItems = [
    { to: `/admin/dashboard`, icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard" },
    { to: `/admin/propiedades`, icon: <Building2 className="w-4 h-4" />, label: "Propiedades" },
    { to: `/admin/propiedades/organizar`, icon: <LayoutGrid className="w-4 h-4" />, label: "Organizar Listado" },
    { to: `/admin/propiedades/nueva`, icon: <PlusCircle className="w-4 h-4" />, label: "Nueva Propiedad" },
    { to: `/admin/facturas`, icon: <Receipt className="w-4 h-4" />, label: "Contabilidad" },
    { to: `/admin/inquilinos`, icon: <Users className="w-4 h-4" />, label: "Inquilinos" },
    { to: `/admin/inquilinos/organizador`, icon: <Sparkles className="w-4 h-4" />, label: "Análisis de documentación" },
    { to: `/admin/contratos`, icon: <FileText className="w-4 h-4" />, label: "Contratos" },
    { to: `/admin/reservas`, icon: <CalendarDays className="w-4 h-4" />, label: "Reservas" },
    { to: `/admin/captaciones`, icon: <Briefcase className="w-4 h-4" />, label: "Control Captaciones" },
    { to: `/admin/leads`, icon: <Bot className="w-4 h-4" />, label: "CRM Leads (Bot)" },
    { to: `/admin/blog`, icon: <FileText className="w-4 h-4" />, label: "Blog & Insights" },
    { to: `/admin/crm-agentes`, icon: <BarChart3 className="w-4 h-4" />, label: "CRM Agentes" },
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate(`/admin/login`, { replace: true });
      } else if (userProfile && userProfile.role !== 'admin') {
        if (userProfile.role === 'agent') {
          navigate(`/agente/dashboard`, { replace: true });
        } else {
          signOut().then(() => navigate(`/admin/login`, { replace: true }));
        }
      }
    }
  }, [user, loading, userProfile, navigate, signOut]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strict check: No render anything if there's no user session
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate(`/admin/login`);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-[#1F1F1F]">
        <h1 className="font-secondary text-xl text-[#C9A962] tracking-wider">Gelabert Homes</h1>
        <p className="font-primary text-[#444444] text-[10px] mt-1 uppercase tracking-[0.2em]">Panel de Control</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={['/admin/dashboard', '/admin/propiedades'].includes(item.to)}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 font-primary text-sm transition-all ${
                isActive
                  ? 'bg-[#C9A962]/10 text-[#C9A962] border-l-2 border-[#C9A962]'
                  : 'text-[#888888] hover:text-[#FAF8F5] hover:bg-[#1F1F1F]'
              }`
            }
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </div>
            {item.label === "CRM Leads (Bot)" && newLeadsCount > 0 && (
              <span className="bg-[#C9A962] text-[#0A0A0A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {newLeadsCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1F1F1F] flex flex-col gap-2">
        <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 font-primary text-sm text-[#888888] hover:text-[#FAF8F5] transition-colors">
          <Home className="w-4 h-4" />
          Ver web pública
        </a>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 font-primary text-sm text-[#888888] hover:text-red-400 transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
        <div className="px-3 pt-4 border-t border-[#1F1F1F] mt-1 flex items-center justify-between gap-2 overflow-hidden">
          <p className="font-primary text-[10px] text-[#444444] truncate flex-1">{user.email}</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex admin-panel">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#0A0A0A] border-r border-[#1F1F1F] flex-col flex-shrink-0 fixed top-0 left-0 h-full z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-60 bg-[#0A0A0A] border-r border-[#1F1F1F] h-full z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0A0A0A] border-b border-[#1F1F1F]">
          <h1 className="font-secondary text-lg text-[#C9A962]">Gelabert Homes</h1>
          <div className="flex items-center gap-3">
            <CaptacionesNotifications />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#888888] hover:text-[#FAF8F5]">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Desktop topbar notifications */}
        <div className="hidden md:flex items-center justify-end px-6 py-2 bg-[#0A0A0A] border-b border-[#1F1F1F] gap-3">
          <span className="text-[10px] font-primary text-zinc-600 truncate">{user.email}</span>
          <CaptacionesNotifications />
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
