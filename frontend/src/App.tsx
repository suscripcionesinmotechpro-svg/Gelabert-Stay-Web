import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Propiedades } from './pages/Propiedades';
import { FichaPropiedad } from './pages/FichaPropiedad';
import { Servicios } from './pages/Servicios';
import { Propietarios } from './pages/Propietarios';
import { Contacto } from './pages/Contacto';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPropertiesList } from './pages/admin/AdminPropertiesList';
import { AdminPropertyForm } from './pages/admin/AdminPropertyForm';
import { AdminInvoices } from './pages/admin/AdminInvoices';
import { AdminInvoiceForm } from './pages/admin/AdminInvoiceForm';
import { AvisoLegal } from './pages/legal/AvisoLegal';
import { Privacidad } from './pages/legal/Privacidad';
import { Cookies } from './pages/legal/Cookies';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
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
      </Route>
      </Routes>
    </>
  );
}

export default App;
