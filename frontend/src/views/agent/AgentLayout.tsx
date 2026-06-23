import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Building2, PlusCircle, LogOut, Home, Menu, X,
  Receipt, Users, FileText, Bot, CalendarDays, Briefcase, Sparkles
} from 'lucide-react';
import { SystemNotifications } from '../../components/admin/SystemNotifications';
import { UserProfileModal } from '../../components/admin/UserProfileModal';



export const AgentLayout = () => {
  const { user, loading, signOut, userProfile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const initials = userProfile?.agent_name
    ? userProfile.agent_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';



  useEffect(() => {
    const fetchNewLeads = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('leads_crm')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'nuevo');
      setNewLeadsCount(count || 0);
    };
    if (user) fetchNewLeads();

    const channel = supabase.channel('agent_leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_crm' }, () => {
        fetchNewLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/agente/login', { replace: true });
      } else if (userProfile && userProfile.role !== 'agent') {
        // Not an agent — redirect to admin
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, loading, userProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'agent') return null;

  const agentName = userProfile.agent_name || user.email || 'Agente';

  const handleSignOut = async () => {
    await signOut();
    navigate('/agente/login');
  };

  const navItems = [
    { to: '/agente/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { to: '/agente/propiedades', icon: <Building2 className="w-4 h-4" />, label: 'Mis Propiedades' },
    { to: '/agente/propiedades/nueva', icon: <PlusCircle className="w-4 h-4" />, label: 'Nueva Propiedad' },
    { to: '/agente/facturas', icon: <Receipt className="w-4 h-4" />, label: 'Mis Facturas' },
    { to: '/agente/inquilinos', icon: <Users className="w-4 h-4" />, label: 'Mis Inquilinos' },
    { to: '/agente/inquilinos/organizador', icon: <Sparkles className="w-4 h-4" />, label: 'Análisis de documentación' },
    { to: '/agente/contratos', icon: <FileText className="w-4 h-4" />, label: 'Mis Contratos' },
    { to: '/agente/reservas', icon: <CalendarDays className="w-4 h-4" />, label: 'Mis Reservas' },
    { to: '/agente/captaciones', icon: <Briefcase className="w-4 h-4" />, label: 'Captaciones' },
    { to: '/agente/leads', icon: <Bot className="w-4 h-4" />, label: 'CRM Leads' },
  ];

  const sidebarContent = (
    <>
      {/* Logo + Agent Badge */}
      <div className="p-6 border-b border-[#1F1F1F]">
        <h1 className="font-secondary text-xl text-[#C9A962] tracking-wider">Gelabert Homes</h1>
        <div className="flex items-center gap-2 mt-2">
          <Briefcase className="w-3 h-3 text-[#C9A962]" />
          <p className="font-primary text-[#C9A962] text-[10px] uppercase tracking-[0.2em]">Portal Agente</p>
        </div>
        <p className="font-primary text-[#666666] text-xs mt-1 truncate">{agentName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={['/agente/dashboard', '/agente/propiedades', '/agente/inquilinos', '/agente/inquilinos/organizador'].includes(item.to)}
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
            {item.label === 'CRM Leads' && newLeadsCount > 0 && (
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
        <div className="px-3 pt-4 border-t border-[#1F1F1F] mt-1 flex items-center gap-3 overflow-hidden cursor-pointer group select-none" onClick={() => setProfileModalOpen(true)}>
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#C9A962]/30 group-hover:border-[#C9A962] transition-colors shrink-0 bg-[#0F0F0F] flex items-center justify-center">
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-[10px] font-bold text-[#C9A962]">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-primary text-[10px] text-[#FAF8F5] font-bold truncate group-hover:text-[#C9A962] transition-colors">
              {userProfile?.agent_name || 'Agente'}
            </p>
            <p className="font-primary text-[9px] text-zinc-500 truncate mt-0.5">
              {userProfile?.office ? `${userProfile.office}` : user.email}
            </p>
          </div>
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
          <div className="flex items-center gap-3 bg-transparent">
            <SystemNotifications />
            
            {/* Profile Avatar Button */}
            <button 
              onClick={() => setProfileModalOpen(true)}
              className="relative w-11 h-11 rounded-full overflow-hidden border border-[#C9A962]/30 hover:border-[#C9A962] transition-colors shrink-0 bg-[#0F0F0F] flex items-center justify-center"
              title="Mi Perfil"
            >
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-xs font-bold text-[#C9A962]">
                  {initials}
                </div>
              )}
            </button>

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#888888] hover:text-[#FAF8F5]">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Desktop topbar notifications */}
        <div className="hidden md:flex items-center justify-end px-6 py-2 bg-[#0A0A0A] border-b border-[#1F1F1F] gap-3 select-none">
          <span className="text-[10px] font-primary text-zinc-400 truncate">{userProfile?.agent_name || user.email}</span>
          {userProfile?.office && (
            <span className="text-[9px] font-primary bg-[#C9A962]/10 border border-[#C9A962]/20 text-[#C9A962] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
              {userProfile.office}
            </span>
          )}
          <SystemNotifications />
          
          {/* Profile Avatar Button */}
          <button 
            onClick={() => setProfileModalOpen(true)}
            className="relative w-11 h-11 rounded-full overflow-hidden border border-[#C9A962]/30 hover:border-[#C9A962] transition-colors shrink-0 bg-[#0F0F0F] flex items-center justify-center cursor-pointer"
            title="Mi Perfil"
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-xs font-bold text-[#C9A962]">
                {initials}
              </div>
            )}
          </button>
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};
