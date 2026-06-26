"use client";

import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { PageLoading } from './components/PageLoading';
import { ScrollToTop } from './components/ScrollToTop';
import { UpdatePrompt } from './components/UpdatePrompt';
// Lazy load public pages
const Home = lazy(() => import('./views/Home').then(m => ({ default: m.Home })));
const Propiedades = lazy(() => import('./views/Propiedades').then(m => ({ default: m.Propiedades })));
const FichaPropiedad = lazy(() => import('./views/FichaPropiedad').then(m => ({ default: m.FichaPropiedad })));
const Servicios = lazy(() => import('./views/Servicios').then(m => ({ default: m.Servicios })));
const Propietarios = lazy(() => import('./views/Propietarios').then(m => ({ default: m.Propietarios })));
const Contacto = lazy(() => import('./views/Contacto').then(m => ({ default: m.Contacto })));
const Inversores = lazy(() => import('./views/Inversores'));
const Nosotros = lazy(() => import('./views/Nosotros'));
const Valoracion = lazy(() => import('./views/Valoracion').then(m => ({ default: m.Valoracion })));
const Reviews = lazy(() => import('./views/Reviews').then(m => ({ default: m.Reviews })));

const BlogList = lazy(() => import('./views/BlogList').then(m => ({ default: m.BlogList })));
const BlogPost = lazy(() => import('./views/BlogPost').then(m => ({ default: m.BlogPost })));

// Lead forms
const TenantLeadForm = lazy(() => import('./views/leads/TenantLeadForm'));
const OwnerSaleLeadForm = lazy(() => import('./views/leads/OwnerSaleLeadForm'));
const OwnerRentLeadForm = lazy(() => import('./views/leads/OwnerRentLeadForm'));

// Lazy load admin pages
const AdminLayout = lazy(() => import('./views/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import('./views/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./views/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPropertiesList = lazy(() => import('./views/admin/AdminPropertiesList').then(m => ({ default: m.AdminPropertiesList })));
const AdminPropertyForm = lazy(() => import('./views/admin/AdminPropertyForm').then(m => ({ default: m.AdminPropertyForm })));
const AdminInvoices = lazy(() => import('./views/admin/AdminInvoices').then(m => ({ default: m.AdminInvoices })));
const AdminInvoiceForm = lazy(() => import('./views/admin/AdminInvoiceForm').then(m => ({ default: m.AdminInvoiceForm })));
// Deleted redundant accounting import
const AdminTenantsList = lazy(() => import('./views/admin/AdminTenantsList').then(m => ({ default: m.AdminTenantsList })));
const AdminTenantForm = lazy(() => import('./views/admin/AdminTenantForm').then(m => ({ default: m.AdminTenantForm })));
const AdminTenantOrganizer = lazy(() => import('./views/admin/AdminTenantOrganizer').then(m => ({ default: m.AdminTenantOrganizer })));
const AdminTenantDetail = lazy(() => import('./views/admin/AdminTenantDetail').then(m => ({ default: m.AdminTenantDetail })));
const AdminContractForm = lazy(() => import('./views/admin/AdminContractForm').then(m => ({ default: m.AdminContractForm })));
const AdminContractsList = lazy(() => import('./views/admin/AdminContractsList').then(m => ({ default: m.AdminContractsList })));
const AdminReservations = lazy(() => import('./views/admin/AdminReservations').then(m => ({ default: m.AdminReservations })));
const AdminLeadsCRM = lazy(() => import('./views/admin/AdminLeadsCRM').then(m => ({ default: m.AdminLeadsCRM })));
const AdminCaptaciones = lazy(() => import('./views/admin/AdminCaptaciones').then(m => ({ default: m.AdminCaptaciones })));
const AdminBlogList = lazy(() => import('./views/admin/AdminBlogList').then(m => ({ default: m.AdminBlogList })));
const AdminBlogPostForm = lazy(() => import('./views/admin/AdminBlogPostForm').then(m => ({ default: m.AdminBlogPostForm })));
const AdminPropertyReorder = lazy(() => import('./views/admin/AdminPropertyReorder').then(m => ({ default: m.AdminPropertyReorder })));
const AdminAgentCRM = lazy(() => import('./views/admin/AdminAgentCRM').then(m => ({ default: m.AdminAgentCRM })));

// Agent portal
const AgentLogin = lazy(() => import('./views/agent/AgentLogin').then(m => ({ default: m.AgentLogin })));
const AgentLayout = lazy(() => import('./views/agent/AgentLayout').then(m => ({ default: m.AgentLayout })));
const AgentDashboard = lazy(() => import('./views/agent/AgentDashboard').then(m => ({ default: m.AgentDashboard })));
const AgentPropertiesList = lazy(() => import('./views/agent/AgentPropertiesList').then(m => ({ default: m.AgentPropertiesList })));
const AgentPropertyReorder = lazy(() => import('./views/agent/AgentPropertyReorder').then(m => ({ default: m.AgentPropertyReorder })));
const AgentPropertyForm = lazy(() => import('./views/agent/AgentPropertyForm').then(m => ({ default: m.AgentPropertyForm })));
const AgentInvoices = lazy(() => import('./views/agent/AgentInvoices').then(m => ({ default: m.AgentInvoices })));
const AgentInvoiceForm = lazy(() => import('./views/agent/AgentInvoiceForm').then(m => ({ default: m.AgentInvoiceForm })));
const AgentTenantsList = lazy(() => import('./views/agent/AgentTenantsList').then(m => ({ default: m.AgentTenantsList })));
const AgentTenantForm = lazy(() => import('./views/agent/AgentTenantForm').then(m => ({ default: m.AgentTenantForm })));
const AgentTenantOrganizer = lazy(() => import('./views/agent/AgentTenantOrganizer').then(m => ({ default: m.AgentTenantOrganizer })));
const AgentTenantDetail = lazy(() => import('./views/agent/AgentTenantDetail').then(m => ({ default: m.AgentTenantDetail })));
const AgentContractsList = lazy(() => import('./views/agent/AgentContractsList').then(m => ({ default: m.AgentContractsList })));
const AgentContractForm = lazy(() => import('./views/agent/AgentContractForm').then(m => ({ default: m.AgentContractForm })));
const AgentReservations = lazy(() => import('./views/agent/AgentReservations').then(m => ({ default: m.AgentReservations })));
const AgentLeadsCRM = lazy(() => import('./views/agent/AgentLeadsCRM').then(m => ({ default: m.AgentLeadsCRM })));
const AgentCaptaciones = lazy(() => import('./views/agent/AgentCaptaciones').then(m => ({ default: m.AgentCaptaciones })));

// Legal
const AvisoLegal = lazy(() => import('./views/legal/AvisoLegal').then(m => ({ default: m.AvisoLegal })));
const Privacidad = lazy(() => import('./views/legal/Privacidad').then(m => ({ default: m.Privacidad })));
const Cookies = lazy(() => import('./views/legal/Cookies').then(m => ({ default: m.Cookies })));
const NotFound = lazy(() => import('./views/NotFound').then(m => ({ default: m.NotFound })));

import { ServiceCartProvider } from './context/ServiceCartContext';
import { Component, type ReactNode } from 'react';

// ErrorBoundary: catches failed lazy-import chunks after a deploy
// and auto-reloads once to get fresh assets from the network.
class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    const isChunkError = error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Importing a module script failed');
    if (isChunkError && !sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function App() {
  const location = useLocation();

  return (
    <ServiceCartProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1A1A1A', color: '#FAF8F5', border: '1px solid #1F1F1F', fontSize: '14px', borderRadius: '4px' } }} />
      <ScrollToTop />
      <UpdatePrompt />
      <ChunkErrorBoundary>
      <Suspense fallback={<PageLoading />}>
        <Routes location={location} key={location.pathname}>
        {/* Handle optional language prefix for SEO static pages */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="propiedades" element={<Propiedades />} />
          <Route path="propiedades/:id" element={<FichaPropiedad />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="propietarios" element={<Propietarios />} />
          <Route path="inversores" element={<Inversores />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="nosotros" element={<Nosotros />} />
          <Route path="valoracion" element={<Valoracion />} />
          <Route path="resenas" element={<Reviews />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="aviso-legal" element={<AvisoLegal />} />
          <Route path="privacidad" element={<Privacidad />} />
          <Route path="cookies" element={<Cookies />} />
          
          {/* Formularios de captación */}
          <Route path="inquilinos" element={<TenantLeadForm />} />
          <Route path="propietarios-venta" element={<OwnerSaleLeadForm />} />
          <Route path="propietarios-alquiler" element={<OwnerRentLeadForm />} />
        </Route>

        {/* English routes (mirrored) */}
        <Route path="/en" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="propiedades" element={<Propiedades />} />
          <Route path="propiedades/:id" element={<FichaPropiedad />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="propietarios" element={<Propietarios />} />
          <Route path="inversores" element={<Inversores />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="nosotros" element={<Nosotros />} />
          <Route path="valoracion" element={<Valoracion />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="aviso-legal" element={<AvisoLegal />} />
          <Route path="privacidad" element={<Privacidad />} />
          <Route path="cookies" element={<Cookies />} />

          {/* Lead forms (EN) */}
          <Route path="inquilinos" element={<TenantLeadForm />} />
          <Route path="propietarios-venta" element={<OwnerSaleLeadForm />} />
          <Route path="propietarios-alquiler" element={<OwnerRentLeadForm />} />
        </Route>

        {/* Admin login (standalone, no admin layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel (auth guard inside AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="propiedades" element={<AdminPropertiesList />} />
          <Route path="propiedades/organizar" element={<AdminPropertyReorder />} />
          <Route path="propiedades/nueva" element={<AdminPropertyForm />} />
          <Route path="propiedades/:id/editar" element={<AdminPropertyForm />} />
          <Route path="facturas" element={<AdminInvoices />} />
          <Route path="facturas/nueva" element={<AdminInvoiceForm />} />
          <Route path="facturas/:id/editar" element={<AdminInvoiceForm />} />
          <Route path="inquilinos" element={<AdminTenantsList />} />
          <Route path="inquilinos/organizador" element={<AdminTenantOrganizer />} />
          <Route path="inquilinos/nuevo" element={<AdminTenantForm />} />
          <Route path="inquilinos/:id" element={<AdminTenantDetail />} />
          <Route path="inquilinos/:id/editar" element={<AdminTenantForm />} />
          <Route path="contratos" element={<AdminContractsList />} />
          <Route path="contratos/nuevo" element={<AdminContractForm />} />
          <Route path="contratos/:id/editar" element={<AdminContractForm />} />
          <Route path="reservas" element={<AdminReservations />} />
          <Route path="leads" element={<AdminLeadsCRM />} />
          <Route path="captaciones" element={<AdminCaptaciones />} />
          <Route path="blog" element={<AdminBlogList />} />
          <Route path="blog/nuevo" element={<AdminBlogPostForm />} />
          <Route path="blog/:id/editar" element={<AdminBlogPostForm />} />
          <Route path="crm-agentes" element={<AdminAgentCRM />} />

        </Route>

        {/* Agent login (standalone) */}
        <Route path="/agente/login" element={<AgentLogin />} />

        {/* Agent portal (auth guard inside AgentLayout) */}
        <Route path="/agente" element={<AgentLayout />}>
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="propiedades" element={<AgentPropertiesList />} />
          <Route path="propiedades/organizar" element={<AgentPropertyReorder />} />
          <Route path="propiedades/nueva" element={<AgentPropertyForm />} />
          <Route path="propiedades/:id/editar" element={<AgentPropertyForm />} />
          <Route path="facturas" element={<AgentInvoices />} />
          <Route path="facturas/nueva" element={<AgentInvoiceForm />} />
          <Route path="facturas/:id/editar" element={<AgentInvoiceForm />} />
          <Route path="inquilinos" element={<AgentTenantsList />} />
          <Route path="inquilinos/organizador" element={<AgentTenantOrganizer />} />
          <Route path="inquilinos/nuevo" element={<AgentTenantForm />} />
          <Route path="inquilinos/:id" element={<AgentTenantDetail />} />
          <Route path="inquilinos/:id/editar" element={<AgentTenantForm />} />
          <Route path="contratos" element={<AgentContractsList />} />
          <Route path="contratos/nuevo" element={<AgentContractForm />} />
          <Route path="contratos/:id/editar" element={<AgentContractForm />} />
          <Route path="reservas" element={<AgentReservations />} />
          <Route path="leads" element={<AgentLeadsCRM />} />
          <Route path="captaciones" element={<AgentCaptaciones />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ChunkErrorBoundary>
    </ServiceCartProvider>
  );
}

export default App;
