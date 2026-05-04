import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Bot, X, Send, Home, Building2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export const Gelabot = () => {
  const { i18n } = useTranslation();
  const dragControls = useDragControls();
  const [isOpen, setIsOpen] = useState(false);
  const [userLang, setUserLang] = useState<'es'|'en'|null>(null);
  const lang = userLang || (i18n.language?.startsWith('en') ? 'en' : 'es');

  const botT = (es: string | React.ReactNode, en: string | React.ReactNode) => lang === 'en' ? en : es;

  const [messages, setMessages] = useState<{role: 'bot'|'user', content: React.ReactNode}[]>([
    { role: 'bot', content: botT('¡Hola! Soy GelaBot, el agente virtual de Gelabert Homes Real Estate. ¿Qué estás buscando hoy?', 'Hi! I am GelaBot, the virtual agent for Gelabert Homes Real Estate. What are you looking for today?') }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Flows
  const [flow, setFlow] = useState<'none'|'ai_chat'>('none');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const addMessage = (role: 'bot'|'user', content: React.ReactNode, delay = 0) => {
    if (delay > 0) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { role, content }]);
      }, delay);
    } else {
      setMessages(prev => [...prev, { role, content }]);
    }
  };

  const handleStartFlow = async (type: 'alquilar'|'alquilar_propietario'|'comprar'|'vender') => {
    setFlow('ai_chat');
    const startMsg = type === 'alquilar' ? botT('Busco alquilar', 'I am looking to rent') : 
      type === 'alquilar_propietario' ? botT('Ofrezco mi propiedad en alquiler', 'I want to rent out my property') : 
      type === 'comprar' ? botT('Busco comprar', 'I am looking to buy') : 
      botT('Quiero vender mi propiedad', 'I want to sell my property');
    
    addMessage('user', startMsg);
    
    const newMessages = [...messages, { role: 'user', content: startMsg }];
    
    setIsTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke('gelabot-chat', {
        body: { messages: newMessages }
      });
      if (error) throw error;
      setIsTyping(false);
      addMessage('bot', data.reply);
    } catch (err) {
      setIsTyping(false);
      addMessage('bot', botT('Ha ocurrido un error al conectar con mi servidor. Por favor, intenta de nuevo.', 'An error occurred connecting to my server. Please try again.'));
    }
  };

  const handleInputSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('msg') as HTMLInputElement).value.trim();
    if (!input) return;
    
    // Auto-detect English on first input
    if (!userLang && /hello|hi|how|rent|buy|sell|property|house|apartment|yes|no|thanks/i.test(input)) {
      setUserLang('en');
    } else if (!userLang) {
      setUserLang('es');
    }

    addMessage('user', input);
    form.reset();

    const newMessages = [...messages, { role: 'user', content: input }];
    setIsTyping(true);

    try {
      console.log('Invocando GelaBot...', { messages: newMessages });
      
      const { data, error } = await supabase.functions.invoke('gelabot-chat', {
        body: { messages: newMessages },
      });

      if (error) {
        console.error('Error al invocar GelaBot:', error);
        throw error;
      }

      console.log('Respuesta de GelaBot recibida:', data);

      setIsTyping(false);
      addMessage('bot', data.reply);

      if (data.properties && data.properties.length > 0) {
        const resultsNode = (
          <div className="flex gap-3 overflow-x-auto pb-2 mt-3 custom-scrollbar w-full" style={{ scrollSnapType: 'x mandatory' }}>
            {data.properties.map((p: any) => (
              <div key={p.id} className="min-w-[220px] max-w-[220px] bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                <div className="h-28 bg-gray-800 relative">
                  {p.main_image && <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-2.5">
                  <h4 className="font-secondary text-xs text-[#FAF8F5] truncate mb-1">{p.title}</h4>
                  <p className="text-sm text-[#C9A962] font-semibold">{p.price}€</p>
                  <a href={`/propiedades/${p.slug}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center py-1.5 border border-[#C9A962] text-[#C9A962] hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors rounded text-[10px] uppercase font-bold w-full">Ver Detalles</a>
                </div>
              </div>
            ))}
          </div>
        );
        addMessage('bot', resultsNode);
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      addMessage('bot', botT('Lo siento, ha habido un error procesando tu mensaje. ¿Puedes repetirlo?', 'Sorry, there was an error processing your message. Could you repeat it?'));
    }
  };

  const renderInitialOptions = () => (
    <div className="flex flex-col gap-2 mt-4 w-[85%]">
      <button onClick={() => handleStartFlow('alquilar')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><Home size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">{botT('Busco Alquiler', 'Looking to Rent')}</p><p className="text-xs text-[#888888]">{botT('Soy inquilino, busco vivienda', 'I am a tenant, looking for a home')}</p></div>
      </button>
      <button onClick={() => handleStartFlow('alquilar_propietario')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><Building2 size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">{botT('Ofrezco Alquiler', 'Offering to Rent')}</p><p className="text-xs text-[#888888]">{botT('Soy propietario, quiero alquilar', 'I am a landlord, looking to rent out')}</p></div>
      </button>
      <button onClick={() => handleStartFlow('comprar')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><Building2 size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">{botT('Quiero Comprar', 'Looking to Buy')}</p><p className="text-xs text-[#888888]">{botT('Busco inversión o vivienda', 'Looking for investment or home')}</p></div>
      </button>
      <button onClick={() => handleStartFlow('vender')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><TrendingUp size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">{botT('Quiero Vender', 'Looking to Sell')}</p><p className="text-xs text-[#888888]">{botT('Valora tu inmueble con nosotros', 'Value your property with us')}</p></div>
      </button>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            drag
            dragMomentum={false}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-4 cursor-grab active:cursor-grabbing"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 bg-[#C9A962] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(201,169,98,0.4)] hover:scale-110 transition-transform animate-bounce relative z-10"
            >
              <Bot size={28} className="text-[#0A0A0A]" />
            </button>
            <div 
              onClick={() => setIsOpen(true)}
              className="bg-[#0A0A0A] border border-[#C9A962]/50 text-[#FAF8F5] px-5 py-3 rounded-2xl text-sm whitespace-nowrap shadow-xl cursor-pointer hover:bg-[#1A1A1A] transition-colors relative hidden md:block"
            >
              {botT('¿En qué puedo ayudarte? 🏡', 'How can I help you? 🏡')}
              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-[#0A0A0A] border-l border-b border-[#C9A962]/50 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed bottom-6 left-6 z-50 w-[360px] h-[540px] max-h-[85vh] bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div 
              className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#333333] cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C9A962] rounded-full flex items-center justify-center text-[#0A0A0A]">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-secondary text-[#FAF8F5]">GelaBot</h3>
                  <p className="text-[10px] text-[#C9A962] flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-[#C9A962] rounded-full animate-pulse" /> En línea
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#888888] hover:text-[#FAF8F5] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-[#0F0F0F] flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot size={14} className="text-[#C9A962]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-primary ${
                    msg.role === 'user' 
                      ? 'bg-[#C9A962] text-[#0A0A0A] rounded-tr-sm' 
                      : 'bg-[#1A1A1A] border border-[#333333] text-[#FAF8F5] rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot size={14} className="text-[#C9A962]" />
                  </div>
                  <div className="bg-[#1A1A1A] border border-[#333333] p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {flow === 'none' && !isTyping && renderInitialOptions()}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-[#1A1A1A] border-t border-[#333333]">
              <form onSubmit={handleInputSubmit} className="flex items-center gap-2 relative">
                <input
                  name="msg"
                  type="text"
                  placeholder="Escribe aquí..."
                  disabled={flow === 'none' || isTyping}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-full py-2.5 pl-4 pr-10 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none disabled:opacity-50"
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  disabled={flow === 'none' || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#C9A962] text-[#0A0A0A] rounded-full disabled:opacity-50 hover:bg-[#D4B673] transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
