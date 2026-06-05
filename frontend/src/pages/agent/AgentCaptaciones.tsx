import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useCaptaciones, useCaptacionesMutations } from '../../hooks/useCaptaciones';
import { 
  Briefcase, Search, Plus, Trash2, Mail, Phone, MapPin, 
  Calendar, X, ChevronRight, ExternalLink, Download, Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { CAPTACION_STATUS_LABELS, CAPTACION_STATUS_COLORS } from '../../types/captacion';
import type { Captacion, CaptacionStatus } from '../../types/captacion';

export const AgentCaptaciones = () => {
  const { user, userProfile } = useAuth();
  const { captaciones, loading, refetch } = useCaptaciones(user?.id);
  const { createCaptacion, updateCaptacion, deleteCaptacion } = useCaptacionesMutations();

  // Search & Period Filters
  const [search, setSearch] = useState('');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD

  // Selection & Form State
  const [selectedCaptacion, setSelectedCaptacion] = useState<Captacion | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyFeatures, setPropertyFeatures] = useState('');
  const [propertyAdUrl, setPropertyAdUrl] = useState('');
  const [status, setStatus] = useState<CaptacionStatus>('seguimiento');
  const [contactDate, setContactDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const matchPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    // Year check
    if (selectedYear !== 'all' && date.getFullYear() !== selectedYear) {
      return false;
    }

    // Month check (1-12)
    const monthNum = date.getMonth() + 1;

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

    // Exact date check YYYY-MM-DD
    if (selectedDate && dateStr !== selectedDate) {
      return false;
    }

    return true;
  };

  const filteredCaptaciones = captaciones.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = 
      c.owner_name.toLowerCase().includes(q) ||
      c.property_address.toLowerCase().includes(q) ||
      (c.owner_phone || '').toLowerCase().includes(q) ||
      (c.owner_email || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    return matchPeriod(c.contact_date);
  });

  const handleSelect = (captacion: Captacion) => {
    setSelectedCaptacion(captacion);
    setIsCreating(false);
    setIsEditing(false);
    
    // Fill fields for editing/details
    setOwnerName(captacion.owner_name);
    setOwnerEmail(captacion.owner_email || '');
    setOwnerPhone(captacion.owner_phone || '');
    setPropertyAddress(captacion.property_address);
    setPropertyFeatures(captacion.property_features || '');
    setPropertyAdUrl(captacion.property_ad_url || '');
    setStatus(captacion.status);
    setContactDate(captacion.contact_date);
    setNotes(captacion.notes || '');
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedCaptacion(null);
    setIsEditing(false);

    // Reset fields
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPhone('');
    setPropertyAddress('');
    setPropertyFeatures('');
    setPropertyAdUrl('');
    setStatus('seguimiento');
    setContactDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !propertyAddress) {
      toast.error('Nombre del propietario y Dirección son obligatorios');
      return;
    }

    try {
      const id = await createCaptacion({
        owner_name: ownerName,
        owner_email: ownerEmail || null,
        owner_phone: ownerPhone || null,
        property_address: propertyAddress,
        property_features: propertyFeatures || null,
        property_ad_url: propertyAdUrl || null,
        status,
        contact_date: contactDate,
        notes: notes || null,
        agent_id: user?.id || null
      });

      toast.success('Captación agregada correctamente');
      setIsCreating(false);
      refetch();
      
      const newCap: Captacion = {
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_name: ownerName,
        owner_email: ownerEmail || null,
        owner_phone: ownerPhone || null,
        property_address: propertyAddress,
        property_features: propertyFeatures || null,
        property_ad_url: propertyAdUrl || null,
        status,
        contact_date: contactDate,
        notes: notes || null,
        agent_id: user?.id || null
      };
      handleSelect(newCap);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al crear captación: ' + err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptacion) return;
    if (!ownerName || !propertyAddress) {
      toast.error('Nombre del propietario y Dirección son obligatorios');
      return;
    }

    try {
      await updateCaptacion(selectedCaptacion.id, {
        owner_name: ownerName,
        owner_email: ownerEmail || null,
        owner_phone: ownerPhone || null,
        property_address: propertyAddress,
        property_features: propertyFeatures || null,
        property_ad_url: propertyAdUrl || null,
        status,
        contact_date: contactDate,
        notes: notes || null
      });

      toast.success('Cambios guardados correctamente');
      setIsEditing(false);
      refetch();
      setSelectedCaptacion({
        ...selectedCaptacion,
        owner_name: ownerName,
        owner_email: ownerEmail || null,
        owner_phone: ownerPhone || null,
        property_address: propertyAddress,
        property_features: propertyFeatures || null,
        property_ad_url: propertyAdUrl || null,
        status,
        contact_date: contactDate,
        notes: notes || null
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar: ' + err.message);
    }
  };

  const handleUpdateStatusOnly = async (newStatus: CaptacionStatus) => {
    if (!selectedCaptacion) return;
    try {
      await updateCaptacion(selectedCaptacion.id, { status: newStatus });
      toast.success(`Estado actualizado a: ${CAPTACION_STATUS_LABELS[newStatus]}`);
      setStatus(newStatus);
      setSelectedCaptacion({ ...selectedCaptacion, status: newStatus });
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cambiar de estado');
    }
  };

  const handleSaveNotesOnly = async () => {
    if (!selectedCaptacion) return;
    try {
      await updateCaptacion(selectedCaptacion.id, { notes });
      toast.success('Notas internas guardadas');
      setSelectedCaptacion({ ...selectedCaptacion, notes });
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar notas');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta captación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteCaptacion(id);
      toast.success('Captación eliminada');
      setSelectedCaptacion(null);
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedYear('all');
    setSelectedQuarter('all');
    setSelectedMonth('all');
    setSelectedDate('');
  };

  const getPeriodLabelText = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    if (selectedDate) {
      if (selectedDate === todayStr) return 'Diario (Hoy)';
      if (selectedDate === yesterdayStr) return 'Diario (Ayer)';
      return `Diario (${format(new Date(selectedDate), 'dd/MM/yyyy')})`;
    }
    if (selectedMonth !== 'all') {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const yearStr = selectedYear !== 'all' ? ` ${selectedYear}` : ` ${new Date().getFullYear()}`;
      return `Mensual (${months[selectedMonth - 1]}${yearStr})`;
    }
    if (selectedQuarter !== 'all') {
      const yearStr = selectedYear !== 'all' ? ` ${selectedYear}` : ` ${new Date().getFullYear()}`;
      return `Trimestral (Q${selectedQuarter}${yearStr})`;
    }
    if (selectedYear !== 'all') {
      return `Anual (${selectedYear})`;
    }
    return 'Listado Completo';
  };

  const handleExportExcel = () => {
    if (filteredCaptaciones.length === 0) {
      toast.error('No hay captaciones en la lista actual para exportar');
      return;
    }

    const headers = [
      'Fecha de Contacto',
      'Dirección de la Propiedad',
      'Propietario',
      'Teléfono',
      'Email',
      'Estado',
      'Agente Responsable',
      'Características',
      'Enlace Publicación',
      'Notas de Seguimiento'
    ];

    const escapeCSV = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '';
      const stringified = String(val);
      const clean = stringified.replace(/[\r\n]+/g, ' ').replace(/"/g, '""');
      return `"${clean}"`;
    };

    const agentName = userProfile?.agent_name || user?.email || 'Agente';

    const rows = filteredCaptaciones.map(c => [
      format(new Date(c.contact_date), 'yyyy-MM-dd'),
      escapeCSV(c.property_address),
      escapeCSV(c.owner_name),
      escapeCSV(c.owner_phone),
      escapeCSV(c.owner_email),
      escapeCSV(CAPTACION_STATUS_LABELS[c.status]),
      escapeCSV(agentName),
      escapeCSV(c.property_features),
      escapeCSV(c.property_ad_url),
      escapeCSV(c.notes)
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const periodLabel = getPeriodLabelText().replace(/\s+/g, '_');
    const dateLabel = format(new Date(), 'yyyy-MM-dd_HHmm');
    link.setAttribute('href', url);
    link.setAttribute('download', `Captaciones_Mis_${periodLabel}_${dateLabel}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Excel (CSV) exportado correctamente');
  };

  const handleExportPDF = () => {
    if (filteredCaptaciones.length === 0) {
      toast.error('No hay captaciones en la lista actual para exportar');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Comprueba que el navegador no esté bloqueando ventanas emergentes.');
      return;
    }

    const periodLabel = getPeriodLabelText();
    const todayStr = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
    const agentName = userProfile?.agent_name || user?.email || 'Agente';
    
    const stats = filteredCaptaciones.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const rowsHtml = filteredCaptaciones.map((c, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#111111' : '#000000'}; border-bottom: 1px solid #1F1F1F;">
        <td style="padding: 10px; font-weight: bold; color: #FAF8F5;">${format(new Date(c.contact_date), 'dd/MM/yyyy')}</td>
        <td style="padding: 10px; color: #FAF8F5; font-weight: 600;">${c.property_address}</td>
        <td style="padding: 10px;">${c.owner_name}</td>
        <td style="padding: 10px;">${c.owner_phone || '-'}</td>
        <td style="padding: 10px;">${c.owner_email || '-'}</td>
        <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">
          <span style="padding: 3px 8px; border-radius: 9999px; font-size: 10px; border: 1px solid #C9A962; color: #C9A962;">
            ${CAPTACION_STATUS_LABELS[c.status]}
          </span>
        </td>
      </tr>
    `).join('');

    const statsHtml = Object.entries(CAPTACION_STATUS_LABELS).map(([status, label]) => {
      const count = stats[status as CaptacionStatus] || 0;
      return `
        <div style="background-color: #111; border: 1px solid #1F1F1F; padding: 12px; border-radius: 4px; text-align: center; min-width: 120px;">
          <div style="font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${label}</div>
          <div style="font-size: 20px; font-weight: bold; color: #C9A962;">${count}</div>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mis Captaciones - ${periodLabel}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
          body {
            font-family: 'Outfit', sans-serif;
            background-color: #050505;
            color: #888888;
            margin: 0;
            padding: 40px;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1F1F1F;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #FAF8F5;
            font-size: 24px;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          h2 {
            color: #C9A962;
            font-size: 14px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-info {
            text-align: right;
            font-size: 12px;
          }
          .stats-container {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            background-color: #0A0A0A;
            border-bottom: 2px solid #1F1F1F;
            color: #FAF8F5;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 1px;
            text-align: left;
            padding: 12px 10px;
          }
          @media print {
            body {
              background-color: #ffffff;
              color: #000000;
              padding: 0;
            }
            h1, h2 {
              color: #000000;
            }
            .stats-container div {
              background-color: #f5f5f5;
              border-color: #e0e0e0;
            }
            .stats-container div div {
              color: #000;
            }
            th {
              background-color: #eaeaea;
              color: #000000;
              border-color: #ccc;
            }
            tr {
              page-break-inside: avoid;
            }
            tr {
              background-color: #ffffff !important;
            }
            a {
              color: #000;
              text-decoration: none;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h2>Reporte del Agente</h2>
            <h1>Mis Captaciones</h1>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">Periodo: <strong>${periodLabel}</strong></div>
          </div>
          <div class="meta-info">
            <div style="color: #C9A962; font-weight: bold; font-size: 14px;">GELABERT HOMES</div>
            <div style="color: #666; margin-top: 5px;">Agente: <strong>${agentName}</strong></div>
            <div style="color: #666; margin-top: 2px;">Generado el ${todayStr}</div>
            <div style="color: #666; margin-top: 2px;">Total Registros: <strong>${filteredCaptaciones.length}</strong></div>
          </div>
        </header>

        <div class="stats-container">
          ${statsHtml}
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Dirección</th>
              <th>Propietario</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getQuickPeriodLabel = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    if (selectedDate === todayStr) return 'Hoy';
    if (selectedDate === yesterdayStr) return 'Ayer';
    if (selectedMonth !== 'all') {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return months[selectedMonth - 1];
    }
    if (selectedQuarter !== 'all') return `Trimestre Q${selectedQuarter}`;
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-[#111111] p-6 border border-[#1F1F1F] rounded-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.2em]">CRM de Captaciones</span>
          </div>
          <h1 className="font-secondary text-2xl text-[#FAF8F5] uppercase tracking-wider">Control Diario de Captaciones</h1>
          <p className="font-primary text-[#666666] text-xs mt-1">
            Gestiona la cartera de propiedades que estás captando diariamente
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161616] text-[#FAF8F5] border border-[#1F1F1F] font-primary font-bold text-xs uppercase tracking-wider hover:bg-[#1F1F1F] transition-colors whitespace-nowrap"
            title="Exportar mis captaciones actuales a Excel (CSV)"
          >
            <Download className="w-3.5 h-3.5 text-[#C9A962]" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161616] text-[#FAF8F5] border border-[#1F1F1F] font-primary font-bold text-xs uppercase tracking-wider hover:bg-[#1F1F1F] transition-colors whitespace-nowrap"
            title="Imprimir / Guardar reporte PDF de mis captaciones actuales"
          >
            <Printer className="w-3.5 h-3.5 text-[#C9A962]" />
            PDF
          </button>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nueva Captación
          </button>
        </div>
      </div>

      {/* CRM Main Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Side: Listing and Filters */}
        <div className="w-full lg:w-1/3 flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-[#1F1F1F] space-y-4 bg-[#0A0A0A]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                type="text"
                placeholder="Buscar propietario, calle, teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
              />
            </div>

            {/* Date Filters Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Year Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Año</span>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedYear(val === 'all' ? 'all' : parseInt(val));
                  }}
                  className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1.5 text-xs outline-none focus:border-[#C9A962]"
                >
                  <option value="all">Todos</option>
                  <option value={currentYear}>{currentYear}</option>
                  <option value={currentYear - 1}>{currentYear - 1}</option>
                  <option value={currentYear - 2}>{currentYear - 2}</option>
                </select>
              </div>

              {/* Quarter Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Trimestre</span>
                <select
                  value={selectedQuarter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedQuarter(val === 'all' ? 'all' : parseInt(val));
                    if (val !== 'all') setSelectedMonth('all');
                  }}
                  className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1.5 text-xs outline-none focus:border-[#C9A962]"
                >
                  <option value="all">Todos</option>
                  <option value="1">Q1 (Ene-Mar)</option>
                  <option value="2">Q2 (Abr-Jun)</option>
                  <option value="3">Q3 (Jul-Sep)</option>
                  <option value="4">Q4 (Oct-Dic)</option>
                </select>
              </div>

              {/* Month Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Mes</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMonth(val === 'all' ? 'all' : parseInt(val));
                    if (val !== 'all') setSelectedQuarter('all');
                  }}
                  className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1.5 text-xs outline-none focus:border-[#C9A962]"
                >
                  <option value="all">Todos</option>
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Specific Date Picker */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#555] uppercase font-bold tracking-wider">Día exacto</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1 text-xs outline-none focus:border-[#C9A962]"
                />
              </div>
            </div>

            {/* Quick Actions / Clear Filters */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                  className={`px-2.5 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-colors ${selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'border-[#C9A962] text-[#C9A962] bg-[#C9A962]/5' : 'border-[#1F1F1F] text-[#888] hover:text-[#FAF8F5]'}`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDate(format(yesterday, 'yyyy-MM-dd'));
                  }}
                  className={`px-2.5 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-colors ${selectedDate === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') ? 'border-[#C9A962] text-[#C9A962] bg-[#C9A962]/5' : 'border-[#1F1F1F] text-[#888] hover:text-[#FAF8F5]'}`}
                >
                  Ayer
                </button>
              </div>

              {(search || selectedYear !== 'all' || selectedQuarter !== 'all' || selectedMonth !== 'all' || selectedDate) && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-primary font-bold text-[#C9A962] uppercase tracking-wider hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Acquisitions List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[#888888] font-primary text-sm">Cargando captaciones...</div>
            ) : filteredCaptaciones.length === 0 ? (
              <div className="p-8 text-center text-[#666666] font-primary text-sm flex flex-col gap-2">
                <span>No se encontraron captaciones</span>
                {getQuickPeriodLabel() && (
                  <span className="text-xs text-[#555]">Para el periodo: {getQuickPeriodLabel()}</span>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#1F1F1F]">
                {filteredCaptaciones.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-4 hover:bg-[#111111] transition-colors border-l-2 flex justify-between items-center ${selectedCaptacion?.id === item.id ? 'bg-[#111111] border-l-[#C9A962]' : 'border-l-2 border-transparent'}`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-primary font-medium text-[#FAF8F5] text-sm truncate mb-1">
                        {item.property_address}
                      </h4>
                      <p className="text-xs text-[#888888] truncate mb-2">{item.owner_name}</p>
                      
                      <div className="flex items-center gap-2 text-[10px] text-[#555] font-primary font-medium">
                        <Calendar className="w-3 h-3 text-[#555]" />
                        <span>Contacto: {format(new Date(item.contact_date), "d MMM yyyy", { locale: es })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-primary font-bold ${CAPTACION_STATUS_COLORS[item.status]}`}>
                        {CAPTACION_STATUS_LABELS[item.status]}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#333]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: detail view / form */}
        <div className="w-full lg:w-2/3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col">
          
          {isCreating ? (
            /* Creation Form */
            <form onSubmit={handleCreate} className="flex-1 flex flex-col h-full">
              <div className="p-6 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0F0F0F]">
                <div>
                  <h2 className="text-lg font-secondary text-[#FAF8F5] uppercase tracking-wider">Nueva Captación</h2>
                  <p className="text-xs text-[#666] font-primary">Completa los datos del propietario y del inmueble</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-[#888] hover:text-[#FAF8F5] border border-[#1F1F1F] hover:bg-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto font-primary text-sm">
                
                {/* Propietario */}
                <div className="space-y-4">
                  <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
                    Datos del Propietario
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888]">Nombre completo *</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888]">Teléfono</label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="Ej. +34 600 000 000"
                        className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs text-[#888]">Correo electrónico</label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="Ej. juan@propietario.com"
                        className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Inmueble */}
                <div className="space-y-4">
                  <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
                    Datos del Inmueble
                  </h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#888]">Dirección de la propiedad *</label>
                    <input
                      type="text"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      placeholder="Ej. Calle Mayor 12, 3º B, Madrid"
                      className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#888]">Enlace de la publicación del propietario</label>
                    <input
                      type="url"
                      value={propertyAdUrl}
                      onChange={(e) => setPropertyAdUrl(e.target.value)}
                      placeholder="Ej. https://www.idealista.com/inmueble/..."
                      className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#888]">Características del inmueble</label>
                    <textarea
                      value={propertyFeatures}
                      onChange={(e) => setPropertyFeatures(e.target.value)}
                      placeholder="Ej. Piso de 85m², 3 habitaciones, 2 baños..."
                      className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Estado y Fecha */}
                <div className="space-y-4">
                  <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
                    Estado y Seguimiento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888]">Estado de la captación</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as CaptacionStatus)}
                        className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                      >
                        <option value="seguimiento">Seguimiento</option>
                        <option value="visita_planificada">Visita Planificada</option>
                        <option value="captado">Captado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-[#888]">Fecha de contacto inicial</label>
                      <input
                        type="date"
                        value={contactDate}
                        onChange={(e) => setContactDate(e.target.value)}
                        className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#888]">Notas iniciales de seguimiento</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Escribe comentarios, llamadas, llamadas concertadas..."
                      className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors min-h-[100px] resize-none"
                    />
                  </div>
                </div>

              </div>

              <div className="p-4 border-t border-[#1F1F1F] flex justify-end gap-3 bg-[#0F0F0F]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#111] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C9A962] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
                >
                  Crear Captación
                </button>
              </div>
            </form>
          ) : selectedCaptacion ? (
            /* Detailed View & Edit Panel */
            <div className="flex-1 flex flex-col h-full">
              
              {/* Header */}
              <div className="p-6 border-b border-[#1F1F1F] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F0F]">
                <div>
                  <h2 className="text-lg font-secondary text-[#FAF8F5] uppercase tracking-wider">
                    {isEditing ? 'Editar Captación' : selectedCaptacion.property_address}
                  </h2>
                  <p className="text-xs text-[#666] font-primary mt-1">
                    Propietario: <span className="text-[#888] font-bold">{selectedCaptacion.owner_name}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {!isEditing ? (
                    <>
                      {/* Inline Status Selector */}
                      <select
                        value={selectedCaptacion.status}
                        onChange={(e) => handleUpdateStatusOnly(e.target.value as CaptacionStatus)}
                        className={`text-xs px-3 py-1.5 rounded-sm border outline-none font-bold uppercase tracking-wider cursor-pointer ${CAPTACION_STATUS_COLORS[selectedCaptacion.status]}`}
                      >
                        <option value="seguimiento">Seguimiento</option>
                        <option value="visita_planificada">Visita Planificada</option>
                        <option value="captado">Captado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>

                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3.5 py-1.5 border border-[#C9A962] text-[#C9A962] text-xs font-primary font-bold uppercase tracking-wider hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(selectedCaptacion.id)}
                        className="p-2 text-[#666] hover:text-red-400 border border-[#1F1F1F] hover:bg-[#111]"
                        title="Eliminar Captación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-primary font-bold uppercase tracking-wider hover:bg-[#111]"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* CRM Card Content */}
              {isEditing ? (
                /* Edit Form Mode */
                <form onSubmit={handleUpdate} className="flex-1 flex flex-col h-full min-h-0">
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto font-primary text-sm">
                    
                    {/* Owner Details */}
                    <div className="space-y-4">
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
                        Datos del Propietario
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#888]">Nombre completo *</label>
                          <input
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                            required
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#888]">Teléfono</label>
                          <input
                            type="tel"
                            value={ownerPhone}
                            onChange={(e) => setOwnerPhone(e.target.value)}
                            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-xs text-[#888]">Correo electrónico</label>
                          <input
                            type="email"
                            value={ownerEmail}
                            onChange={(e) => setOwnerEmail(e.target.value)}
                            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-4">
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
                        Datos del Inmueble
                      </h3>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#888]">Dirección de la propiedad *</label>
                        <input
                          type="text"
                          value={propertyAddress}
                          onChange={(e) => setPropertyAddress(e.target.value)}
                          className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#888]">Enlace de la publicación del propietario</label>
                        <input
                          type="url"
                          value={propertyAdUrl}
                          onChange={(e) => setPropertyAdUrl(e.target.value)}
                          className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#888]">Características del inmueble</label>
                        <textarea
                          value={propertyFeatures}
                          onChange={(e) => setPropertyFeatures(e.target.value)}
                          className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors min-h-[120px] resize-none"
                        />
                      </div>
                    </div>

                    {/* Status & Date */}
                    <div className="space-y-4">
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
                        Seguimiento y Registro
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#888]">Estado de la captación</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as CaptacionStatus)}
                            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                          >
                            <option value="seguimiento">Seguimiento</option>
                            <option value="visita_planificada">Visita Planificada</option>
                            <option value="captado">Captado</option>
                            <option value="rechazado">Rechazado</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[#888]">Fecha de contacto inicial</label>
                          <input
                            type="date"
                            value={contactDate}
                            onChange={(e) => setContactDate(e.target.value)}
                            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="p-4 border-t border-[#1F1F1F] flex justify-end gap-3 bg-[#0F0F0F]">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#111] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#C9A962] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              ) : (
                /* Details Read-Only Mode */
                <div className="flex-1 p-6 space-y-8 overflow-y-auto font-primary text-sm">
                  
                  {/* Owner Grid Details */}
                  <section>
                    <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-4">
                      Datos del Propietario
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="block text-xs text-[#555] mb-1">Nombre Completo</span>
                        <span className="text-[#FAF8F5] font-medium text-sm">{selectedCaptacion.owner_name}</span>
                      </div>

                      {selectedCaptacion.owner_phone ? (
                        <div>
                          <span className="block text-xs text-[#555] mb-1">Teléfono</span>
                          <a 
                            href={`tel:${selectedCaptacion.owner_phone}`} 
                            className="text-[#FAF8F5] hover:text-[#C9A962] font-medium text-sm flex items-center gap-1.5 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#C9A962]" />
                            {selectedCaptacion.owner_phone}
                          </a>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-xs text-[#555] mb-1">Teléfono</span>
                          <span className="text-[#444] italic">No proporcionado</span>
                        </div>
                      )}

                      {selectedCaptacion.owner_email ? (
                        <div>
                          <span className="block text-xs text-[#555] mb-1">Correo Electrónico</span>
                          <a 
                            href={`mailto:${selectedCaptacion.owner_email}`} 
                            className="text-[#FAF8F5] hover:text-[#C9A962] font-medium text-sm flex items-center gap-1.5 hover:underline truncate"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#C9A962]" />
                            {selectedCaptacion.owner_email}
                          </a>
                        </div>
                      ) : (
                        <div>
                          <span className="block text-xs text-[#555] mb-1">Correo Electrónico</span>
                          <span className="text-[#444] italic">No proporcionado</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Property Grid Details */}
                  <section>
                    <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-4">
                      Detalles del Inmueble
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#C9A962] mt-0.5" />
                        <div>
                          <span className="block text-xs text-[#555] mb-0.5">Dirección</span>
                          <span className="text-[#FAF8F5] font-medium text-sm">{selectedCaptacion.property_address}</span>
                        </div>
                      </div>

                      {selectedCaptacion.property_ad_url ? (
                        <div className="flex items-start gap-2">
                          <ExternalLink className="w-4 h-4 text-[#C9A962] mt-0.5" />
                          <div>
                            <span className="block text-xs text-[#555] mb-0.5">Enlace de la publicación del propietario</span>
                            <a 
                              href={selectedCaptacion.property_ad_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[#C9A962] hover:text-[#D4B673] font-medium text-sm flex items-center gap-1 hover:underline break-all"
                            >
                              {selectedCaptacion.property_ad_url}
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <ExternalLink className="w-4 h-4 text-[#333] mt-0.5" />
                          <div>
                            <span className="block text-xs text-[#555] mb-0.5">Enlace de la publicación</span>
                            <span className="text-[#444] italic">Sin enlace de publicación</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="block text-xs text-[#555] mb-1.5">Características del Inmueble</span>
                        {selectedCaptacion.property_features ? (
                          <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded text-sm text-[#FAF8F5] whitespace-pre-wrap leading-relaxed">
                            {selectedCaptacion.property_features}
                          </div>
                        ) : (
                          <span className="text-[#444] italic">Sin características especificadas</span>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Tracking Detail */}
                  <section>
                    <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-4">
                      Registro y Control Diario
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 bg-[#111] border border-[#1F1F1F] p-3 rounded">
                        <Calendar className="w-4 h-4 text-[#C9A962]" />
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold tracking-wider">Fecha de Contacto</span>
                          <span className="text-sm font-semibold text-[#FAF8F5]">
                            {format(new Date(selectedCaptacion.contact_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#111] border border-[#1F1F1F] p-3 rounded">
                        <Briefcase className="w-4 h-4 text-[#C9A962]" />
                        <div>
                          <span className="block text-[10px] text-[#555] uppercase font-bold tracking-wider">Última Actualización</span>
                          <span className="text-sm font-semibold text-[#FAF8F5]">
                            {format(new Date(selectedCaptacion.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Notes follow up */}
                  <section className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-1.5">
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest">
                        Notas Internas / Seguimiento Diario
                      </h3>
                      <button
                        onClick={handleSaveNotesOnly}
                        className="text-xs font-bold text-[#C9A962] hover:underline uppercase tracking-wider"
                      >
                        Guardar Notas
                      </button>
                    </div>

                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Añade aquí comentarios de llamadas, citas acordadas, o el progreso de la negociación..."
                      className="w-full bg-[#111] border border-[#1F1F1F] rounded p-3 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#C9A962] min-h-[150px] resize-none leading-relaxed"
                    />
                  </section>

                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-[#888888] font-primary p-8 text-center bg-[#070707]">
              <Briefcase className="w-12 h-12 text-[#1F1F1F] mb-4" />
              <h3 className="text-[#FAF8F5] font-secondary uppercase text-sm tracking-widest mb-1">
                Ficha de Captación
              </h3>
              <p className="text-xs text-[#666666] max-w-xs leading-relaxed">
                Selecciona una captación de la lista de la izquierda para ver su historial completo o pulsa en el botón superior para agregar una nueva propiedad captada.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
