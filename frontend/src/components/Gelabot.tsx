import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Send, Home, Building2, TrendingUp, MapPin,
  Euro, Users, Briefcase, Calendar, ShieldCheck, ExternalLink, Maximize2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyDetails {
  id: string; title: string; price: number; main_image: string;
  slug: string; description?: string; bedrooms?: number; bathrooms?: number; sqft?: number;
}

interface ChatMessage {
  role: 'bot' | 'user';
  content: React.ReactNode;
  isForm?: boolean;
}

interface AIMessage {
  role: 'assistant' | 'user';
  content: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Gelabot = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const t = (es: string, en: string) => lang === 'en' ? en : es;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [flow, setFlow] = useState<'none' | 'chat'>('none');
  const [activeProperty, setActiveProperty] = useState<PropertyDetails | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Refs para no tener closures obsoletos en funciones async
  const externalIdRef = useRef<string>('');
  const aiHistoryRef = useRef<AIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let id = localStorage.getItem('gelabot_uid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('gelabot_uid', id);
    }
    externalIdRef.current = id;
    initChat(id);
  }, []);

  const initChat = async (id: string) => {
    // Intentar cargar historial previo de Supabase
    const { data } = await supabase
      .from('gelabot_conversations')
      .select('messages')
      .eq('external_id', id)
      .maybeSingle();

    if (data && data.messages && data.messages.length > 0) {
      // Reconstruir la vista de mensajes desde el historial (solo rol assistant y user)
      const uiMessages: ChatMessage[] = (data.messages as AIMessage[])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role === 'assistant' ? 'bot' as const : 'user' as const,
          content: m.content
        }));
      setMessages(uiMessages);
      aiHistoryRef.current = (data.messages as any[]).filter(
        (m) => m.role === 'user' || m.role === 'assistant'
      );
      setFlow('chat');
    } else {
      // Primera vez: mostrar bienvenida
      const welcome = t(
        'Hola, soy GelaBot, el asistente virtual de Gelabert Homes. ¿Qué estás buscando?',
        'Hi, I am GelaBot, the virtual assistant of Gelabert Homes. What are you looking for?'
      );
      setMessages([{ role: 'bot', content: welcome }]);
      aiHistoryRef.current = [{ role: 'assistant', content: welcome }];
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const pushUI = (role: 'bot' | 'user', content: React.ReactNode, isForm = false) => {
    setMessages(prev => [...prev, { role, content, isForm }]);
  };

  const pushAI = (role: 'assistant' | 'user', content: string) => {
    aiHistoryRef.current = [...aiHistoryRef.current, { role, content }];
  };

  // ─── AI Call ────────────────────────────────────────────────────────────────

  const callAI = async () => {
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('gelabot-chat', {
        body: {
          messages: aiHistoryRef.current,
          externalId: externalIdRef.current
        }
      });

      setIsTyping(false);

      if (error) {
        console.error('GelaBot error:', error);
        pushUI('bot', t('Error de conexión. Inténtalo de nuevo.', 'Connection error. Please try again.'));
        return;
      }

      const reply: string = data?.reply || '';

      if (reply.includes('[SHOW_FORM:')) {
        const formType = reply.match(/\[SHOW_FORM:([^\]]+)\]/)?.[1];
        const cleanReply = reply.replace(/\[SHOW_FORM:[^\]]+\]/g, '').trim();
        if (cleanReply) {
          pushUI('bot', cleanReply);
          pushAI('assistant', cleanReply);
        }
        if (formType) {
          pushUI('bot', (
            <ChatForm
              type={formType}
              onSubmit={(formData) => handleFormSubmit(formType, formData)}
            />
          ), true);
          pushAI('assistant', `[Formulario ${formType} mostrado]`);
        }
      } else {
        pushUI('bot', reply);
        pushAI('assistant', reply);
      }
    } catch (err) {
      setIsTyping(false);
      console.error('GelaBot callAI exception:', err);
      pushUI('bot', t('Error inesperado. Inténtalo de nuevo.', 'Unexpected error. Please try again.'));
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStartFlow = (type: 'alquilar' | 'alquilar_propietario' | 'vender' | 'comprar') => {
    setFlow('chat');
    const msg =
      type === 'alquilar' ? 'Soy inquilino y busco piso de alquiler' :
      type === 'alquilar_propietario' ? 'Soy propietario y quiero alquilar mi piso' :
      type === 'vender' ? 'Quiero vender mi propiedad' :
      'Quiero comprar una propiedad';

    pushUI('user', msg);
    pushAI('user', msg);
    callAI();
  };

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('msg') as HTMLInputElement).value.trim();
    if (!input) return;
    form.reset();

    pushUI('user', input);
    pushAI('user', input);
    callAI();
  };

  const handleFormSubmit = (type: string, formData: any) => {
    const summary = `He completado el formulario de ${type}: ${JSON.stringify(formData)}`;
    pushUI('user', t('He enviado el formulario de cualificación.', 'I submitted the qualification form.'));
    pushAI('user', summary);
    callAI();
  };

  // Abrir ficha de propiedad en panel lateral
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (a?.href?.includes('/propiedades/')) {
        e.preventDefault();
        const slug = a.href.split('/propiedades/')[1];
        if (slug) {
          const { data } = await supabase
            .from('properties').select('*').eq('slug', slug).maybeSingle();
          if (data) setActiveProperty(data);
        }
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="gelabot-window"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`bg-[#0A0A0A] border border-[#C9A962]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
                isExpanded
                  ? 'w-[90vw] sm:w-[900px] h-[80vh]'
                  : 'w-[360px] h-[550px] sm:w-[420px] sm:h-[640px]'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] p-4 border-b border-[#C9A962]/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C9A962]/10 rounded-xl flex items-center justify-center border border-[#C9A962]/30">
                    <Bot className="text-[#C9A962]" size={22} />
                  </div>
                  <div>
                    <h2 className="text-[#FAF8F5] font-secondary font-bold tracking-tight text-sm">GelaBot</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-[#888888] uppercase tracking-widest">Agente virtual</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setIsExpanded(v => !v)} className="p-2 text-[#888888] hover:text-[#C9A962] transition-colors">
                    <Maximize2 size={18} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 text-[#888888] hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className={`flex flex-1 overflow-hidden ${isExpanded ? 'flex-col sm:flex-row' : ''}`}>
                {/* Chat column */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#C9A962] text-[#0A0A0A] font-semibold rounded-tr-none'
                            : msg.isForm
                              ? 'bg-transparent p-0 w-full max-w-full'
                              : 'bg-[#1A1A1A] text-[#FAF8F5] border border-[#2A2A2A] rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl rounded-tl-none px-4 py-3">
                          <div className="flex gap-1 items-center">
                            <span className="w-2 h-2 bg-[#C9A962] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#C9A962] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#C9A962] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Intent buttons */}
                  {flow === 'none' && !isTyping && (
                    <div className="p-3 grid grid-cols-2 gap-2 bg-[#0F0F0F] border-t border-[#222]">
                      {[
                        { type: 'alquilar', icon: <Home size={15} />, label: t('Soy Inquilino', 'I am a Tenant') },
                        { type: 'alquilar_propietario', icon: <Building2 size={15} />, label: t('Soy Propietario', 'I am an Owner') },
                        { type: 'vender', icon: <TrendingUp size={15} />, label: t('Vender', 'Sell') },
                        { type: 'comprar', icon: <MapPin size={15} />, label: t('Comprar', 'Buy') },
                      ].map(({ type, icon, label }) => (
                        <button
                          key={type}
                          onClick={() => handleStartFlow(type as any)}
                          className="p-2 text-[11px] bg-[#1A1A1A] border border-[#C9A962]/20 rounded-xl text-[#FAF8F5] hover:border-[#C9A962] hover:bg-[#C9A962]/5 transition-all flex flex-col items-center gap-1.5"
                        >
                          <span className="text-[#C9A962]">{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Text input */}
                  {flow === 'chat' && (
                    <form onSubmit={handleInputSubmit} className="p-3 bg-[#0A0A0A] border-t border-[#222] flex gap-2 shrink-0">
                      <input
                        name="msg"
                        autoComplete="off"
                        placeholder={t('Escribe tu mensaje...', 'Type your message...')}
                        className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors placeholder-[#555]"
                      />
                      <button
                        type="submit"
                        className="w-10 h-10 bg-[#C9A962] text-[#0A0A0A] rounded-xl flex items-center justify-center hover:bg-[#D4B673] transition-colors shrink-0"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  )}
                </div>

                {/* Property side panel */}
                <AnimatePresence>
                  {isExpanded && activeProperty && (
                    <motion.div
                      key="property-panel"
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      className="w-full sm:w-[380px] bg-[#0F0F0F] border-l border-[#C9A962]/20 flex flex-col"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img src={activeProperty.main_image} alt={activeProperty.title} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setActiveProperty(null)}
                          className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full backdrop-blur-sm"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                          <p className="text-[#C9A962] font-bold text-lg">{activeProperty.price?.toLocaleString()}€</p>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
                        <h3 className="text-[#FAF8F5] font-secondary text-base leading-snug">{activeProperty.title}</h3>
                        <div className="flex flex-wrap gap-2 text-xs text-[#888]">
                          {activeProperty.bedrooms && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
                              <Home size={12} className="text-[#C9A962]" /> {activeProperty.bedrooms} hab.
                            </span>
                          )}
                          {activeProperty.bathrooms && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
                              <Building2 size={12} className="text-[#C9A962]" /> {activeProperty.bathrooms} baños
                            </span>
                          )}
                          {activeProperty.sqft && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
                              <TrendingUp size={12} className="text-[#C9A962]" /> {activeProperty.sqft} m²
                            </span>
                          )}
                        </div>
                        <p className="text-[#FAF8F5]/70 text-xs leading-relaxed line-clamp-4">{activeProperty.description}</p>
                        <a
                          href={`/propiedades/${activeProperty.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-auto flex items-center justify-center gap-2 py-3 bg-[#C9A962] text-[#0A0A0A] rounded-xl font-bold text-sm hover:bg-[#D4B673] transition-colors"
                        >
                          Ver ficha completa <ExternalLink size={14} />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trigger button — round, draggable, no green dot */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(v => !v)}
          className="w-16 h-16 bg-[#C9A962] rounded-full flex items-center justify-center shadow-xl shadow-[#C9A962]/30 border border-[#FAF8F5]/10 group relative overflow-hidden cursor-grab active:cursor-grabbing"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          <Bot className="text-[#0A0A0A] group-hover:rotate-12 transition-transform duration-300" size={30} />
        </motion.button>
      </motion.div>
    </>
  );
};

// ─── ChatForm ─────────────────────────────────────────────────────────────────

const ChatForm = ({ type, onSubmit }: { type: string; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const set = (key: string) => (v: string) => setFormData(p => ({ ...p, [key]: v }));

  return (
    <div className="flex flex-col gap-3 p-1">
      {(type === 'inquilino') && (
        <>
          <FF label="Personas que vivirán" icon={<Users size={14} />} placeholder="Ej: 2 adultos" onChange={set('personas')} />
          <FF label="Ocupación" icon={<Briefcase size={14} />} placeholder="Ej: Ingeniero" onChange={set('ocupacion')} />
          <FF label="Ingresos netos / mes" icon={<Euro size={14} />} placeholder="Ej: 3500€" onChange={set('ingresos')} />
          <FF label="Antigüedad laboral" icon={<Calendar size={14} />} placeholder="Ej: 2 años" onChange={set('antiguedad')} />
          <FF label="Fecha de entrada" icon={<Calendar size={14} />} type="date" onChange={set('fecha_entrada')} />
        </>
      )}
      {(type === 'propietario_alquiler' || type === 'propietario_venta') && (
        <>
          <FF label="Dirección" icon={<MapPin size={14} />} placeholder="Calle, número, ciudad" onChange={set('direccion')} />
          <div className="grid grid-cols-2 gap-2">
            <FF label="Habitaciones" placeholder="0" type="number" onChange={set('habitaciones')} />
            <FF label="Baños" placeholder="0" type="number" onChange={set('banos')} />
          </div>
          <FF label="Precio" icon={<Euro size={14} />} type="number" placeholder="€" onChange={set('precio')} />
        </>
      )}
      {(type === 'comprador') && (
        <>
          <FF label="Presupuesto máximo" icon={<Euro size={14} />} type="number" placeholder="€" onChange={set('presupuesto')} />
          <FF label="Zona preferida" icon={<MapPin size={14} />} placeholder="Ej: El Limonar" onChange={set('zona')} />
        </>
      )}

      <label className="flex items-start gap-2 p-2.5 bg-[#C9A962]/10 border border-[#C9A962]/20 rounded-xl cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 accent-[#C9A962]"
        />
        <span className="text-[10px] text-[#FAF8F5]/80 leading-relaxed">
          Acepto la{' '}
          <a href="/privacidad" target="_blank" className="text-[#C9A962] underline">
            política de privacidad
          </a>
        </span>
      </label>

      <button
        disabled={!agreed}
        onClick={() => onSubmit(formData)}
        className="w-full py-3 bg-[#C9A962] text-[#0A0A0A] rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#D4B673] transition-colors"
      >
        <ShieldCheck size={16} /> Enviar información
      </button>
    </div>
  );
};

// ─── FormField ────────────────────────────────────────────────────────────────

const FF = ({
  label, icon, placeholder, type = 'text', onChange
}: {
  label: string; icon?: React.ReactNode; placeholder?: string; type?: string; onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] text-[#666] uppercase tracking-wider pl-0.5">{label}</span>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A962]">{icon}</div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-[#111] border border-[#2A2A2A] rounded-xl py-2.5 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none transition-colors placeholder-[#444] ${icon ? 'pl-9' : 'pl-3'} pr-3`}
      />
    </div>
  </div>
);

export default Gelabot;
