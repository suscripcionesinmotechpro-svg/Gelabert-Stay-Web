import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Home, Building2, TrendingUp, User, MapPin, Euro, Users, Briefcase, Calendar, ShieldCheck, ExternalLink, Maximize2 } from 'lucide-react';
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

export const Gelabot = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [userLang] = useState<'es'|'en'|null>(null);
  const lang = userLang || (i18n.language?.startsWith('en') ? 'en' : 'es');

  const botT = (es: string | React.ReactNode, en: string | React.ReactNode) => lang === 'en' ? en : es;

  const [messages, setMessages] = useState<{role: 'bot'|'user', content: React.ReactNode, isForm?: boolean}[]>([
    { role: 'bot', content: botT('Hola soy GelaBot el agente Virtual de Gelabert Homes Real Estate, ¿qué estás buscando?', 'Hi, I am GelaBot, the Virtual Agent of Gelabert Homes Real Estate, what are you looking for?') }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [flow, setFlow] = useState<'none'|'ai_chat'>('none');
  const [activeProperty, setActiveProperty] = useState<PropertyDetails | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const addMessage = (role: 'bot'|'user', content: React.ReactNode, delay = 0, isForm = false) => {
    if (delay > 0) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { role, content, isForm }]);
      }, delay);
    } else {
      setMessages(prev => [...prev, { role, content, isForm }]);
    }
  };

  const handleStartFlow = async (type: 'alquilar'|'alquilar_propietario'|'vender'|'comprar') => {
    setFlow('ai_chat');
    const startMsg = type === 'alquilar' ? 'soy inquilinos y busco alquiler' : 
      type === 'alquilar_propietario' ? 'soy propietario y ofrezco alquiler' : 
      type === 'vender' ? 'vender' : 'comprar';
    
    const latestUserMsg = { role: 'user' as const, content: startMsg };
    addMessage('user', startMsg);
    
    const filteredHistory = messages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : m.role,
      content: typeof m.content === 'string' ? m.content : '[Formulario interactivo mostrado]'
    }));
    
    processAIResponse([...filteredHistory, latestUserMsg]);
  };

  const processAIResponse = async (chatMessages: any[]) => {
    setIsTyping(true);
    try {
      // Simplificar mensajes para la función (solo texto)
      const apiMessages = chatMessages.map(m => ({
        role: m.role === 'bot' ? 'assistant' : m.role,
        content: typeof m.content === 'string' ? m.content : '[Mensaje de sistema/UI]'
      }));

      const { data, error } = await supabase.functions.invoke('gelabot-chat', {
        body: { messages: apiMessages }
      });
      if (error) throw error;
      
      setIsTyping(false);
      
      // Manejar comandos especiales como [SHOW_FORM:xxx]
      let reply = data.reply;
      if (reply.includes('[SHOW_FORM:')) {
        const formType = reply.match(/\[SHOW_FORM:([^\]]+)\]/)?.[1];
        const cleanReply = reply.replace(/\[SHOW_FORM:[^\]]+\]/g, '').trim();
        if (cleanReply) addMessage('bot', cleanReply);
        
        if (formType) {
          addMessage('bot', <ChatForm type={formType} onSubmit={(formData) => handleFormSubmit(formType, formData)} />, 500, true);
        }
      } else {
        // Detectar enlaces de propiedades
        const propertyRegex = /Propiedad \d+: .* - (https:\/\/gelaberthomes\.com\/propiedades\/([^\s\n]+))/g;
        const matches = [...reply.matchAll(propertyRegex)];
        
        if (matches.length > 0) {
          addMessage('bot', reply);
          // Opcionalmente, si solo hay una, podríamos abrirla automáticamente, 
          // pero el usuario dice "cuando pinchen en el enlace".
        } else {
          addMessage('bot', reply);
        }
      }
    } catch (err) {
      setIsTyping(false);
      addMessage('bot', botT('Ha ocurrido un error de conexión.', 'A connection error occurred.'));
    }
  };

  const handleFormSubmit = async (type: string, formData: any) => {
    const content = `He completado el formulario de ${type} con los siguientes datos: ${JSON.stringify(formData)}`;
    const latestUserMsg = { role: 'user' as const, content };
    addMessage('user', botT('He completado el formulario.', 'I have completed the form.'));
    
    const filteredHistory = messages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : m.role,
      content: typeof m.content === 'string' ? m.content : '[Formulario interactivo mostrado]'
    }));
    
    processAIResponse([...filteredHistory, latestUserMsg]);
  };

  const handleInputSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('msg') as HTMLInputElement).value.trim();
    if (!input) return;
    
    const latestUserMsg = { role: 'user' as const, content: input };
    addMessage('user', input);
    form.reset();

    const filteredHistory = messages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : m.role,
      content: typeof m.content === 'string' ? m.content : '[Formulario interactivo mostrado]'
    }));
    
    processAIResponse([...filteredHistory, latestUserMsg]);
  };

  // Interceptar clicks en enlaces de propiedades para el panel lateral
  useEffect(() => {
    const handleLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.includes('/propiedades/')) {
        e.preventDefault();
        const slug = target.getAttribute('href')?.split('/').pop();
        if (slug) {
          const { data } = await supabase.from('properties').select('*').eq('slug', slug).single();
          if (data) {
            setActiveProperty(data);
          }
        }
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            drag
            dragConstraints={{ left: 0, right: window.innerWidth - 80, top: 0, bottom: window.innerHeight - 80 }}
            dragMomentum={false}
            className="fixed bottom-6 left-6 z-[9999] flex items-center gap-4 cursor-grab active:cursor-grabbing pointer-events-auto"
          >
            <div className="relative group">
              <button
                onClick={() => setIsOpen(true)}
                className="w-16 h-16 bg-[#C9A962] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(201,169,98,0.5)] hover:scale-110 transition-transform relative z-10 animate-[bounce_2s_infinite]"
              >
                <Bot size={32} className="text-[#0A0A0A]" />
              </button>
              
              {/* Bubble message */}
              <div 
                onClick={() => setIsOpen(true)}
                className="absolute left-20 top-1/2 -translate-y-1/2 bg-[#0A0A0A] border border-[#C9A962]/50 text-[#FAF8F5] px-5 py-3 rounded-2xl text-sm whitespace-nowrap shadow-2xl cursor-pointer hover:bg-[#1A1A1A] transition-colors flex items-center gap-2"
              >
                <span className="font-secondary">{botT('¿En qué puedo ayudarte? 🏡', 'How can I help you? 🏡')}</span>
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-[#0A0A0A] border-l border-b border-[#C9A962]/50 rotate-45" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center md:items-end md:justify-start md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 pointer-events-none w-full max-w-[1200px]">
              {/* Chat Window */}
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="w-[95%] max-w-[380px] h-[600px] max-h-[80vh] bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto relative"
              >
              {/* Header */}
              <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#333333]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C9A962] rounded-full flex items-center justify-center text-[#0A0A0A]"><Bot size={20} /></div>
                  <div><h3 className="font-secondary text-[#FAF8F5]">GelaBot</h3><p className="text-[10px] text-[#C9A962] flex items-center gap-1 uppercase tracking-wider"><span className="w-1.5 h-1.5 bg-[#C9A962] rounded-full animate-pulse" /> En línea</p></div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[#888888] hover:text-[#FAF8F5] transition-colors"><X size={20} /></button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-[#0F0F0F] flex flex-col gap-4 custom-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mr-2 flex-shrink-0 mt-1"><Bot size={14} className="text-[#C9A962]" /></div>
                    )}
                    <div className={`max-w-[90%] p-3 rounded-2xl text-sm font-primary ${
                      msg.role === 'user' ? 'bg-[#C9A962] text-[#0A0A0A] rounded-tr-sm' : 'bg-[#1A1A1A] border border-[#333333] text-[#FAF8F5] rounded-tl-sm'
                    } ${msg.isForm ? 'w-full max-w-full' : ''}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mr-2 flex-shrink-0 mt-1"><Bot size={14} className="text-[#C9A962]" /></div>
                    <div className="bg-[#1A1A1A] border border-[#333333] p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                {flow === 'none' && !isTyping && (
                  <div className="flex flex-col gap-2 mt-4 w-full">
                    {[
                      { id: 'alquilar', label: 'Soy inquilinos y busco alquiler', icon: <Home size={18} /> },
                      { id: 'alquilar_propietario', label: 'Soy propietario y ofrezco alquiler', icon: <Building2 size={18} /> },
                      { id: 'vender', label: 'Vender', icon: <TrendingUp size={18} /> },
                      { id: 'comprar', label: 'Comprar', icon: <Building2 size={18} /> }
                    ].map(opt => (
                      <button key={opt.id} onClick={() => handleStartFlow(opt.id as any)} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-xl transition-all text-left group">
                        <div className="p-2 bg-[#0A0A0A] rounded-lg text-[#C9A962]">{opt.icon}</div>
                        <p className="font-primary text-sm text-[#FAF8F5]">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[#1A1A1A] border-t border-[#333333]">
                <form onSubmit={handleInputSubmit} className="flex items-center gap-2 relative">
                  <input name="msg" type="text" placeholder="Escribe aquí..." disabled={flow === 'none' || isTyping} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-full py-2.5 pl-4 pr-10 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none disabled:opacity-50" autoComplete="off" />
                  <button type="submit" disabled={flow === 'none' || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#C9A962] text-[#0A0A0A] rounded-full disabled:opacity-50 hover:bg-[#D4B673] transition-colors">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Floating Property Window */}
            <AnimatePresence>
              {activeProperty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 20 }}
                  className={`bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-all z-50 ${
                    isExpanded 
                      ? 'fixed inset-4 md:relative md:inset-auto md:w-[600px] md:h-[600px]' 
                      : 'w-[90%] md:w-[320px] h-[480px]'
                  }`}
                >
                  <div className="relative h-2/5 bg-gray-900">
                    <img src={activeProperty.main_image} alt={activeProperty.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="p-2 bg-[#0A0A0A]/80 text-white rounded-xl backdrop-blur-md hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors"
                      >
                        <Maximize2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setActiveProperty(null); setIsExpanded(false); }} 
                        className="p-2 bg-[#0A0A0A]/80 text-white rounded-xl backdrop-blur-md hover:bg-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent">
                      <p className="text-[#C9A962] font-bold text-xl">{activeProperty.price}€</p>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-4 overflow-y-auto h-3/5 custom-scrollbar">
                    <h3 className="font-secondary text-[#FAF8F5] text-lg leading-tight">{activeProperty.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-[#888888] font-primary">
                      {activeProperty.bedrooms && <span className="flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] rounded-lg border border-[#333333]"><Home size={14} className="text-[#C9A962]" /> {activeProperty.bedrooms} hab.</span>}
                      {activeProperty.bathrooms && <span className="flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] rounded-lg border border-[#333333]"><Building2 size={14} className="text-[#C9A962]" /> {activeProperty.bathrooms} baños</span>}
                      {activeProperty.sqft && <span className="flex items-center gap-1.5 p-1.5 bg-[#1A1A1A] rounded-lg border border-[#333333]"><TrendingUp size={14} className="text-[#C9A962]" /> {activeProperty.sqft} m²</span>}
                    </div>
                    <p className="text-sm text-[#FAF8F5]/80 font-primary line-clamp-4 leading-relaxed">{activeProperty.description}</p>
                    <a href={`/propiedades/${activeProperty.slug}`} target="_blank" rel="noreferrer" className="mt-auto flex items-center justify-center gap-2 py-3.5 bg-[#C9A962] text-[#0A0A0A] rounded-xl font-bold hover:bg-[#D4B673] transition-colors text-sm shadow-lg shadow-[#C9A962]/10">
                      Ver ficha completa <ExternalLink size={16} />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gelabot;

const ChatForm = ({ type, onSubmit }: { type: string, onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState<any>({});
  const [agreed, setAgreed] = useState(false);

  const renderFields = () => {
    switch (type) {
      case 'inquilino':
        return (
          <>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="¿Cuántas personas vivirán?" icon={<Users size={16}/>} placeholder="Ej: 2 adultos y 1 niño" onChange={(v) => setFormData({...formData, personas: v})} />
              <FormField label="¿A qué se dedica cada una?" icon={<Briefcase size={16}/>} placeholder="Ej: Ingeniero, Administrativa..." onChange={(v) => setFormData({...formData, ocupacion: v})} />
              <FormField label="Ingresos netos mensuales (por separado)" icon={<Euro size={16}/>} placeholder="Ej: 2000€ y 1800€" onChange={(v) => setFormData({...formData, ingresos: v})} />
              <FormField label="Antigüedad en la empresa" icon={<Calendar size={16}/>} placeholder="Ej: 3 años y 5 meses" onChange={(v) => setFormData({...formData, antiguedad: v})} />
              <FormField label="Edades y procedencia" icon={<User size={16}/>} placeholder="Ej: 30 y 32 años, de Madrid" onChange={(v) => setFormData({...formData, edades_procedencia: v})} />
              <FormField label="Fecha de entrada deseada" icon={<Calendar size={16}/>} type="date" onChange={(v) => setFormData({...formData, fecha_disponibilidad: v})} />
            </div>
          </>
        );
      case 'propietario_alquiler':
      case 'propietario_venta':
        return (
          <>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="Dirección completa" icon={<MapPin size={16}/>} placeholder="Calle, número, ciudad..." onChange={(v) => setFormData({...formData, direccion: v})} />
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Habitaciones" placeholder="0" type="number" onChange={(v) => setFormData({...formData, habitaciones: v})} />
                <FormField label="Baños" placeholder="0" type="number" onChange={(v) => setFormData({...formData, banos: v})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Metros cuadrados" placeholder="m²" type="number" onChange={(v) => setFormData({...formData, m2: v})} />
                <FormField label="Planta" placeholder="Ej: 3º Izq" onChange={(v) => setFormData({...formData, planta: v})} />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#FAF8F5] p-2 bg-[#0A0A0A] rounded-lg border border-[#333333]">
                <input type="checkbox" id="parking" onChange={(e) => setFormData({...formData, parking: e.target.checked})} />
                <label htmlFor="parking">Dispone de parking</label>
              </div>
              <FormField label="Precio deseado" icon={<Euro size={16}/>} type="number" placeholder="€" onChange={(v) => setFormData({...formData, precio: v})} />
              <FormField label="Características adicionales" placeholder="Aire, terraza, calefacción..." onChange={(v) => setFormData({...formData, adicionales: v})} />
              <FormField label="Fecha disponibilidad" icon={<Calendar size={16}/>} type="date" onChange={(v) => setFormData({...formData, fecha_disponibilidad: v})} />
            </div>
          </>
        );
      case 'comprador':
        return (
          <>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="Precio máximo de compra" icon={<Euro size={16}/>} type="number" placeholder="€" onChange={(v) => setFormData({...formData, precio_max: v})} />
              <FormField label="Preferencia de zona" icon={<MapPin size={16}/>} placeholder="Ej: El Limonar, Malagueta..." onChange={(v) => setFormData({...formData, zona: v})} />
              <FormField label="Fecha aproximada de compra" icon={<Calendar size={16}/>} type="date" onChange={(v) => setFormData({...formData, fecha_compra: v})} />
              <div className="flex flex-col gap-2 p-2 bg-[#0A0A0A] rounded-lg border border-[#333333]">
                <p className="text-[10px] text-[#888888] uppercase">Financiación</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-[#FAF8F5] cursor-pointer">
                    <input type="radio" name="hipoteca" value="concedida" onChange={(e) => setFormData({...formData, hipoteca: e.target.value})} /> Concedida
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#FAF8F5] cursor-pointer">
                    <input type="radio" name="hipoteca" value="necesito" onChange={(e) => setFormData({...formData, hipoteca: e.target.value})} /> Necesito broker
                  </label>
                </div>
              </div>
            </div>
          </>
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
          Acepto la <a href="/privacidad" target="_blank" className="text-[#C9A962] underline">política de privacidad</a> y permito que un agente me contacte para gestionar mi solicitud.
        </label>
      </div>
      <button 
        disabled={!agreed} 
        onClick={() => onSubmit(formData)}
        className="w-full py-3 bg-[#C9A962] text-[#0A0A0A] rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-[#D4B673]"
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

