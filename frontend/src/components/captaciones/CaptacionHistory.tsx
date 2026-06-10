"use client";
import { useCaptacionHistory } from '../../hooks/useCaptaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PlusCircle, RefreshCw, StickyNote, Calendar, UserCheck, Clock, Edit2
} from 'lucide-react';
import type { CaptacionHistoryAction } from '../../types/captacion';

const ACTION_CONFIG: Record<CaptacionHistoryAction, { icon: React.ReactNode; color: string }> = {
  created:        { icon: <PlusCircle className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  status_changed: { icon: <RefreshCw className="w-3.5 h-3.5" />,  color: 'text-blue-400' },
  note_added:     { icon: <StickyNote className="w-3.5 h-3.5" />,  color: 'text-yellow-400' },
  follow_up_set:  { icon: <Clock className="w-3.5 h-3.5" />,       color: 'text-orange-400' },
  visit_scheduled:{ icon: <Calendar className="w-3.5 h-3.5" />,   color: 'text-blue-400' },
  agent_assigned: { icon: <UserCheck className="w-3.5 h-3.5" />,  color: 'text-[#C9A962]' },
  field_updated:  { icon: <Edit2 className="w-3.5 h-3.5" />,      color: 'text-zinc-400' },
};

interface Props {
  captacionId: string | null;
}

export const CaptacionHistory = ({ captacionId }: Props) => {
  const { history, loading } = useCaptacionHistory(captacionId);

  if (!captacionId) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-[#C9A962] text-xs font-bold uppercase tracking-widest border-b border-[#1F1F1F] pb-1.5 mb-3">
        Historial de Actividad
      </h3>

      {loading ? (
        <div className="text-xs text-zinc-500 font-primary py-4 text-center">Cargando historial...</div>
      ) : history.length === 0 ? (
        <div className="text-xs text-zinc-500 font-primary py-4 text-center">
          Aún no hay actividad registrada
        </div>
      ) : (
        <div className="relative pl-5">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-[#1F1F1F]" />

          <div className="space-y-4">
            {history.map((entry) => {
              const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.field_updated;
              return (
                <div key={entry.id} className="relative flex gap-3 items-start">
                  {/* Dot */}
                  <div className={`absolute -left-[19px] top-0.5 w-[15px] h-[15px] rounded-full bg-[#0A0A0A] border border-[#1F1F1F] flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#FAF8F5] font-primary leading-snug">
                      {entry.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.agent_name && (
                        <span className="text-[10px] text-[#C9A962] font-primary font-medium">
                          {entry.agent_name}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-primary">
                        {format(new Date(entry.created_at), "d MMM yyyy · HH:mm", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
