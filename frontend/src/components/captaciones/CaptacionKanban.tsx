"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Phone, ChevronRight } from 'lucide-react';
import type { Captacion, CaptacionStatus } from '../../types/captacion';
import {
  CAPTACION_STATUS_LABELS,
  CAPTACION_STATUS_COLORS,
  CAPTACION_STATUS_ORDER,
} from '../../types/captacion';

// Helper to determine follow_up urgency
const getFollowUpUrgency = (dateStr: string | null) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 2) return 'soon';
  return 'upcoming';
};

const URGENCY_STYLES = {
  overdue:  'border-red-500 animate-pulse',
  today:    'border-orange-400',
  soon:     'border-yellow-400',
  upcoming: 'border-transparent',
};

interface KanbanCardProps {
  captacion: Captacion;
  agentName: string;
  onClick: () => void;
}

const KanbanCard = ({ captacion: c, agentName, onClick }: KanbanCardProps) => {
  const urgency = getFollowUpUrgency(c.follow_up_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const contactDate = new Date(c.contact_date);
  const daysDiff = Math.round((today.getTime() - contactDate.getTime()) / 86400000);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-[#111111] border border-[#1F1F1F] rounded-sm p-3 hover:border-[#2A2A2A] transition-all cursor-pointer group ${urgency ? URGENCY_STYLES[urgency] : ''}`}
      style={{ borderLeftWidth: urgency ? '2px' : undefined }}
    >
      {/* Address */}
      <p className="text-xs font-primary font-semibold text-[#FAF8F5] truncate mb-1 group-hover:text-[#C9A962] transition-colors">
        {c.property_address}
      </p>

      {/* Owner */}
      <p className="text-[10px] text-zinc-400 font-primary truncate mb-2">{c.owner_name}</p>

      <div className="flex items-center justify-between gap-1">
        {/* Days since contact */}
        <span className="text-[9px] text-zinc-500 font-primary">
          {daysDiff === 0 ? 'Hoy' : daysDiff === 1 ? 'Ayer' : `Hace ${daysDiff}d`}
        </span>

        {/* Follow-up badge */}
        {urgency === 'overdue' && (
          <span className="text-[9px] text-red-400 font-primary font-bold uppercase">⚠ Vencido</span>
        )}
        {urgency === 'today' && (
          <span className="text-[9px] text-orange-400 font-primary font-bold uppercase">📞 Hoy</span>
        )}
        {urgency === 'soon' && c.follow_up_date && (
          <span className="text-[9px] text-yellow-400 font-primary font-bold flex items-center gap-0.5">
            <Clock3 size={8} />{format(new Date(c.follow_up_date), 'dd/MM')}
          </span>
        )}
        {c.visit_date && c.status === 'visita_planificada' && (
          <span className="text-[9px] text-blue-400 font-primary flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {format(new Date(c.visit_date), 'dd/MM HH:mm')}
          </span>
        )}
      </div>

      {/* Agent */}
      {agentName && agentName !== 'Sin asignar' && (
        <p className="text-[9px] text-[#C9A962] font-primary mt-1.5 truncate">{agentName}</p>
      )}

      {/* Phone quick action */}
      {c.owner_phone && (
        <a
          href={`tel:${c.owner_phone}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center gap-1 text-[9px] text-zinc-500 hover:text-[#C9A962] transition-colors"
        >
          <Phone className="w-2.5 h-2.5" />
          {c.owner_phone}
        </a>
      )}
    </button>
  );
};

// Tiny icon component to avoid import issues
const Clock3 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface Props {
  captaciones: Captacion[];
  agentsList: { id: string; agent_name: string }[];
  onSelect: (c: Captacion) => void;
  onStatusChange: (id: string, status: CaptacionStatus) => void;
}

export const CaptacionKanban = ({ captaciones, agentsList, onSelect, onStatusChange }: Props) => {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<CaptacionStatus | null>(null);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Sin asignar';
    return agentsList.find(a => a.id === agentId)?.agent_name || 'Agente';
  };

  const byStatus = (status: CaptacionStatus) =>
    captaciones.filter(c => c.status === status);

  const handleDrop = (e: React.DragEvent, status: CaptacionStatus) => {
    e.preventDefault();
    if (dragging) {
      onStatusChange(dragging, status);
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-0 flex-1 items-start">
      {CAPTACION_STATUS_ORDER.map(status => {
        const items = byStatus(status);
        const isOver = dragOver === status;

        return (
          <div
            key={status}
            className={`flex-shrink-0 w-56 flex flex-col gap-2 transition-all ${isOver ? 'opacity-80' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-sm border ${CAPTACION_STATUS_COLORS[status]} bg-[#0A0A0A]`}>
              <span className="text-[10px] font-primary font-bold uppercase tracking-widest truncate">
                {CAPTACION_STATUS_LABELS[status]}
              </span>
              <span className="text-[10px] font-primary font-bold ml-2 bg-[#1F1F1F] px-1.5 py-0.5 rounded-full text-[#FAF8F5]">
                {items.length}
              </span>
            </div>

            {/* Drop zone highlight */}
            <div
              className={`flex flex-col gap-2 min-h-[80px] rounded-sm transition-colors p-1 -m-1 ${
                isOver ? 'bg-[#C9A962]/5 border border-dashed border-[#C9A962]/30' : ''
              }`}
            >
              {items.map(c => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragging(c.id)}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                  className={`transition-opacity ${dragging === c.id ? 'opacity-40' : 'opacity-100'}`}
                >
                  <KanbanCard
                    captacion={c}
                    agentName={getAgentName(c.agent_id)}
                    onClick={() => onSelect(c)}
                  />
                </div>
              ))}

              {items.length === 0 && (
                <div className={`flex items-center justify-center h-16 rounded-sm border border-dashed transition-colors ${
                  isOver ? 'border-[#C9A962]/50 text-[#C9A962]/50' : 'border-[#1A1A1A] text-zinc-700'
                }`}>
                  <span className="text-[10px] font-primary uppercase tracking-wider">
                    {isOver ? 'Soltar aquí' : 'Sin captaciones'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
