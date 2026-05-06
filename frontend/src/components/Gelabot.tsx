import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Home, Building2, TrendingUp, MapPin, Euro, Users, Briefcase, Calendar, ShieldCheck, ExternalLink, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

interface PropertyDetails {
  id: string;
  title: string;
  price: number;
  main_image: string;
  slug: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
}

interface ChatMessage {
  role: 'bot' | 'user';
  content: React.ReactNode;
  isForm?: boolean;
}

export const Gelabot = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [userLang] = useState<'es' | 'en' | null>(null);
  const lang = userLang || (i18n.language?.startsWith('en') ? 'en' : 'es');

  const botT = (es: any, en: any): any => lang === 'en' ? en : es;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [flow, setFlow] = useState<'none' | 'ai_chat'>('none');
  const [activeProperty, setActiveProperty] = useState<PropertyDetails | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [externalId, setExternalId] = useState<string>('');
  const aiHistoryRef = useRef<{ role: 'assistant' | 'user', content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar ID y cargar historial
  useEffect(() => {
    let id = localStorage.getItem('gelabot_external_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('gelabot_external_id', id);
    }
    const finalId = id || crypto.randomUUID();
    setExternalId(finalId);
    loadHistory(finalId);
  }, []);

  const loadHistory = async (id: string) => {
    const { data } = await supabase.from('gelabot_conversations').select('messages').eq('external_id', id).single();
    if (data && data.messages && data.messages.length > 0) {
      const history = data.messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'bot' : 'user',
        content: m.content
      }));
      setMessages(history);
      aiHistoryRef.current = data.messages;
      setFlow('ai_chat'); // Si hay historial, ya estamos en modo chat
    } else {
      setMessages([{
        role: 'bot',
        content: botT('Hola soy GelaBot el agente Virtual de Gelabert Homes Real Estate, ¿qué estás buscando?', 'Hi, I am GelaBot, the Virtual Agent of Gelabert Homes Real Estate, what are you looking for?')
      }]);
      aiHistoryRef.current = [{
        role: 'assistant',
        content: 'Hola soy GelaBot el agente Virtual de Gelabert Homes Real Estate, ¿qué estás buscando?'
      }];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const addMessage = (role: 'bot' | 'user', content: React.ReactNode, isForm = false) => {
    setMessages(prev => [...prev, { role, content, isForm }]);
    
    if (typeof content === 'string') {
      aiHistoryRef.current.push({
        role: role === 'bot' ? 'assistant' : 'user',
        content: content
      });
    } else {
      aiHistoryRef.current.push({
        role: role === 'bot' ? 'assistant' : 'user',
        content: '[Formulario/Interactuable mostrado]'
      });
    }
  };

  const handleStartFlow = async (type: 'alquilar' | 'alquilar_propietario' | 'vender' | 'comprar') => {
    setFlow('ai_chat');
    const startMsg = type === 'alquilar' ? 'soy inquilinos y busco alquiler' :
      type === 'alquilar_propietario' ? 'soy propietario y ofrezco alquiler' :
      type === 'vender' ? 'vender' : 'comprar';

    addMessage('user', startMsg);
    processAIResponse();
  };

  const processAIResponse = async () => {
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('gelabot-chat', {
        body: { 
          messages: aiHistoryRef.current.slice(-10), // Solo enviamos los últimos 10 para ahorrar tokens, el Edge Function cargará el resto si es necesario
          externalId 
        }
      });
      if (error) throw error;

      if (data.externalId && data.externalId !== externalId) {
        setExternalId(data.externalId);
        localStorage.setItem('gelabot_external_id', data.externalId);
      }

      setIsTyping(false);
      let reply = data.reply;

      if (reply.includes('[SHOW_FORM:')) {
        const formType = reply.match(/\[SHOW_FORM:([^\]]+)\]/)?.[1];
        const cleanReply = reply.replace(/\[SHOW_FORM:[^\]]+\]/g, '').trim();
        if (cleanReply) addMessage('bot', cleanReply);
        if (formType) {
          addMessage('bot', <ChatForm type={formType} onSubmit={(formData) => handleFormSubmit(formType, formData)} />, true);
        }
      } else {
        addMessage('bot', reply);
      }
    } catch (err) {
      setIsTyping(false);
      addMessage('bot', botT('Error de conexión.', 'Connection error.'));
    }
  };

  const handleFormSubmit = async (type: string, formData: any) => {
    const content = `He completado el formulario de ${type} con los siguientes datos: ${JSON.stringify(formData)}`;
    addMessage('user', botT('He completado el formulario.', 'I have completed the form.'));
    aiHistoryRef.current[aiHistoryRef.current.length - 1].content = content;
    processAIResponse();
  };

  const handleInputSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('msg') as HTMLInputElement).value.trim();
    if (!input) return;

    addMessage('user', input);
    form.reset();
    processAIResponse();
  };

  useEffect(() => {
    const handleLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.includes('/propiedades/')) {
        e.preventDefault();
        const slug = target.getAttribute('href')?.split('/').pop();
        if (slug) {
          const { data } = await supabase.from('properties').select('*').eq('slug', slug).single();
          if (data) setActiveProperty(data);
        }
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 ${isExpanded ? 'w-[calc(100%-48px)] sm:w-auto' : ''}`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`bg-[#0A0A0A] border border-[#C9A962]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isExpanded ? 'w-full sm:w-[900px] h-[80vh]' : 'w-[360px] h-[550px] sm:w-[420px] sm:h-[650px]'}`}
            >
              <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0A0A0A] p-4 border-b border-[#C9A962]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C9A962]/10 rounded-xl flex items-center justify-center border border-[#C9A962]/30">
                    <Bot className="text-[#C9A962]" size={24} />
                  </div>
                  <div>
                    <h2 className="text-[#FAF8F5] font-secondary font-bold tracking-tight">GelaBot</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-[#888888] uppercase tracking-widest font-primary font-medium">Memoria Activa</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-[#888888] hover:text-[#C9A962] transition-colors">
                    <Maximize2 size={20} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 text-[#888888] hover:text-[#FAF8F5] transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className={`flex flex-1 overflow-hidden relative ${isExpanded ? 'flex-col sm:flex-row' : ''}`}>
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-primary ${msg.role === 'user'
                            ? 'bg-[#C9A962] text-[#0A0A0A] font-bold rounded-tr-none'
                            : msg.isForm ? 'bg-transparent border-none p-0 w-full' : 'bg-[#1A1A1A] text-[#FAF8F5] border border-[#333333] rounded-tl-none'
                          }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl rounded-tl-none px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[#C9A962] rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-[#C9A962] rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-[#C9A962] rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {flow === 'none' && !isTyping && (
                    <div className="p-4 grid grid-cols-2 gap-2 bg-[#0F0F0F] border-t border-[#333333]">
                      <button onClick={() => handleStartFlow('alquilar')} className="p-2 text-[10px] sm:text-xs bg-[#1A1A1A] border border-[#C9A962]/20 rounded-xl text-[#FAF8F5] hover:border-[#C9A962] transition-all flex flex-col items-center gap-1">
                        <Home size={16} className="text-[#C9A962]" /> {botT('Soy Inquilino', 'I am Tenant')}
                      </button>
                      <button onClick={() => handleStartFlow('alquilar_propietario')} className="p-2 text-[10px] sm:text-xs bg-[#1A1A1A] border border-[#C9A962]/20 rounded-xl text-[#FAF8F5] hover:border-[#C9A962] transition-all flex flex-col items-center gap-1">
                        <Building2 size={16} className="text-[#C9A962]" /> {botT('Soy Propietario', 'I am Owner')}
                      </button>
                      <button onClick={() => handleStartFlow('vender')} className="p-2 text-[10px] sm:text-xs bg-[#1A1A1A] border border-[#C9A962]/20 rounded-xl text-[#FAF8F5] hover:border-[#C9A962] transition-all flex flex-col items-center gap-1">
                        <TrendingUp size={16} className="text-[#C9A962]" /> {botT('Vender', 'Sell')}
                      </button>
                      <button onClick={() => handleStartFlow('comprar')} className="p-2 text-[10px] sm:text-xs bg-[#1A1A1A] border border-[#C9A962]/20 rounded-xl text-[#FAF8F5] hover:border-[#C9A962] transition-all flex flex-col items-center gap-1">
                        <MapPin size={16} className="text-[#C9A962]" /> {botT('Comprar', 'Buy')}
                      </button>
                    </div>
                  )}

                  {flow === 'ai_chat' && (
                    <form onSubmit={handleInputSubmit} className="p-4 bg-[#0A0A0A] border-t border-[#333333] flex gap-2">
                      <input
                        name="msg"
                        autoComplete="off"
                        placeholder={botT('Escribe tu mensaje...', 'Type your message...')}
                        className="flex-1 bg-[#1A1A1A] border border-[#333333] rounded-xl px-4 py-2 text-sm text-[#FAF8F5] outline-none focus:border-[#C9A962] transition-colors"
                      />
                      <button type="submit" className="w-10 h-10 bg-[#C9A962] text-[#0A0A0A] rounded-xl flex items-center justify-center hover:bg-[#D4B673] transition-colors">
                        <Send size={18} />
                      </button>
                    </form>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && activeProperty && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="w-full sm:w-[400px] bg-[#0F0F0F] border-l border-[#C9A962]/20 flex flex-col h-full z-10 sm:relative absolute inset-0"
                    >
                      <div className="relative h-2/5 sm:h-auto sm:aspect-video overflow-hidden">
                        <img src={activeProperty.main_image} alt={activeProperty.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button onClick={() => setActiveProperty(null)} className="p-2 bg-[#0A0A0A]/80 text-[#FAF8F5] rounded-full border border-[#FAF8F5]/10 backdrop-blur-sm">
                            <X size={18} />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent">
                          <p className="text-[#C9A962] font-bold text-xl">{activeProperty.price}€</p>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
                        <h3 className="font-secondary text-[#FAF8F5] text-lg leading-tight">{activeProperty.title}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-[#888888] font-primary">
                          {activeProperty.bedrooms && <span className="flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] rounded-lg border border-[#333333]"><Home size={14} className="text-[#C9A962]" /> {activeProperty.bedrooms} hab.</span>}
                          {activeProperty.bathrooms && <span className="flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] rounded-lg border border-[#333333]"><Building2 size={14} className="text-[#C9A962]" /> {activeProperty.bathrooms} baños</span>}
                          {activeProperty.sqft && <span className="flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] rounded-lg border border-[#333333]"><TrendingUp size={14} className="text-[#C9A962]" /> {activeProperty.sqft} m²</span>}
                        </div>
                        <p className="text-sm text-[#FAF8F5]/80 font-primary leading-relaxed">{activeProperty.description}</p>
                        <a href={`/propiedades/${activeProperty.slug}`} target="_blank" rel="noreferrer" className="mt-auto flex items-center justify-center gap-2 py-3.5 bg-[#C9A962] text-[#0A0A0A] rounded-xl font-bold hover:bg-[#D4B673] transition-colors text-sm shadow-lg shadow-[#C9A962]/10">
                          Ver ficha completa <ExternalLink size={16} />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-[#C9A962] rounded-2xl flex items-center justify-center shadow-xl shadow-[#C9A962]/20 border border-[#FAF8F5]/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF8F5]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Bot className="text-[#0A0A0A] group-hover:rotate-12 transition-transform duration-300" size={32} />
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0A0A0A]"
            />
          )}
        </motion.button>
      </div>
    </>
  );
};

const ChatForm = ({ type, onSubmit }: { type: string, onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState<any>({});
  const [agreed, setAgreed] = useState(false);

  const renderFields = () => {
    switch (type) {
      case 'inquilino':
        return (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="¿Cuántas personas vivirán?" icon={<Users size={16} />} placeholder="Ej: 2 adultos y 1 niño" onChange={(v) => setFormData({ ...formData, personas: v })} />
            <FormField label="¿A qué se dedica cada una?" icon={<Briefcase size={16} />} placeholder="Ej: Ingeniero, Administrativa..." onChange={(v) => setFormData({ ...formData, ocupacion: v })} />
            <FormField label="Ingresos netos mensuales" icon={<Euro size={16} />} placeholder="Ej: 3800€ total" onChange={(v) => setFormData({ ...formData, ingresos: v })} />
            <FormField label="Antigüedad laboral" icon={<Calendar size={16} />} placeholder="Ej: 3 años" onChange={(v) => setFormData({ ...formData, antiguedad: v })} />
            <FormField label="Fecha entrada" icon={<Calendar size={16} />} type="date" onChange={(v) => setFormData({ ...formData, fecha_disponibilidad: v })} />
          </div>
        );
      case 'propietario_alquiler':
      case 'propietario_venta':
        return (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="Dirección completa" icon={<MapPin size={16} />} placeholder="Calle, número, ciudad..." onChange={(v) => setFormData({ ...formData, direccion: v })} />
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Hab." placeholder="0" type="number" onChange={(v) => setFormData({ ...formData, habitaciones: v })} />
              <FormField label="Baños" placeholder="0" type="number" onChange={(v) => setFormData({ ...formData, banos: v })} />
            </div>
            <FormField label="Precio" icon={<Euro size={16} />} type="number" placeholder="€" onChange={(v) => setFormData({ ...formData, precio: v })} />
          </div>
        );
      case 'comprador':
        return (
          <div className="grid grid-cols-1 gap-3">
            <FormField label="Presupuesto máximo" icon={<Euro size={16} />} type="number" placeholder="€" onChange={(v) => setFormData({ ...formData, precio_max: v })} />
            <FormField label="Zona preferida" icon={<MapPin size={16} />} placeholder="Ej: El Limonar..." onChange={(v) => setFormData({ ...formData, zona: v })} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-2">
      {renderFields()}
      <div className="flex items-start gap-2 p-3 bg-[#C9A962]/10 border border-[#C9A962]/20 rounded-xl">
        <input type="checkbox" id="privacy" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
        <label htmlFor="privacy" className="text-[10px] text-[#FAF8F5] leading-relaxed">
          Acepto la <a href="/privacidad" target="_blank" className="text-[#C9A962] underline">política de privacidad</a>.
        </label>
      </div>
      <button
        disabled={!agreed}
        onClick={() => onSubmit(formData)}
        className="w-full py-3 bg-[#C9A962] text-[#0A0A0A] rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#D4B673] transition-all"
      >
        <ShieldCheck size={18} /> Enviar información
      </button>
    </div>
  );
};

const FormField = ({ label, icon, placeholder, type = 'text', onChange }: { label: string, icon?: React.ReactNode, placeholder?: string, type?: string, onChange: (v: string) => void }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] text-[#888888] uppercase tracking-wider pl-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A962]">{icon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#0A0A0A] border border-[#333333] rounded-xl py-2.5 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none ${icon ? 'pl-10' : 'pl-4'} pr-4`}
      />
    </div>
  </div>
);

export default Gelabot;
