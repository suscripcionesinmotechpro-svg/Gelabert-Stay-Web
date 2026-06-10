import { useState, useEffect } from 'react';
import { useCaptaciones, useCaptacionesMutations } from '../../hooks/useCaptaciones';
import { supabase } from '../../lib/supabase';
import { 
  Briefcase, Search, Plus, Trash2, Mail, Phone, MapPin, 
  Calendar, Filter, X, ChevronRight, User, ExternalLink,
  Download, Printer, Sparkles, MessageCircle, LayoutList, LayoutGrid,
  AlertTriangle, TrendingUp, Clock, CheckCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { 
  CAPTACION_STATUS_LABELS, CAPTACION_STATUS_COLORS,
  CAPTACION_PRIORITY_LABELS, CAPTACION_OPERATION_LABELS,
} from '../../types/captacion';
import type { Captacion, CaptacionStatus, CaptacionPriority, CaptacionOperation } from '../../types/captacion';
import { CaptacionHistory } from '../../components/captaciones/CaptacionHistory';
import { CaptacionKanban } from '../../components/captaciones/CaptacionKanban';

type ViewMode = 'list' | 'kanban';

export const AdminCaptaciones = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const agentFilterId = selectedAgentId === 'all' ? undefined : selectedAgentId;

  const { captaciones, loading, refetch } = useCaptaciones(agentFilterId);
  const { createCaptacion, updateCaptacion, deleteCaptacion } = useCaptacionesMutations();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Search & Period Filters
  const [search, setSearch] = useState('');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Selection & Form State
  const [selectedCaptacion, setSelectedCaptacion] = useState<Captacion | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<Captacion[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<any>(null);

  // Form fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyFeatures, setPropertyFeatures] = useState('');
  const [propertyAdUrl, setPropertyAdUrl] = useState('');
  const [status, setStatus] = useState<CaptacionStatus>('pendiente_contacto');
  const [priority, setPriority] = useState<CaptacionPriority>('media');
  const [operation, setOperation] = useState<CaptacionOperation>('alquiler');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [contactDate, setContactDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [visitDate, setVisitDate] = useState('');
  const [extractingFeatures, setExtractingFeatures] = useState(false);

  // Agents list
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

  const matchPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    if (selectedYear !== 'all' && date.getFullYear() !== selectedYear) return false;
    const monthNum = date.getMonth() + 1;

    if (selectedQuarter !== 'all') {
      const qMonths: Record<number, number[]> = {
        1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12]
      };
      if (!qMonths[selectedQuarter].includes(monthNum)) return false;
    }

    if (selectedMonth !== 'all' && monthNum !== selectedMonth) return false;
    if (selectedDate && dateStr !== selectedDate) return false;
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

  // ── Metrics ────────────────────────────────────────────────────────────────
  const metrics = {
    total: filteredCaptaciones.length,
    captados: filteredCaptaciones.filter(c => c.status === 'captado' || c.status === 'contrato_en_proceso').length,
    visitasPlanificadas: filteredCaptaciones.filter(c => c.status === 'visita_planificada').length,
    seguimientosHoy: filteredCaptaciones.filter(c => {
      if (!c.follow_up_date) return false;
      return c.follow_up_date === format(new Date(), 'yyyy-MM-dd');
    }).length,
  };

  // ── Duplicate Detection ────────────────────────────────────────────────────
  const checkDuplicates = (phone: string, address: string): Captacion[] => {
    return captaciones.filter(c => {
      const samePhone = phone && c.owner_phone && 
        c.owner_phone.replace(/\D/g, '') === phone.replace(/\D/g, '');
      const sameAddress = address && c.property_address.toLowerCase().trim() === address.toLowerCase().trim();
      return samePhone || sameAddress;
    });
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = (captacion: Captacion) => {
    setSelectedCaptacion(captacion);
    setIsCreating(false);
    setIsEditing(false);
    setOwnerName(captacion.owner_name);
    setOwnerEmail(captacion.owner_email || '');
    setOwnerPhone(captacion.owner_phone || '');
    setPropertyAddress(captacion.property_address);
    setPropertyFeatures(captacion.property_features || '');
    setPropertyAdUrl(captacion.property_ad_url || '');
    setStatus(captacion.status);
    setPriority(captacion.priority || 'media');
    setOperation(captacion.operation || 'alquiler');
    setEstimatedPrice(captacion.estimated_price ? String(captacion.estimated_price) : '');
    setContactDate(captacion.contact_date);
    setNotes(captacion.notes || '');
    setAssignedAgentId(captacion.agent_id || '');
    setVisitDate(captacion.visit_date ? captacion.visit_date.substring(0, 16) : '');
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedCaptacion(null);
    setIsEditing(false);
    setOwnerName(''); setOwnerEmail(''); setOwnerPhone('');
    setPropertyAddress(''); setPropertyFeatures(''); setPropertyAdUrl('');
    setStatus('pendiente_contacto'); setPriority('media'); setOperation('alquiler');
    setEstimatedPrice('');
    setContactDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes(''); setAssignedAgentId(''); setVisitDate('');
    setDuplicateWarning([]);
  };

  const doCreateCaptacion = async (payload: any) => {
    try {
      const id = await createCaptacion(payload);
      toast.success('Captación agregada correctamente');
      setIsCreating(false);
      setShowDuplicateModal(false);
      setPendingCreate(null);
      setDuplicateWarning([]);
      refetch();
      const newCap: Captacion = {
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...payload,
      };
      handleSelect(newCap);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al crear captación: ' + err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !propertyAddress) {
      toast.error('Nombre del propietario y Dirección son obligatorios');
      return;
    }
    if (status === 'visita_planificada' && !visitDate) {
      toast.error('Por favor, selecciona la fecha y hora para la visita agendada.');
      return;
    }

    const payload = {
      owner_name: ownerName,
      owner_email: ownerEmail || null,
      owner_phone: ownerPhone || null,
      property_address: propertyAddress,
      property_features: propertyFeatures || null,
      property_ad_url: propertyAdUrl || null,
      status,
      priority,
      operation,
      estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
      contact_date: contactDate,
      notes: notes || null,
      agent_id: assignedAgentId || null,
      visit_date: status === 'visita_planificada' && visitDate ? visitDate : null,
      follow_up_date: null,
    };

    // Check for duplicates
    const dupes = checkDuplicates(ownerPhone, propertyAddress);
    if (dupes.length > 0) {
      setDuplicateWarning(dupes);
      setPendingCreate(payload);
      setShowDuplicateModal(true);
      return;
    }

    await doCreateCaptacion(payload);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptacion) return;
    if (!ownerName || !propertyAddress) {
      toast.error('Nombre del propietario y Dirección son obligatorios');
      return;
    }
    if (status === 'visita_planificada' && !visitDate) {
      toast.error('Por favor, selecciona la fecha y hora para la visita agendada.');
      return;
    }

    try {
      const updateData = {
        owner_name: ownerName,
        owner_email: ownerEmail || null,
        owner_phone: ownerPhone || null,
        property_address: propertyAddress,
        property_features: propertyFeatures || null,
        property_ad_url: propertyAdUrl || null,
        status,
        priority,
        operation,
        estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
        contact_date: contactDate,
        notes: notes || null,
        agent_id: assignedAgentId || null,
        visit_date: status === 'visita_planificada' && visitDate ? visitDate : null,
      };

      await updateCaptacion(selectedCaptacion.id, updateData, selectedCaptacion);
      toast.success('Cambios guardados correctamente');
      setIsEditing(false);
      refetch();
      setSelectedCaptacion({ ...selectedCaptacion, ...updateData });
    } catch (err: any) {
      console.error(err);
      toast.error('Error al actualizar: ' + err.message);
    }
  };

  const handleUpdateStatusOnly = async (newStatus: CaptacionStatus) => {
    if (!selectedCaptacion) return;
    if (newStatus === 'visita_planificada') {
      setStatus('visita_planificada');
      setIsEditing(true);
      toast('Por favor, selecciona la fecha y hora para la visita agendada.');
      return;
    }
    try {
      await updateCaptacion(selectedCaptacion.id, { status: newStatus }, selectedCaptacion);
      toast.success(`Estado actualizado a: ${CAPTACION_STATUS_LABELS[newStatus]}`);
      setStatus(newStatus);
      setSelectedCaptacion({ ...selectedCaptacion, status: newStatus });
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cambiar de estado');
    }
  };

  const handleKanbanStatusChange = async (id: string, newStatus: CaptacionStatus) => {
    const cap = captaciones.find(c => c.id === id);
    if (!cap) return;
    if (newStatus === 'visita_planificada') {
      handleSelect(cap);
      setIsEditing(true);
      setViewMode('list');
      toast('Selecciona la fecha y hora de la visita');
      return;
    }
    try {
      await updateCaptacion(id, { status: newStatus }, cap);
      toast.success(`Estado → ${CAPTACION_STATUS_LABELS[newStatus]}`);
      refetch();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleAssignAgentDirectly = async (agentId: string | null) => {
    if (!selectedCaptacion) return;
    try {
      await updateCaptacion(selectedCaptacion.id, { agent_id: agentId }, selectedCaptacion);
      toast.success('Agente asignado correctamente');
      setAssignedAgentId(agentId || '');
      setSelectedCaptacion({ ...selectedCaptacion, agent_id: agentId });
      refetch();
    } catch (err: any) {
      toast.error('Error al asignar agente');
    }
  };

  const handleSaveNotesOnly = async () => {
    if (!selectedCaptacion) return;
    try {
      await updateCaptacion(selectedCaptacion.id, { notes }, selectedCaptacion);
      toast.success('Notas internas guardadas');
      setSelectedCaptacion({ ...selectedCaptacion, notes });
      refetch();
    } catch (err: any) {
      toast.error('Error al guardar notas');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta captación? Esta acción no se puede deshacer.')) return;
    try {
      await deleteCaptacion(id);
      toast.success('Captación eliminada');
      setSelectedCaptacion(null);
      refetch();
    } catch (err: any) {
      toast.error('Error al eliminar');
    }
  };

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const getGoogleCalendarUrl = (c: Captacion) => {
    if (!c.visit_date) return '';
    const startDate = new Date(c.visit_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = `Visita a propiedad: ${c.property_address}`;
    const details = `Propietario: ${c.owner_name}\nTeléfono: ${c.owner_phone || '-'}\nEmail: ${c.owner_email || '-'}\n\n${c.property_features || ''}\n\n${c.notes || ''}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(c.property_address)}`;
  };

  const getOutlookCalendarUrl = (c: Captacion) => {
    if (!c.visit_date) return '';
    const startDate = new Date(c.visit_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const title = `Visita a propiedad: ${c.property_address}`;
    const details = `Propietario: ${c.owner_name}\nTeléfono: ${c.owner_phone || '-'}\nEmail: ${c.owner_email || '-'}\n\n${c.notes || ''}`;
    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(c.property_address)}`;
  };

  const handleDownloadICS = (c: Captacion) => {
    if (!c.visit_date) return;
    const startDate = new Date(c.visit_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = `Visita a propiedad: ${c.property_address}`;
    const details = `Propietario: ${c.owner_name}\\nTeléfono: ${c.owner_phone || '-'}\\nEmail: ${c.owner_email || '-'}\\n\\n${(c.notes || '').replace(/\n/g, '\\n')}`;
    const icsContent = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gelabert Homes//CRM//ES', 'BEGIN:VEVENT',
      `UID:${c.id}-visit`, `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(startDate)}`, `DTEND:${fmt(endDate)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${details}`, `LOCATION:${c.property_address}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Visita_${c.property_address.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Archivo .ics descargado correctamente.');
  };

  const handleExtractFeaturesWithAI = async () => {
    if (!propertyFeatures.trim()) {
      toast.error('Por favor, escribe algo en el campo de características para que la IA lo analice.');
      return;
    }
    setExtractingFeatures(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { mode: 'extract-features', text: propertyFeatures }
      });
      if (error) throw error;
      if (data?.result) {
        setPropertyFeatures(data.result);
        toast.success('Características estructuradas con IA.');
      } else if (data?.error) throw new Error(data.error);
    } catch (err: any) {
      toast.error('Error al extraer características con IA: ' + err.message);
    } finally {
      setExtractingFeatures(false);
    }
  };

  // ── Filters helpers ─────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch(''); setSelectedYear('all'); setSelectedQuarter('all');
    setSelectedMonth('all'); setSelectedDate('');
  };

  const getQuickPeriodLabel = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (selectedDate === todayStr) return 'Hoy';
    if (selectedDate === yesterdayStr) return 'Ayer';
    if (selectedMonth !== 'all') {
      return ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][selectedMonth - 1];
    }
    if (selectedQuarter !== 'all') return `Trimestre Q${selectedQuarter}`;
    return null;
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Sin asignar';
    const ag = agentsList.find(a => a.id === agentId);
    return ag ? ag.agent_name : 'Cargando...';
  };

  const getPeriodLabelText = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    if (selectedDate) {
      if (selectedDate === todayStr) return 'Diario (Hoy)';
      if (selectedDate === yesterdayStr) return 'Diario (Ayer)';
      return `Diario (${format(new Date(selectedDate), 'dd/MM/yyyy')})`;
    }
    if (selectedMonth !== 'all') {
      const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      const yearStr = selectedYear !== 'all' ? ` ${selectedYear}` : ` ${new Date().getFullYear()}`;
      return `Mensual (${months[selectedMonth - 1]}${yearStr})`;
    }
    if (selectedQuarter !== 'all') {
      const yearStr = selectedYear !== 'all' ? ` ${selectedYear}` : ` ${new Date().getFullYear()}`;
      return `Trimestral (Q${selectedQuarter}${yearStr})`;
    }
    if (selectedYear !== 'all') return `Anual (${selectedYear})`;
    return 'Listado Completo';
  };

  const handleExportExcel = () => {
    if (filteredCaptaciones.length === 0) { toast.error('No hay captaciones para exportar'); return; }
    const headers = ['Fecha de Contacto','Dirección','Propietario','Teléfono','Email','Estado','Prioridad','Operación','Precio Est.','Agente','Características','Enlace','Notas'];
    const esc = (val: string | null | undefined) => {
      if (val === null || val === undefined) return '';
      return `"${String(val).replace(/[\r\n]+/g, ' ').replace(/"/g, '""')}"`;
    };
    const rows = filteredCaptaciones.map(c => [
      format(new Date(c.contact_date), 'yyyy-MM-dd'),
      esc(c.property_address), esc(c.owner_name), esc(c.owner_phone), esc(c.owner_email),
      esc(CAPTACION_STATUS_LABELS[c.status]),
      esc(CAPTACION_PRIORITY_LABELS[c.priority || 'media']),
      esc(CAPTACION_OPERATION_LABELS[c.operation || 'alquiler']),
      c.estimated_price ? String(c.estimated_price) : '',
      esc(getAgentName(c.agent_id)), esc(c.property_features), esc(c.property_ad_url), esc(c.notes)
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateLabel = format(new Date(), 'yyyy-MM-dd_HHmm');
    link.setAttribute('href', url);
    link.setAttribute('download', `Captaciones_${getPeriodLabelText().replace(/\s+/g, '_')}_${dateLabel}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Excel (CSV) exportado correctamente');
  };

  const handleExportPDF = () => {
    if (filteredCaptaciones.length === 0) { toast.error('No hay captaciones para exportar'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('El navegador bloqueó la ventana emergente.'); return; }
    const periodLabel = getPeriodLabelText();
    const todayStr = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
    const stats = filteredCaptaciones.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const rowsHtml = filteredCaptaciones.map((c, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#111111' : '#000000'}; border-bottom: 1px solid #1F1F1F;">
        <td style="padding: 10px; color: #FAF8F5;">${format(new Date(c.contact_date), 'dd/MM/yyyy')}</td>
        <td style="padding: 10px; color: #FAF8F5; font-weight: 600;">${c.property_address}</td>
        <td style="padding: 10px;">${c.owner_name}</td>
        <td style="padding: 10px;">${c.owner_phone || '-'}</td>
        <td style="padding: 10px; text-transform: uppercase; font-weight: bold;">
          <span style="padding: 3px 8px; border-radius: 9999px; font-size: 10px; border: 1px solid #C9A962; color: #C9A962;">${CAPTACION_STATUS_LABELS[c.status]}</span>
        </td>
        <td style="padding: 10px; color: #C9A962;">${getAgentName(c.agent_id)}</td>
      </tr>`).join('');
    const statsHtml = Object.entries(CAPTACION_STATUS_LABELS).map(([s, label]) => `
      <div style="background-color: #111; border: 1px solid #1F1F1F; padding: 12px; border-radius: 4px; text-align: center; min-width: 120px;">
        <div style="font-size: 10px; color: #d4d4d8; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">${label}</div>
        <div style="font-size: 20px; font-weight: bold; color: #C9A962;">${stats[s] || 0}</div>
      </div>`).join('');
    const htmlContent = `<!DOCTYPE html><html><head><title>Reporte de Captaciones - ${periodLabel}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        body{font-family:'Outfit',sans-serif;background:#050505;color:#e4e4e7;margin:0;padding:40px;}
        header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1F1F1F;padding-bottom:20px;margin-bottom:30px;}
        h1{color:#FAF8F5;font-size:24px;margin:0 0 5px 0;text-transform:uppercase;letter-spacing:2px;}
        h2{color:#C9A962;font-size:14px;margin:0;text-transform:uppercase;letter-spacing:1px;}
        .stats-container{display:flex;gap:15px;margin-bottom:30px;flex-wrap:wrap;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th{background:#0A0A0A;border-bottom:2px solid #1F1F1F;color:#FAF8F5;text-transform:uppercase;font-size:10px;letter-spacing:1px;text-align:left;padding:12px 10px;}
        @media print{body{background:#fff;color:#000;padding:0;}h1,h2{color:#000;}.stats-container div{background:#f5f5f5;border-color:#e0e0e0;}th{background:#eaeaea;color:#000;border-color:#ccc;}tr{page-break-inside:avoid;background:#fff !important;}}
      </style></head><body>
      <header><div><h2>Reporte de Gestión</h2><h1>Listado de Captaciones</h1>
        <div style="font-size:12px;color:#d4d4d8;margin-top:5px;">Periodo: <strong>${periodLabel}</strong></div></div>
        <div style="text-align:right;font-size:12px;"><div style="color:#C9A962;font-weight:bold;font-size:14px;">GELABERT HOMES</div>
          <div style="color:#d4d4d8;margin-top:5px;">Generado el ${todayStr}</div>
          <div style="color:#d4d4d8;margin-top:2px;">Total: <strong>${filteredCaptaciones.length}</strong></div></div></header>
      <div class="stats-container">${statsHtml}</div>
      <table><thead><tr><th>Fecha</th><th>Dirección</th><th>Propietario</th><th>Teléfono</th><th>Estado</th><th>Agente</th></tr></thead>
        <tbody>${rowsHtml}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print();},500);}</script>
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ── Shared form fields component ────────────────────────────────────────────
  const renderFormFields = () => (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto font-primary text-sm">

      {/* Propietario */}
      <div className="space-y-4">
        <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
          Datos del Propietario
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Nombre completo *</label>
            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Teléfono</label>
            <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
              placeholder="Ej. +34 600 000 000"
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-zinc-400">Correo electrónico</label>
            <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
              placeholder="Ej. juan@propietario.com"
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" />
          </div>
        </div>
      </div>

      {/* Inmueble */}
      <div className="space-y-4">
        <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
          Datos del Inmueble
        </h3>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Dirección de la propiedad *</label>
          <input type="text" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)}
            placeholder="Ej. Calle Mayor 12, 3º B, Madrid"
            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Tipo de Operación</label>
            <select value={operation} onChange={e => setOperation(e.target.value as CaptacionOperation)}
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors">
              <option value="alquiler">Alquiler</option>
              <option value="venta">Venta</option>
              <option value="traspaso">Traspaso</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Prioridad</label>
            <select value={priority} onChange={e => setPriority(e.target.value as CaptacionPriority)}
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors">
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Media</option>
              <option value="baja">🟢 Baja</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Precio Estimado (€)</label>
            <input type="number" value={estimatedPrice} onChange={e => setEstimatedPrice(e.target.value)}
              placeholder="Ej. 850"
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Enlace de la publicación</label>
          <input type="url" value={propertyAdUrl} onChange={e => setPropertyAdUrl(e.target.value)}
            placeholder="Ej. https://www.idealista.com/inmueble/..."
            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-zinc-400">Características del inmueble</label>
            <button type="button" onClick={handleExtractFeaturesWithAI} disabled={extractingFeatures}
              className="text-[10px] text-[#C9A962] hover:text-[#D4B673] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors disabled:opacity-50">
              <Sparkles className="w-3 h-3 animate-pulse" />
              {extractingFeatures ? 'Extrayendo...' : 'Extraer con IA'}
            </button>
          </div>
          <textarea value={propertyFeatures} onChange={e => setPropertyFeatures(e.target.value)}
            placeholder="Ej. Piso de 85m², 3 habitaciones, 2 baños..."
            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors min-h-[100px] resize-none" />
        </div>
      </div>

      {/* Estado y Asignación */}
      <div className="space-y-4">
        <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5">
          Estado y Asignación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Estado de la captación</label>
            <select value={status} onChange={e => setStatus(e.target.value as CaptacionStatus)}
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors">
              <option value="pendiente_contacto">Pendiente de Contacto</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="visita_planificada">Visita Planificada</option>
              <option value="captado">Captado</option>
              <option value="contrato_en_proceso">Contrato en Proceso</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Agente Responsable</label>
            <select value={assignedAgentId} onChange={e => setAssignedAgentId(e.target.value)}
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors">
              <option value="">Sin Asignar</option>
              {agentsList.map(a => (
                <option key={a.id} value={a.id}>{a.agent_name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">Fecha de contacto</label>
            <input type="date" value={contactDate} onChange={e => setContactDate(e.target.value)}
              className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" required />
          </div>
        </div>

        {status === 'visita_planificada' && (
          <div className="flex flex-col gap-1 border border-[#C9A962]/20 bg-[#C9A962]/5 p-4 rounded-sm">
            <label className="text-xs text-[#C9A962] font-bold uppercase tracking-wider">
              Programar fecha y hora de la visita *
            </label>
            <input type="datetime-local" value={visitDate} onChange={e => setVisitDate(e.target.value)}
              className="bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" required />
            <p className="text-[10px] text-zinc-400">
              Indica la fecha y hora en la que se realizará la visita a la propiedad.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Notas iniciales</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notas de contacto inicial..."
            className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors min-h-[100px] resize-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0A0A0A] border border-yellow-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <h3 className="font-secondary text-[#FAF8F5] text-base uppercase tracking-wider">Posibles Duplicados</h3>
            </div>
            <p className="text-xs text-zinc-400 font-primary mb-4">
              Se encontraron captaciones con datos similares. Un propietario puede tener varios inmuebles. ¿Deseas guardar igualmente?
            </p>
            <div className="space-y-2 mb-5 max-h-40 overflow-y-auto">
              {duplicateWarning.map(d => (
                <div key={d.id} className="bg-[#111] border border-yellow-500/20 rounded p-3">
                  <p className="text-xs font-primary text-[#FAF8F5] font-medium">{d.property_address}</p>
                  <p className="text-[10px] text-zinc-400 font-primary">{d.owner_name} · {d.owner_phone || 'Sin teléfono'}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${CAPTACION_STATUS_COLORS[d.status]}`}>
                    {CAPTACION_STATUS_LABELS[d.status]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDuplicateModal(false); setPendingCreate(null); setDuplicateWarning([]); }}
                className="flex-1 px-4 py-2 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#111] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => pendingCreate && doCreateCaptacion(pendingCreate)}
                className="flex-1 px-4 py-2 bg-[#C9A962] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D4B673] transition-colors"
              >
                Guardar Igualmente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 gap-4 bg-[#111111] p-5 border border-[#1F1F1F] rounded-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-[#C9A962] text-xs uppercase tracking-[0.2em]">Panel de Control Administrador</span>
          </div>
          <h1 className="font-secondary text-2xl text-[#FAF8F5] uppercase tracking-wider">Control Maestro de Captaciones</h1>
          {/* Metrics Row */}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#C9A962]" />
              <span className="text-[11px] font-primary text-zinc-400">Total: <strong className="text-[#FAF8F5]">{metrics.total}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-primary text-zinc-400">Captados: <strong className="text-emerald-400">{metrics.captados}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-primary text-zinc-400">Visitas: <strong className="text-blue-400">{metrics.visitasPlanificadas}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-primary text-zinc-400">Seguimiento hoy: <strong className="text-orange-400">{metrics.seguimientosHoy}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Agent Filter */}
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] px-4 py-2.5 rounded-sm">
            <Filter className="w-4 h-4 text-[#C9A962]" />
            <span className="font-primary text-xs text-zinc-400 uppercase tracking-wider font-bold">Agente:</span>
            <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)}
              className="bg-transparent text-[#C9A962] font-primary text-xs uppercase tracking-wider font-bold outline-none cursor-pointer">
              <option value="all">Todos</option>
              {agentsList.map(a => (
                <option key={a.id} value={a.id}>{a.agent_name}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex border border-[#1F1F1F] rounded-sm overflow-hidden">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'list' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'bg-[#111] text-zinc-400 hover:text-[#FAF8F5]'}`}>
              <LayoutList className="w-3.5 h-3.5" /> Lista
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'kanban' ? 'bg-[#C9A962] text-[#0A0A0A]' : 'bg-[#111] text-zinc-400 hover:text-[#FAF8F5]'}`}>
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>

          <button onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161616] text-[#FAF8F5] border border-[#1F1F1F] font-primary font-bold text-xs uppercase tracking-wider hover:bg-[#1F1F1F] transition-colors whitespace-nowrap">
            <Download className="w-3.5 h-3.5 text-[#C9A962]" /> Excel
          </button>
          <button onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#161616] text-[#FAF8F5] border border-[#1F1F1F] font-primary font-bold text-xs uppercase tracking-wider hover:bg-[#1F1F1F] transition-colors whitespace-nowrap">
            <Printer className="w-3.5 h-3.5 text-[#C9A962]" /> PDF
          </button>
          <button onClick={handleStartCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A962] text-[#0A0A0A] font-primary font-bold text-sm uppercase tracking-wider hover:bg-[#D4B673] transition-colors whitespace-nowrap ml-auto xl:ml-0">
            <Plus className="w-4 h-4" /> Nueva Captación
          </button>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-400 font-primary text-sm">Cargando captaciones...</div>
          ) : (
            <CaptacionKanban
              captaciones={filteredCaptaciones}
              agentsList={agentsList}
              onSelect={(c) => { handleSelect(c); setViewMode('list'); }}
              onStatusChange={handleKanbanStatusChange}
            />
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

          {/* Left: List & Filters */}
          <div className="w-full lg:w-1/3 flex flex-col bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 border-b border-[#1F1F1F] space-y-4 bg-[#0A0A0A]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="text" placeholder="Buscar propietario, calle, teléfono..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#C9A962] transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Año</span>
                  <select value={selectedYear} onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1.5 text-xs outline-none focus:border-[#C9A962]">
                    <option value="all">Todos</option>
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear - 1}>{currentYear - 1}</option>
                    <option value={currentYear - 2}>{currentYear - 2}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Trimestre</span>
                  <select value={selectedQuarter} onChange={e => { const v = e.target.value; setSelectedQuarter(v === 'all' ? 'all' : parseInt(v)); if (v !== 'all') setSelectedMonth('all'); }}
                    className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1.5 text-xs outline-none focus:border-[#C9A962]">
                    <option value="all">Todos</option>
                    <option value="1">Q1 (Ene-Mar)</option>
                    <option value="2">Q2 (Abr-Jun)</option>
                    <option value="3">Q3 (Jul-Sep)</option>
                    <option value="4">Q4 (Oct-Dic)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mes</span>
                  <select value={selectedMonth} onChange={e => { const v = e.target.value; setSelectedMonth(v === 'all' ? 'all' : parseInt(v)); if (v !== 'all') setSelectedQuarter('all'); }}
                    className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1.5 text-xs outline-none focus:border-[#C9A962]">
                    <option value="all">Todos</option>
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((name, idx) => (
                      <option key={idx} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Día exacto</span>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="bg-[#111] border border-[#1F1F1F] text-[#FAF8F5] px-2 py-1 text-xs outline-none focus:border-[#C9A962]" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  <button onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                    className={`px-2.5 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-colors ${selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'border-[#C9A962] text-[#C9A962] bg-[#C9A962]/5' : 'border-[#1F1F1F] text-zinc-400 hover:text-[#FAF8F5]'}`}>
                    Hoy
                  </button>
                  <button onClick={() => setSelectedDate(format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'))}
                    className={`px-2.5 py-1 text-[10px] font-primary font-bold uppercase tracking-wider border transition-colors ${selectedDate === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') ? 'border-[#C9A962] text-[#C9A962] bg-[#C9A962]/5' : 'border-[#1F1F1F] text-zinc-400 hover:text-[#FAF8F5]'}`}>
                    Ayer
                  </button>
                </div>
                {(search || selectedYear !== 'all' || selectedQuarter !== 'all' || selectedMonth !== 'all' || selectedDate) && (
                  <button onClick={clearFilters} className="text-[10px] font-primary font-bold text-[#C9A962] uppercase tracking-wider hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" /> Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-zinc-400 font-primary text-sm">Cargando captaciones...</div>
              ) : filteredCaptaciones.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 font-primary text-sm flex flex-col gap-2">
                  <span>No se encontraron captaciones</span>
                  {getQuickPeriodLabel() && (
                    <span className="text-xs text-zinc-600">Para el periodo: {getQuickPeriodLabel()}</span>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#1F1F1F]">
                  {filteredCaptaciones.map((item) => {
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const contactDay = new Date(item.contact_date); contactDay.setHours(0, 0, 0, 0);
                    const daysSince = differenceInDays(today, contactDay);

                    let followUpBadge = null;
                    if (item.follow_up_date) {
                      const fDate = new Date(item.follow_up_date); fDate.setHours(0, 0, 0, 0);
                      if (fDate.getTime() < today.getTime()) {
                        followUpBadge = <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/10 font-bold uppercase tracking-wider flex-shrink-0">Vencido</span>;
                      } else if (fDate.getTime() === today.getTime()) {
                        followUpBadge = <span className="text-[9px] px-1.5 py-0.5 rounded border border-orange-500/30 text-orange-400 bg-orange-500/10 font-bold uppercase tracking-wider animate-pulse flex-shrink-0">📞 Llamar Hoy</span>;
                      } else {
                        followUpBadge = <span className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500 bg-zinc-900/40 font-medium tracking-wider flex-shrink-0">Seg: {format(fDate, "d MMM", { locale: es })}</span>;
                      }
                    }

                    return (
                      <button key={item.id} onClick={() => handleSelect(item)}
                        className={`w-full text-left p-4 hover:bg-[#111111] transition-colors border-l-2 flex justify-between items-center ${selectedCaptacion?.id === item.id ? 'bg-[#111111] border-l-[#C9A962]' : 'border-l-transparent'}`}>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-primary font-medium text-[#FAF8F5] text-sm truncate flex-1">
                              {item.property_address}
                            </h4>
                            {followUpBadge}
                          </div>
                          <p className="text-xs text-zinc-300 truncate mb-1">{item.owner_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-primary">
                            {item.priority && (
                              <span className={`${item.priority === 'alta' ? 'text-red-400' : item.priority === 'media' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                {item.priority === 'alta' ? '●' : item.priority === 'media' ? '●' : '●'}
                              </span>
                            )}
                            <span className="text-[#C9A962] truncate">{getAgentName(item.agent_id)}</span>
                            <span>•</span>
                            <span>{format(new Date(item.contact_date), "d MMM yyyy", { locale: es })}</span>
                            <span>•</span>
                            <span>Hace {daysSince}d</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-primary font-bold ${CAPTACION_STATUS_COLORS[item.status]}`}>
                            {CAPTACION_STATUS_LABELS[item.status]}
                          </span>
                          {item.status === 'visita_planificada' && item.visit_date && (
                            <span className="text-[9px] text-[#C9A962] font-semibold flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />{format(new Date(item.visit_date), 'dd/MM HH:mm')}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#333]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail / Form */}
          <div className="w-full lg:w-2/3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col">

            {isCreating ? (
              <form onSubmit={handleCreate} className="flex-1 flex flex-col h-full">
                <div className="p-6 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0F0F0F]">
                  <div>
                    <h2 className="text-lg font-secondary text-[#FAF8F5] uppercase tracking-wider">Nueva Captación</h2>
                    <p className="text-xs text-zinc-400 font-primary">Completa los datos de la captación</p>
                  </div>
                  <button type="button" onClick={() => setIsCreating(false)}
                    className="p-2 text-zinc-400 hover:text-[#FAF8F5] border border-[#1F1F1F] hover:bg-[#1A1A1A]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {renderFormFields()}
                <div className="p-4 border-t border-[#1F1F1F] flex justify-end gap-3 bg-[#0F0F0F]">
                  <button type="button" onClick={() => setIsCreating(false)}
                    className="px-4 py-2 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#111] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="px-5 py-2 bg-[#C9A962] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D4B673] transition-colors">
                    Crear Captación
                  </button>
                </div>
              </form>

            ) : selectedCaptacion ? (
              <div className="flex-1 flex flex-col h-full">
                {/* Detail Header */}
                <div className="p-5 border-b border-[#1F1F1F] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F0F]">
                  <div className="min-w-0">
                    <h2 className="text-lg font-secondary text-[#FAF8F5] uppercase tracking-wider truncate">
                      {isEditing ? 'Editar Captación' : selectedCaptacion.property_address}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-xs text-zinc-400 font-primary">
                        Propietario: <span className="text-zinc-200 font-bold">{selectedCaptacion.owner_name}</span>
                      </p>
                      {selectedCaptacion.operation && (
                        <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 uppercase tracking-wider">
                          {CAPTACION_OPERATION_LABELS[selectedCaptacion.operation]}
                        </span>
                      )}
                      {selectedCaptacion.priority && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 ${selectedCaptacion.priority === 'alta' ? 'text-red-400' : selectedCaptacion.priority === 'media' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {CAPTACION_PRIORITY_LABELS[selectedCaptacion.priority]}
                        </span>
                      )}
                      {selectedCaptacion.estimated_price && (
                        <span className="text-[10px] text-[#C9A962] font-primary font-semibold">
                          {selectedCaptacion.estimated_price.toLocaleString('es-ES')} €
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isEditing ? (
                      <>
                        <select value={selectedCaptacion.status} onChange={e => handleUpdateStatusOnly(e.target.value as CaptacionStatus)}
                          className={`text-xs px-3 py-1.5 rounded-sm border outline-none font-bold uppercase tracking-wider cursor-pointer ${CAPTACION_STATUS_COLORS[selectedCaptacion.status]}`}>
                          <option value="pendiente_contacto">Pendiente de Contacto</option>
                          <option value="seguimiento">Seguimiento</option>
                          <option value="visita_planificada">Visita Planificada</option>
                          <option value="captado">Captado</option>
                          <option value="contrato_en_proceso">Contrato en Proceso</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                        <div className="flex items-center gap-1.5 bg-[#111] border border-[#1F1F1F] px-2.5 py-1 text-xs">
                          <User className="w-3.5 h-3.5 text-[#C9A962]" />
                          <select value={selectedCaptacion.agent_id || ''} onChange={e => handleAssignAgentDirectly(e.target.value || null)}
                            className="bg-transparent text-[#FAF8F5] outline-none cursor-pointer font-primary">
                            <option value="">Sin Asignar</option>
                            {agentsList.map(a => <option key={a.id} value={a.id}>{a.agent_name}</option>)}
                          </select>
                        </div>
                        <button onClick={() => setIsEditing(true)}
                          className="px-3.5 py-1.5 border border-[#C9A962] text-[#C9A962] text-xs font-primary font-bold uppercase tracking-wider hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(selectedCaptacion.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 border border-[#1F1F1F] hover:bg-[#111]" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-primary font-bold uppercase tracking-wider hover:bg-[#111]">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="flex-1 flex flex-col min-h-0">
                    {renderFormFields()}
                    <div className="p-4 border-t border-[#1F1F1F] flex justify-end gap-3 bg-[#0F0F0F]">
                      <button type="button" onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-[#1F1F1F] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#111] transition-colors">
                        Cancelar
                      </button>
                      <button type="submit"
                        className="px-5 py-2 bg-[#C9A962] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D4B673] transition-colors">
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Detail Read-Only */
                  <div className="flex-1 p-6 space-y-8 overflow-y-auto font-primary text-sm">

                    {/* Owner Details */}
                    <section>
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-4">
                        Datos del Propietario
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <span className="block text-xs text-zinc-500 mb-1">Nombre Completo</span>
                          <span className="text-[#FAF8F5] font-medium text-sm">{selectedCaptacion.owner_name}</span>
                        </div>
                        {selectedCaptacion.owner_phone ? (
                          <div>
                            <span className="block text-xs text-zinc-500 mb-1">Teléfono</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={`tel:${selectedCaptacion.owner_phone}`}
                                className="text-[#FAF8F5] hover:text-[#C9A962] font-medium text-sm flex items-center gap-1.5 hover:underline">
                                <Phone className="w-3.5 h-3.5 text-[#C9A962]" />{selectedCaptacion.owner_phone}
                              </a>
                              <a href={`https://wa.me/${selectedCaptacion.owner_phone.replace(/[^\d+]/g, '')}`}
                                target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors rounded-sm">
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="block text-xs text-zinc-500 mb-1">Teléfono</span>
                            <span className="text-zinc-600 italic">No proporcionado</span>
                          </div>
                        )}
                        {selectedCaptacion.owner_email ? (
                          <div>
                            <span className="block text-xs text-zinc-500 mb-1">Correo Electrónico</span>
                            <a href={`mailto:${selectedCaptacion.owner_email}`}
                              className="text-[#FAF8F5] hover:text-[#C9A962] font-medium text-sm flex items-center gap-1.5 hover:underline truncate">
                              <Mail className="w-3.5 h-3.5 text-[#C9A962]" />{selectedCaptacion.owner_email}
                            </a>
                          </div>
                        ) : (
                          <div>
                            <span className="block text-xs text-zinc-500 mb-1">Correo Electrónico</span>
                            <span className="text-zinc-600 italic">No proporcionado</span>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Property Details */}
                    <section>
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-4">
                        Detalles del Inmueble
                      </h3>
                      <div className="space-y-3 font-primary">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[#C9A962] mt-0.5" />
                          <div>
                            <span className="block text-xs text-zinc-500 mb-0.5">Dirección</span>
                            <span className="text-[#FAF8F5] font-medium text-sm">{selectedCaptacion.property_address}</span>
                          </div>
                        </div>
                        {/* Operation + Price + Priority */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-[#111] border border-[#1F1F1F] p-3 rounded">
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Operación</span>
                            <span className="text-sm font-semibold text-[#FAF8F5]">{CAPTACION_OPERATION_LABELS[selectedCaptacion.operation || 'alquiler']}</span>
                          </div>
                          <div className="bg-[#111] border border-[#1F1F1F] p-3 rounded">
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Prioridad</span>
                            <span className="text-sm font-semibold">{CAPTACION_PRIORITY_LABELS[selectedCaptacion.priority || 'media']}</span>
                          </div>
                          <div className="bg-[#111] border border-[#1F1F1F] p-3 rounded">
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Precio Est.</span>
                            <span className="text-sm font-semibold text-[#C9A962]">
                              {selectedCaptacion.estimated_price ? `${selectedCaptacion.estimated_price.toLocaleString('es-ES')} €` : '-'}
                            </span>
                          </div>
                        </div>
                        {selectedCaptacion.property_ad_url && (
                          <div className="flex items-start gap-2">
                            <ExternalLink className="w-4 h-4 text-[#C9A962] mt-0.5" />
                            <div>
                              <span className="block text-xs text-zinc-500 mb-0.5">Enlace de publicación</span>
                              <a href={selectedCaptacion.property_ad_url} target="_blank" rel="noreferrer"
                                className="text-[#C9A962] hover:text-[#D4B673] text-sm flex items-center gap-1 hover:underline break-all">
                                {selectedCaptacion.property_ad_url}
                              </a>
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="block text-xs text-zinc-500 mb-1.5">Características del Inmueble</span>
                          {selectedCaptacion.property_features ? (
                            <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded text-sm text-[#FAF8F5] whitespace-pre-wrap leading-relaxed">
                              {selectedCaptacion.property_features}
                            </div>
                          ) : (
                            <span className="text-zinc-600 italic">Sin características especificadas</span>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Visita Programada */}
                    {selectedCaptacion.status === 'visita_planificada' && selectedCaptacion.visit_date && (
                      <section className="border border-[#C9A962]/30 bg-[#C9A962]/5 p-5 rounded-md space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="block text-[10px] text-[#C9A962] uppercase font-bold tracking-wider mb-1">Visita Agendada</span>
                            <span className="text-base font-semibold text-[#FAF8F5]">
                              {format(new Date(selectedCaptacion.visit_date), "EEEE, d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                            </span>
                          </div>
                          <span className="text-xs px-2.5 py-0.5 rounded-full border border-blue-400/30 text-blue-400 bg-blue-400/10 font-bold uppercase tracking-wider">
                            Visita Planificada
                          </span>
                        </div>
                        <div className="border-t border-[#C9A962]/20 pt-4">
                          <span className="block text-xs text-zinc-400 mb-3 uppercase tracking-wider font-bold">Añadir a tu Calendario</span>
                          <div className="flex flex-wrap gap-2">
                            <a href={getGoogleCalendarUrl(selectedCaptacion)} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] border border-[#1F1F1F] text-xs text-[#FAF8F5] hover:border-[#C9A962] hover:text-[#C9A962] transition-colors rounded-sm font-primary font-bold uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" /> Google Calendar
                            </a>
                            <a href={getOutlookCalendarUrl(selectedCaptacion)} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] border border-[#1F1F1F] text-xs text-[#FAF8F5] hover:border-[#C9A962] hover:text-[#C9A962] transition-colors rounded-sm font-primary font-bold uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" /> Outlook
                            </a>
                            <button onClick={() => handleDownloadICS(selectedCaptacion)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#1A1A1A] border border-[#1F1F1F] text-xs text-[#FAF8F5] hover:border-[#C9A962] hover:text-[#C9A962] transition-colors rounded-sm font-primary font-bold uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" /> Apple / iCal (.ics)
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Follow-up Section */}
                    <section className="border border-[#1F1F1F] rounded-md p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest">Fecha de Siguiente Llamada / Seguimiento</h4>
                          <p className="text-[10px] text-zinc-500">Programa cuándo debes volver a contactar con este propietario.</p>
                        </div>
                        {selectedCaptacion.follow_up_date ? (
                          <span className="text-xs px-2.5 py-0.5 rounded-full border border-orange-400/30 text-orange-400 bg-orange-400/10 font-bold uppercase tracking-wider">
                            {format(new Date(selectedCaptacion.follow_up_date), "d MMM yyyy", { locale: es })}
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full border border-zinc-700 text-zinc-600 uppercase tracking-wider font-semibold">
                            Sin Programar
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <input type="date" value={selectedCaptacion.follow_up_date || ''}
                          onChange={e => {
                            const dateVal = e.target.value || null;
                            updateCaptacion(selectedCaptacion.id, { follow_up_date: dateVal }, selectedCaptacion)
                              .then(() => { toast.success('Seguimiento actualizado'); setSelectedCaptacion({ ...selectedCaptacion, follow_up_date: dateVal }); refetch(); })
                              .catch(err => toast.error('Error: ' + err.message));
                          }}
                          className="bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-3 py-1.5 text-xs focus:outline-none focus:border-[#C9A962] transition-colors rounded" />
                        <div className="flex gap-1.5">
                          {[
                            { label: '+3 días', days: 3, msg: 'Seguimiento en 3 días' },
                            { label: '+1 sem.', days: 7, msg: 'Seguimiento en 1 semana' },
                            { label: '+1 mes', months: 1, msg: 'Seguimiento en 1 mes' },
                          ].map(({ label, days, months, msg }) => (
                            <button key={label}
                              onClick={() => {
                                const d = new Date();
                                if (days) d.setDate(d.getDate() + days);
                                if (months) d.setMonth(d.getMonth() + months);
                                const str = format(d, 'yyyy-MM-dd');
                                updateCaptacion(selectedCaptacion.id, { follow_up_date: str }, selectedCaptacion)
                                  .then(() => { toast.success(msg); setSelectedCaptacion({ ...selectedCaptacion, follow_up_date: str }); refetch(); })
                                  .catch(err => toast.error(err.message));
                              }}
                              className="px-2 py-1 bg-[#1A1A1A] border border-[#1F1F1F] hover:border-[#C9A962] hover:text-[#C9A962] text-[10px] font-bold uppercase tracking-wider rounded transition-colors text-zinc-400">
                              {label}
                            </button>
                          ))}
                          {selectedCaptacion.follow_up_date && (
                            <button
                              onClick={() => updateCaptacion(selectedCaptacion.id, { follow_up_date: null }, selectedCaptacion)
                                .then(() => { toast.success('Seguimiento eliminado'); setSelectedCaptacion({ ...selectedCaptacion, follow_up_date: null }); refetch(); })
                                .catch(err => toast.error(err.message))}
                              className="px-2 py-1 bg-[#1A1A1A] border border-red-900/30 hover:bg-red-950/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors">
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </section>

                    {/* Tracking Info */}
                    <section>
                      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-4">
                        Registro y Control
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 bg-[#111] border border-[#1F1F1F] p-3 rounded">
                          <Calendar className="w-4 h-4 text-[#C9A962]" />
                          <div>
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Fecha de Contacto</span>
                            <span className="text-sm font-semibold text-[#FAF8F5]">
                              {format(new Date(selectedCaptacion.contact_date), "d MMM yyyy", { locale: es })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#111] border border-[#1F1F1F] p-3 rounded">
                          <User className="w-4 h-4 text-[#C9A962]" />
                          <div>
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Agente Asignado</span>
                            <span className="text-sm font-semibold text-[#FAF8F5]">{getAgentName(selectedCaptacion.agent_id)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#111] border border-[#1F1F1F] p-3 rounded">
                          <Briefcase className="w-4 h-4 text-[#C9A962]" />
                          <div>
                            <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Última Modificación</span>
                            <span className="text-sm font-semibold text-[#FAF8F5]">
                              {format(new Date(selectedCaptacion.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Internal Notes */}
                    <section className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[#1F1F1F] pb-1.5">
                        <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest">
                          Notas Internas / Seguimiento Diario
                        </h3>
                        <button onClick={handleSaveNotesOnly}
                          className="text-xs font-bold text-[#C9A962] hover:underline uppercase tracking-wider">
                          Guardar Notas
                        </button>
                      </div>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Añade aquí comentarios de llamadas, visitas, progresos..."
                        className="w-full bg-[#111] border border-[#1F1F1F] rounded p-3 text-sm text-[#FAF8F5] focus:outline-none focus:border-[#C9A962] min-h-[150px] resize-none leading-relaxed" />
                    </section>

                    {/* Activity History */}
                    <section className="border-t border-[#1F1F1F] pt-6">
                      <CaptacionHistory captacionId={selectedCaptacion.id} />
                    </section>

                  </div>
                )}
              </div>

            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 font-primary p-8 text-center bg-[#070707]">
                <Briefcase className="w-12 h-12 text-[#1F1F1F] mb-4" />
                <h3 className="text-[#FAF8F5] font-secondary uppercase text-sm tracking-widest mb-1">Ficha de Captación</h3>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Selecciona una captación de la lista para ver todos sus detalles, o pulsa en el botón superior para agregar una nueva.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
