import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageLoading } from './components/PageLoading';
import { ScrollToTop } from './components/ScrollToTop';

// Lazy load public pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Propiedades = lazy(() => import('./pages/Propiedades').then(m => ({ default: m.Propiedades })));
const FichaPropiedad = lazy(() => import('./pages/FichaPropiedad').then(m => ({ default: m.FichaPropiedad })));
const Servicios = lazy(() => import('./pages/Servicios').then(m => ({ default: m.Servicios })));
const Propietarios = lazy(() => import('./pages/Propietarios').then(m => ({ default: m.Propietarios })));
const Contacto = lazy(() => import('./pages/Contacto').then(m => ({ default: m.Contacto })));

// Lazy load admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminPropertiesList = lazy(() => import('./pages/admin/AdminPropertiesList').then(m => ({ default: m.AdminPropertiesList })));
const AdminPropertyForm = lazy(() => import('./pages/admin/AdminPropertyForm').then(m => ({ default: m.AdminPropertyForm })));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices').then(m => ({ default: m.AdminInvoices })));
const AdminInvoiceForm = lazy(() => import('./pages/admin/AdminInvoiceForm').then(m => ({ default: m.AdminInvoiceForm })));
const AdminTenantsList = lazy(() => import('./pages/admin/AdminTenantsList').then(m => ({ default: m.AdminTenantsList })));
const AdminTenantForm = lazy(() => import('./pages/admin/AdminTenantForm').then(m => ({ default: m.AdminTenantForm })));
const AdminTenantDetail = lazy(() => import('./pages/admin/AdminTenantDetail').then(m => ({ default: m.AdminTenantDetail })));
const AdminContractForm = lazy(() => import('./pages/admin/AdminContractForm').then(m => ({ default: m.AdminContractForm })));
const AdminReservations = lazy(() => import('./pages/admin/AdminReservations').then(m => ({ default: m.AdminReservations })));

// Legal
const AvisoLegal = lazy(() => import('./pages/legal/AvisoLegal').then(m => ({ default: m.AvisoLegal })));
const Privacidad = lazy(() => import('./pages/legal/Privacidad').then(m => ({ default: m.Privacidad })));
const Cookies = lazy(() => import('./pages/legal/Cookies').then(m => ({ default: m.Cookies })));

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoading />}>
        <Routes location={location} key={location.pathname}>
        {/* Handle optional language prefix for SEO static pages */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="propiedades" element={<Propiedades />} />
          <Route path="propiedades/:id" element={<FichaPropiedad />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="propietarios" element={<Propietarios />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="aviso-legal" element={<AvisoLegal />} />
          <Route path="privacidad" element={<Privacidad />} />
          <Route path="cookies" element={<Cookies />} />
        </Route>

        {/* English routes (mirrored) */}
        <Route path="/en" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="propiedades" element={<Propiedades />} />
          <Route path="propiedades/:id" element={<FichaPropiedad />} />
          <Route path="servicios" element={<Servicios />} />
          <Route path="propietarios" element={<Propietarios />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="aviso-legal" element={<AvisoLegal />} />
          <Route path="privacidad" element={<Privacidad />} />
          <Route path="cookies" element={<Cookies />} />
        </Route>

        {/* Admin login (standalone, no admin layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel (auth guard inside AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="propiedades" element={<AdminPropertiesList />} />
          <Route path="propiedades/nueva" element={<AdminPropertyForm />} />
          <Route path="propiedades/:id/editar" element={<AdminPropertyForm />} />
          <Route path="facturas" element={<AdminInvoices />} />
          <Route path="facturas/nueva" element={<AdminInvoiceForm />} />
          <Route path="facturas/:id/editar" element={<AdminInvoiceForm />} />
          <Route path="inquilinos" element={<AdminTenantsList />} />
          <Route path="inquilinos/nuevo" element={<AdminTenantForm />} />
          <Route path="inquilinos/:id" element={<AdminTenantDetail />} />
          <Route path="inquilinos/:id/editar" element={<AdminTenantForm />} />
          <Route path="contratos/nuevo" element={<AdminContractForm />} />
          <Route path="contratos/:id/editar" element={<AdminContractForm />} />
          <Route path="reservas" element={<AdminReservations />} />

        </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
