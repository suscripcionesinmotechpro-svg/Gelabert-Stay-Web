import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, MapPin, Bed, Home, Building2, TrendingUp } from 'lucide-react';
import { searchPropertiesForBot, saveLeadFromBot, PropertySearchParams, ScoredProperty } from '../hooks/useLeadsCRM';

export const Gelabot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot'|'user', content: React.ReactNode}[]>([
    { role: 'bot', content: '¡Hola! Soy Gela, tu asistente inteligente inmobiliario. Estoy aquí para ayudarte a encontrar exactamente lo que buscas o a valorar tu propiedad actual. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Flows
  const [flow, setFlow] = useState<'none'|'alquilar'|'alquilar_propietario'|'comprar'|'vender'|'alquilar_form'|'comprar_form'|'vender_form'|'success'>('none');
  const [step, setStep] = useState(0);
  
  // Data Collection
  const [searchParams, setSearchParams] = useState<Partial<PropertySearchParams>>({});
  const [leadData, setLeadData] = useState<any>({});
  const [results, setResults] = useState<ScoredProperty[]>([]);
  
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

  const handleStartFlow = (type: 'alquilar'|'alquilar_propietario'|'comprar'|'vender') => {
    setFlow(type);
    setStep(0);
    setSearchParams({ operation: type === 'alquilar_propietario' ? 'alquilar' : type });
    addMessage('user', type === 'alquilar' ? 'Busco alquilar' : type === 'alquilar_propietario' ? 'Ofrezco mi propiedad en alquiler' : type === 'comprar' ? 'Busco comprar' : 'Quiero vender mi propiedad');
    addMessage('bot', 'Excelente. Para poder dirigirme a ti correctamente y guardar tu registro, ¿cómo te llamas completo?', 1000);
  };

  const handleInputSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = (form.elements.namedItem('msg') as HTMLInputElement).value.trim();
    if (!input) return;
    
    addMessage('user', input);
    form.reset();

    // ─── ALQUILAR FLOW ───
    if (flow === 'alquilar') {
      if (step === 0) {
        setLeadData(prev => ({ ...prev, name: input }));
        addMessage('bot', `Encantada, ${input}. ¿En qué zona de Málaga Capital o la Costa del Sol estás buscando alquilar?`, 800);
        setStep(1);
      } else if (step === 1) {
        setSearchParams(prev => ({ ...prev, zones: [input] }));
        addMessage('bot', 'Genial. ¿Cuál es tu presupuesto máximo mensual para el alquiler?', 800);
        setStep(2);
      } else if (step === 2) {
        setSearchParams(prev => ({ ...prev, max_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', 'Anotado. ¿Cuántas habitaciones y baños necesitas como mínimo?', 800);
        setStep(3);
      } else if (step === 3) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setSearchParams(prev => ({ ...prev, min_bedrooms: beds }));
        addMessage('bot', '¿Buscas alguna característica especial? (Ej: terraza, ascensor, piscina, admite mascotas...)', 800);
        setStep(4);
      } else if (step === 4) {
        const txt = input.toLowerCase();
        const updatedParams = { ...searchParams };
        if (txt.includes('terraza')) updatedParams.wants_terrace = true;
        if (txt.includes('ascensor')) updatedParams.wants_elevator = true;
        if (txt.includes('piscina')) updatedParams.wants_pool = true;
        if (txt.includes('mascota') || txt.includes('perro') || txt.includes('gato')) updatedParams.pets_needed = true;
        setSearchParams(updatedParams);
        
        addMessage('bot', '¡Perfecto! Dame un segundo, voy a analizar nuestra base de datos...', 800);
        
        setIsTyping(true);
        setTimeout(async () => {
          const res = await searchPropertiesForBot(updatedParams as PropertySearchParams);
          setIsTyping(false);
          
          const hasMatches = res && res.length > 0;
          if (hasMatches) setResults(res);

          setFlow('alquilar_form');
          setStep(0);
          
          if (hasMatches) {
            const resultsNode = (
              <div className="flex gap-3 overflow-x-auto pb-2 mt-3 custom-scrollbar w-full" style={{ scrollSnapType: 'x mandatory' }}>
                {res.map(p => (
                  <div key={p.id} className="min-w-[220px] max-w-[220px] bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                    <div className="h-28 bg-gray-800 relative">
                      {p.main_image && <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 bg-[#C9A962] text-[#0A0A0A] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {p.score}% Match
                      </div>
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
            addMessage('bot', (
              <div>
                <p>¡He encontrado {res.length} propiedades con más de un 70% de coincidencia!</p>
                {resultsNode}
                <p className="mt-3">Para poder agendar las visitas y pasar tu perfil financiero al propietario, necesitamos unos datos más. ¿Qué edad tienes?</p>
              </div>
            ));
          } else {
            addMessage('bot', 'Actualmente no tenemos ninguna propiedad exacta al 100%. Sin embargo, para avisarte en cuanto entre algo ideal y evaluar tu perfil financiero, necesitamos unos datos más. ¿Qué edad tienes?');
          }
        }, 2000);
      }
    }
    // ─── FORM FLOW: ALQUILAR ───
    else if (flow === 'alquilar_form') {
      if (step === 0) {
        setLeadData(prev => ({ ...prev, age: parseInt(input) || undefined }));
        addMessage('bot', '¿De dónde eres (ciudad o nacionalidad)?', 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData(prev => ({ ...prev, nationality: input }));
        addMessage('bot', '¿A qué te dedicas profesionalmente?', 800);
        setStep(2);
      } else if (step === 2) {
        setLeadData(prev => ({ ...prev, occupation: input }));
        addMessage('bot', 'Para el estudio de solvencia, ¿cuáles son tus ingresos mensuales netos aproximados?', 800);
        setStep(3);
      } else if (step === 3) {
        setLeadData(prev => ({ ...prev, monthly_income: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', '¿Qué antigüedad tienes en tu empresa actual?', 800);
        setStep(4);
      } else if (step === 4) {
        setLeadData(prev => ({ ...prev, employment_seniority: input }));
        addMessage('bot', 'Ya casi estamos. ¿Cuál es tu correo electrónico para enviarte la información?', 800);
        setStep(5);
      } else if (step === 5) {
        setLeadData(prev => ({ ...prev, email: input }));
        addMessage('bot', '¿Hay algún detalle adicional o comentario que quieras dejar anotado en tu perfil antes de finalizar?', 800);
        setStep(6);
      } else if (step === 6) {
        setLeadData(prev => ({ ...prev, agent_notes: (prev.agent_notes ? prev.agent_notes + ' | ' : '') + `Comentarios: ${input}` }));
        addMessage('bot', 'Y por último, ¿cuál es tu número de teléfono?', 800);
        setStep(7);
      } else if (step === 7) {
        const finalStatus = results.length > 0 ? 'cualificado' : 'nuevo';
        setIsTyping(true);
        await saveLeadFromBot({ ...leadData, phone: input, intent: 'alquilar', status: finalStatus }, searchParams as any);
        setIsTyping(false);
        setFlow('success');
        
        if (results.length > 0) {
          addMessage('bot', '¡Tu perfil está completado y cualificado! 🚀 Un asesor te contactará enseguida para organizar las visitas.');
        } else {
          addMessage('bot', '¡Tu perfil ha sido guardado con éxito! 🚀 Estás en nuestra lista de prioridad para próximas captaciones.');
        }
      }
    }

    // ─── COMPRAR FLOW ───
    else if (flow === 'comprar') {
      if (step === 0) {
        setLeadData(prev => ({ ...prev, name: input }));
        addMessage('bot', `Encantada, ${input}. ¿En qué zona de Málaga Capital o la Costa del Sol estás buscando comprar?`, 800);
        setStep(1);
      } else if (step === 1) {
        setSearchParams(prev => ({ ...prev, zones: [input] }));
        addMessage('bot', 'Genial. ¿Cuál es tu presupuesto máximo estimado?', 800);
        setStep(2);
      } else if (step === 2) {
        setSearchParams(prev => ({ ...prev, max_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', 'Anotado. ¿Cuántas habitaciones y baños necesitas como mínimo?', 800);
        setStep(3);
      } else if (step === 3) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setSearchParams(prev => ({ ...prev, min_bedrooms: beds }));
        addMessage('bot', '¿Buscas alguna característica especial? (Ej: terraza, ascensor, piscina, jardín...)', 800);
        setStep(4);
      } else if (step === 4) {
        const txt = input.toLowerCase();
        const updatedParams = { ...searchParams };
        if (txt.includes('terraza')) updatedParams.wants_terrace = true;
        if (txt.includes('ascensor')) updatedParams.wants_elevator = true;
        if (txt.includes('piscina')) updatedParams.wants_pool = true;
        if (txt.includes('jardin') || txt.includes('jardín')) updatedParams.wants_garden = true;
        setSearchParams(updatedParams);
        
        addMessage('bot', 'Para ayudarte mejor con la viabilidad: ¿Ya tienes una hipoteca aprobada o cuentas con los fondos necesarios? (Sí/No)', 800);
        setStep(5);
      } else if (step === 5) {
        const txt = input.toLowerCase();
        const hasMortgage = txt.includes('si') || txt.includes('sí') || txt.includes('aprobada') || txt.includes('fondos');
        setLeadData(prev => ({ ...prev, mortgage_approved: hasMortgage, agent_notes: `Hipoteca/Fondos: ${input}` }));
        
        addMessage('bot', 'En Gelabert Homes contamos con un servicio exclusivo de bróker hipotecario para conseguirte las mejores condiciones. ¿Te gustaría que te ofrezcamos este servicio gratuito de estudio? (Sí/No)', 800);
        setStep(6);
      } else if (step === 6) {
        const txt = input.toLowerCase();
        const wantsMortgageService = txt.includes('si') || txt.includes('sí') || txt.includes('quiero') || txt.includes('vale');
        setLeadData(prev => ({ ...prev, needs_mortgage_service: wantsMortgageService }));
        
        addMessage('bot', 'Perfecto. ¿Para qué fecha límite o plazo aproximado te gustaría tener comprada la propiedad?', 800);
        setStep(7);
      } else if (step === 7) {
        setLeadData(prev => ({ ...prev, buy_deadline: input }));
        
        addMessage('bot', '¡Gracias por todos los detalles! Dame un segundo, voy a analizar nuestro portfolio de ventas...', 800);
        
        setIsTyping(true);
        setTimeout(async () => {
          const res = await searchPropertiesForBot(searchParams as PropertySearchParams);
          setIsTyping(false);
          
          const hasMatches = res && res.length > 0;
          if (hasMatches) setResults(res);

          setFlow('comprar_form');
          setStep(0);
          
          if (hasMatches) {
            const resultsNode = (
              <div className="flex gap-3 overflow-x-auto pb-2 mt-3 custom-scrollbar w-full" style={{ scrollSnapType: 'x mandatory' }}>
                {res.map(p => (
                  <div key={p.id} className="min-w-[220px] max-w-[220px] bg-[#1A1A1A] border border-[#333333] rounded-lg overflow-hidden flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                    <div className="h-28 bg-gray-800 relative">
                      {p.main_image && <img src={p.main_image} alt={p.title} className="w-full h-full object-cover" />}
                      <div className="absolute top-2 right-2 bg-[#C9A962] text-[#0A0A0A] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {p.score}% Match
                      </div>
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
            addMessage('bot', (
              <div>
                <p>¡He encontrado {res.length} opciones fantásticas!</p>
                {resultsNode}
                <p className="mt-3">Para poder enviarte los dosieres y organizar visitas, ¿cuál es tu correo electrónico?</p>
              </div>
            ));
          } else {
            addMessage('bot', 'Actualmente no dispongo de una propiedad 100% exacta. Sin embargo, para pasarte opciones "Off-Market" y avisarte de nuevas exclusivas, ¿cuál es tu correo electrónico?');
          }
        }, 2000);
      }
    }
    // ─── FORM FLOW: COMPRAR ───
    else if (flow === 'comprar_form') {
      if (step === 0) {
        setLeadData(prev => ({ ...prev, email: input }));
        addMessage('bot', '¿Hay algún detalle adicional o comentario que quieras dejar anotado en tu perfil antes de finalizar?', 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData(prev => ({ ...prev, agent_notes: (prev.agent_notes ? prev.agent_notes + ' | ' : '') + `Comentarios: ${input}` }));
        addMessage('bot', 'Y por último, ¿cuál es tu número de teléfono?', 800);
        setStep(2);
      } else if (step === 2) {
        const finalStatus = results.length > 0 ? 'cualificado' : 'nuevo';
        setIsTyping(true);
        await saveLeadFromBot({ ...leadData, phone: input, intent: 'comprar', status: finalStatus }, searchParams as any);
        setIsTyping(false);
        setFlow('success');

        if (results.length > 0) {
          addMessage('bot', '¡Perfil completado! 🚀 Un asesor de Gelabert Homes te contactará enseguida.');
        } else {
          addMessage('bot', '¡Perfil guardado! 🚀 Te contactaremos de inmediato en cuanto nos confíen la venta de una propiedad con tus requisitos.');
        }
      }
    }

    // ─── VENDER FLOW ───
    else if (flow === 'vender') {
      if (step === 0) {
        setLeadData(prev => ({ ...prev, name: input }));
        addMessage('bot', `Gracias, ${input}. Para empezar nuestra valoración comercial, ¿cuál es la dirección exacta del inmueble (Málaga Capital o Costa del Sol)?`, 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData(prev => ({ ...prev, sell_property_address: input }));
        addMessage('bot', 'Perfecto. ¿Qué tipo de inmueble es? (Piso, chalet, ático, local...)', 800);
        setStep(2);
      } else if (step === 2) {
        setLeadData(prev => ({ ...prev, sell_property_type: input }));
        addMessage('bot', 'Entendido. Cuéntame un poco más: ¿cuántas habitaciones y baños tiene?', 800);
        setStep(3);
      } else if (step === 3) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setLeadData(prev => ({ ...prev, sell_num_bedrooms: beds, sell_additional_info: input }));
        addMessage('bot', '¿Destaca por algo especial? (Ej: terraza amplia, piscina, cocina recién reformada, garaje, etc.)', 800);
        setStep(4);
      } else if (step === 4) {
        const txt = input.toLowerCase();
        setLeadData(prev => ({ 
          ...prev, 
          sell_has_terrace: txt.includes('terraza'),
          sell_has_pool: txt.includes('piscina'),
          sell_is_reformed: txt.includes('reformad'),
          sell_has_parking: txt.includes('garaje') || txt.includes('parking'),
          sell_additional_info: prev.sell_additional_info + ' | Extras: ' + input
        }));
        addMessage('bot', 'Muy bien. ¿Tienes pensado ya un precio estimado de venta o prefieres que hagamos una valoración profesional gratuita?', 800);
        setStep(5);
      } else if (step === 5) {
        setLeadData(prev => ({ ...prev, sell_estimated_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', '¡Fantástico! Tenemos toda la información del inmueble. Para enviarte nuestro dossier y ponernos en contacto, ¿cuál es tu correo electrónico?', 800);
        setStep(6);
      } else if (step === 6) {
        setLeadData(prev => ({ ...prev, email: input }));
        addMessage('bot', '¿Hay algún detalle adicional o comentario sobre la propiedad o la venta que quieras añadir?', 800);
        setStep(7);
      } else if (step === 7) {
        setLeadData(prev => ({ ...prev, agent_notes: (prev.agent_notes ? prev.agent_notes + ' | ' : '') + `Comentarios: ${input}` }));
        addMessage('bot', 'Por último, ¿cuál es tu número de teléfono de contacto?', 800);
        setStep(8);
      } else if (step === 8) {
        setIsTyping(true);
        await saveLeadFromBot({ ...leadData, phone: input, intent: 'vender', status: 'nuevo' });
        setIsTyping(false);
        setFlow('success');
        addMessage('bot', '¡Todo listo! 🚀 Tu solicitud de venta ya está en nuestro sistema. Un experto de Gelabert Homes te contactará muy pronto para darte el mejor servicio.');
      }
    // ─── ALQUILAR PROPIETARIO FLOW ───
    else if (flow === 'alquilar_propietario') {
      if (step === 0) {
        setLeadData(prev => ({ ...prev, name: input }));
        addMessage('bot', `Gracias, ${input}. Para empezar, ¿cuál es la dirección exacta del inmueble que quieres poner en alquiler (Málaga Capital o Costa del Sol)?`, 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData(prev => ({ ...prev, sell_property_address: input }));
        addMessage('bot', 'Perfecto. ¿A partir de qué fecha estará disponible la propiedad para entrar a vivir?', 800);
        setStep(2);
      } else if (step === 2) {
        setLeadData(prev => ({ ...prev, agent_notes: (prev.agent_notes || '') + `Disponibilidad: ${input}` }));
        addMessage('bot', 'Entendido. ¿Cuántas habitaciones y baños tiene?', 800);
        setStep(3);
      } else if (step === 3) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setLeadData(prev => ({ ...prev, sell_num_bedrooms: beds, sell_additional_info: input }));
        addMessage('bot', '¿Destaca por algo especial? (Ej: terraza, piscina, garaje, amueblado...)', 800);
        setStep(4);
      } else if (step === 4) {
        const txt = input.toLowerCase();
        setLeadData(prev => ({ 
          ...prev, 
          sell_has_terrace: txt.includes('terraza'),
          sell_has_pool: txt.includes('piscina'),
          sell_is_furnished: txt.includes('amueblad'),
          sell_has_parking: txt.includes('garaje') || txt.includes('parking'),
          sell_additional_info: prev.sell_additional_info + ' | Extras: ' + input
        }));
        addMessage('bot', 'Muy bien. ¿Qué precio mensual tienes pensado pedir por el alquiler o prefieres una valoración nuestra?', 800);
        setStep(5);
      } else if (step === 5) {
        setLeadData(prev => ({ ...prev, sell_estimated_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', '¿Hay algún detalle adicional o comentario sobre la propiedad o las condiciones que quieras añadir?', 800);
        setStep(6);
      } else if (step === 6) {
        setLeadData(prev => ({ ...prev, agent_notes: (prev.agent_notes ? prev.agent_notes + ' | ' : '') + `Comentarios Adicionales: ${input}` }));
        addMessage('bot', 'Para enviarte nuestra propuesta y ponernos en contacto, ¿cuál es tu correo electrónico?', 800);
        setStep(7);
      } else if (step === 7) {
        setLeadData(prev => ({ ...prev, email: input }));
        addMessage('bot', 'Y finalmente, ¿cuál es tu número de teléfono de contacto?', 800);
        setStep(8);
      } else if (step === 8) {
        setIsTyping(true);
        await saveLeadFromBot({ ...leadData, phone: input, intent: 'alquilar_propietario', status: 'nuevo' });
        setIsTyping(false);
        setFlow('success');
        addMessage('bot', '¡Todo listo! 🚀 Tu solicitud de alquiler ya está en nuestro sistema. Un experto de Gelabert Homes te contactará muy pronto para asesorarte.');
      }
    } 
  };

  const renderInitialOptions = () => (
    <div className="flex flex-col gap-2 mt-4 w-[85%]">
      <button onClick={() => handleStartFlow('alquilar')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><Home size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">Busco Alquiler</p><p className="text-xs text-[#888888]">Soy inquilino, busco vivienda</p></div>
      </button>
      <button onClick={() => handleStartFlow('alquilar_propietario')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><Building2 size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">Ofrezco Alquiler</p><p className="text-xs text-[#888888]">Soy propietario, quiero alquilar</p></div>
      </button>
      <button onClick={() => handleStartFlow('comprar')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><Building2 size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">Quiero Comprar</p><p className="text-xs text-[#888888]">Busco inversión o vivienda</p></div>
      </button>
      <button onClick={() => handleStartFlow('vender')} className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#333333] hover:border-[#C9A962] rounded-lg transition-colors text-left group">
        <div className="p-2 bg-[#0A0A0A] rounded-md text-[#C9A962]"><TrendingUp size={18} /></div>
        <div className="flex-1"><p className="font-primary text-sm text-[#FAF8F5]">Quiero Vender</p><p className="text-xs text-[#888888]">Valora tu inmueble con nosotros</p></div>
      </button>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-[#C9A962] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group animate-bounce"
          >
            <Bot size={28} className="text-[#0A0A0A]" />
            <div className="absolute -top-12 left-0 bg-[#0A0A0A] border border-[#1F1F1F] text-[#FAF8F5] px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              ¿En qué te ayudo? 🏡
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-[360px] h-[540px] max-h-[85vh] bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#333333]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#C9A962] rounded-full flex items-center justify-center text-[#0A0A0A]">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-secondary text-[#FAF8F5]">Gela AI</h3>
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
                  disabled={flow === 'none' || flow === 'success' || isTyping}
                  className="w-full bg-[#0A0A0A] border border-[#333333] rounded-full py-2.5 pl-4 pr-10 text-sm text-[#FAF8F5] focus:border-[#C9A962] outline-none disabled:opacity-50"
                  autoComplete="off"
                />
                <button 
                  type="submit" 
                  disabled={flow === 'none' || flow === 'success' || isTyping}
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
