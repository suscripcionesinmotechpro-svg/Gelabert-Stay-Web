"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, Phone, Calendar, AlertTriangle, UserX, X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface CaptacionAlert {
  id: string;
  type: 'follow_up_today' | 'follow_up_overdue' | 'visit_today' | 'unassigned';
  owner_name: string;
  property_address: string;
  follow_up_date?: string | null;
  visit_date?: string | null;
  agent_id?: string | null;
}

const ALERT_CONFIG = {
  follow_up_today: {
    icon: <Phone className="w-3.5 h-3.5 flex-shrink-0" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    label: '📞 Seguimiento para hoy',
  },
  follow_up_overdue: {
    icon: <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    label: '⚠️ Seguimientos vencidos',
  },
  visit_today: {
    icon: <Calendar className="w-3.5 h-3.5 flex-shrink-0" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    label: '🏠 Visitas programadas hoy',
  },
  unassigned: {
    icon: <UserX className="w-3.5 h-3.5 flex-shrink-0" />,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-400/10',
    label: '🆕 Sin agente asignado',
  },
};

export const CaptacionesNotifications = () => {
  const [alerts, setAlerts] = useState<CaptacionAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const nowDate = new Date();
    nowDate.setHours(0, 0, 0, 0);

    const { data: captaciones } = await supabase
      .from('captaciones')
      .select('id, owner_name, property_address, follow_up_date, visit_date, agent_id, status')
      .not('status', 'in', '(rechazado,captado,contrato_en_proceso)');

    if (!captaciones) return;

    const newAlerts: CaptacionAlert[] = [];

    for (const c of captaciones) {
      // Follow-up today
      if (c.follow_up_date === todayStr) {
        newAlerts.push({ id: `follow_today_${c.id}`, type: 'follow_up_today', ...c });
      }
      // Follow-up overdue (past date, not null)
      else if (c.follow_up_date && c.follow_up_date < todayStr) {
        newAlerts.push({ id: `follow_overdue_${c.id}`, type: 'follow_up_overdue', ...c });
      }

      // Visit today
      if (c.visit_date) {
        const visitDate = new Date(c.visit_date);
        const visitDay = format(visitDate, 'yyyy-MM-dd');
        if (visitDay === todayStr) {
          newAlerts.push({ id: `visit_today_${c.id}`, type: 'visit_today', ...c });
        }
      }

      // Unassigned for more than 24h (no agent)
      if (!c.agent_id) {
        newAlerts.push({ id: `unassigned_${c.id}`, type: 'unassigned', ...c });
      }
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    fetchAlerts();

    // Refresh every 10 minutes
    const interval = setInterval(fetchAlerts, 10 * 60 * 1000);

    // Also refresh on captaciones changes
    const channel = supabase
      .channel('captaciones_notif_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captaciones' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));
  const count = visibleAlerts.length;

  const grouped = {
    follow_up_today: visibleAlerts.filter(a => a.type === 'follow_up_today'),
    follow_up_overdue: visibleAlerts.filter(a => a.type === 'follow_up_overdue'),
    visit_today: visibleAlerts.filter(a => a.type === 'visit_today'),
    unassigned: visibleAlerts.filter(a => a.type === 'unassigned'),
  };

  const handleGoToCaptacion = (captacionId: string) => {
    navigate(`/admin/captaciones?id=${captacionId}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-zinc-400 hover:text-[#FAF8F5] transition-colors rounded-sm hover:bg-[#1F1F1F]"
        title="Notificaciones de captaciones"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#C9A962] text-[#0A0A0A] text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F1F] bg-[#0F0F0F]">
            <h3 className="font-primary text-xs font-bold uppercase tracking-widest text-[#FAF8F5]">
              Notificaciones
            </h3>
            {count > 0 && (
              <span className="text-[10px] font-primary text-zinc-500">{count} pendientes</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {count === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs font-primary text-zinc-500">Sin notificaciones pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-[#111111]">
                {(Object.entries(grouped) as [keyof typeof grouped, CaptacionAlert[]][]).map(([type, items]) => {
                  if (items.length === 0) return null;
                  const cfg = ALERT_CONFIG[type];
                  return (
                    <div key={type}>
                      {/* Group Header */}
                      <div className={`px-4 py-2 ${cfg.bgColor}`}>
                        <p className={`text-[10px] font-primary font-bold uppercase tracking-widest ${cfg.color}`}>
                          {cfg.label} ({items.length})
                        </p>
                      </div>

                      {/* Items */}
                      {items.map(alert => (
                        <div
                          key={alert.id}
                          className="px-4 py-2.5 hover:bg-[#111111] transition-colors flex items-start gap-2 group"
                        >
                          <div className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => handleGoToCaptacion(alert.id.split('_').pop() || '')}
                          >
                            <p className="text-xs font-primary text-[#FAF8F5] truncate group-hover:text-[#C9A962] transition-colors">
                              {alert.owner_name}
                            </p>
                            <p className="text-[10px] font-primary text-zinc-500 truncate">
                              {alert.property_address}
                            </p>
                            {alert.type === 'follow_up_today' && alert.follow_up_date && (
                              <p className="text-[10px] text-orange-400 font-primary mt-0.5">
                                Llamar hoy
                              </p>
                            )}
                            {alert.type === 'follow_up_overdue' && alert.follow_up_date && (
                              <p className="text-[10px] text-red-400 font-primary mt-0.5">
                                Vencido el {format(new Date(alert.follow_up_date), 'd MMM', { locale: es })}
                              </p>
                            )}
                            {alert.type === 'visit_today' && alert.visit_date && (
                              <p className="text-[10px] text-blue-400 font-primary mt-0.5">
                                Visita a las {format(new Date(alert.visit_date), 'HH:mm')}
                              </p>
                            )}
                          </button>
                          <div className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-[#C9A962] transition-colors" />
                            <button
                              onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                              className="p-0.5 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Ocultar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#1F1F1F] bg-[#0F0F0F]">
            <button
              onClick={() => { navigate('/admin/captaciones'); setOpen(false); }}
              className="text-[10px] font-primary text-[#C9A962] hover:underline uppercase tracking-wider font-bold"
            >
              Ver todas las captaciones →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
