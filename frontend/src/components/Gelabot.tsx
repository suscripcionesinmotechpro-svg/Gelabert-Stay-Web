import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Home, Building2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PropertySearchParams, ScoredProperty } from '../hooks/useLeadsCRM';
import { searchPropertiesForBot, saveLeadFromBot, sendLeadEmail } from '../hooks/useLeadsCRM';

export const Gelabot = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [userLang, setUserLang] = useState<'es'|'en'|null>(null);
  const lang = userLang || (i18n.language?.startsWith('en') ? 'en' : 'es');

  const botT = (es: string | React.ReactNode, en: string | React.ReactNode) => lang === 'en' ? en : es;

  const [messages, setMessages] = useState<{role: 'bot'|'user', content: React.ReactNode}[]>([
    { role: 'bot', content: botT('¡Hola! Soy GelaBot, el agente virtual de Gelabert Homes Real Estate. ¿Qué estás buscando hoy?', 'Hi! I am GelaBot, the virtual agent for Gelabert Homes Real Estate. What are you looking for today?') }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Flows
  const [intent, setIntent] = useState<'alquilar'|'comprar'|'vender'|'alquilar_propietario'|null>(null);
  const [flow, setFlow] = useState<'none'|'onboarding'|'alquilar'|'alquilar_propietario'|'comprar'|'vender'|'alquilar_form'|'comprar_form'|'vender_form'|'success'>('none');
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
    setIntent(type);
    setFlow('onboarding');
    setStep(0);
    setSearchParams({ operation: type === 'alquilar_propietario' ? 'alquilar' : type });
    addMessage('user', 
      type === 'alquilar' ? botT('Busco alquilar', 'I am looking to rent') : 
      type === 'alquilar_propietario' ? botT('Ofrezco mi propiedad en alquiler', 'I want to rent out my property') : 
      type === 'comprar' ? botT('Busco comprar', 'I am looking to buy') : 
      botT('Quiero vender mi propiedad', 'I want to sell my property')
    );
    addMessage('bot', botT('Excelente. Para poder dirigirme a ti correctamente y guardar tu registro, ¿cómo te llamas completo?', 'Excellent. To address you properly and save your request, what is your full name?'), 1000);
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

    // ─── ONBOARDING (Capture Drop-offs Early) ───
    if (flow === 'onboarding') {
      if (step === 0) {
        setLeadData((prev: any) => ({ ...prev, name: input }));
        addMessage('bot', `Gracias, ${input}. Por si se corta la conexión, ¿cuál es tu correo electrónico?`, 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData((prev: any) => ({ ...prev, email: input }));
        addMessage('bot', '¿Y tu número de teléfono de contacto?', 800);
        setStep(2);
      } else if (step === 2) {
        setIsTyping(true);
        const dataToSave = { ...leadData, phone: input, intent: intent!, status: 'incompleto' as const };
        const saved = await saveLeadFromBot(dataToSave);
        setIsTyping(false);
        
        setLeadData((prev: any) => ({ ...prev, phone: input, id: saved?.id }));
        setFlow(intent!);
        setStep(0);
        
        if (intent === 'alquilar') {
          addMessage('bot', `Perfecto. ¿En qué zona de Málaga Capital o la Costa del Sol estás buscando alquilar?`);
        } else if (intent === 'comprar') {
          addMessage('bot', `Perfecto. ¿En qué zona de Málaga Capital o la Costa del Sol estás buscando comprar?`);
        } else if (intent === 'vender') {
          addMessage('bot', `Perfecto. Para empezar nuestra valoración comercial, ¿cuál es la dirección exacta del inmueble (Málaga Capital o Costa del Sol)?`);
        } else if (intent === 'alquilar_propietario') {
          addMessage('bot', `Perfecto. Para empezar, ¿cuál es la dirección exacta del inmueble que quieres poner en alquiler (Málaga Capital o Costa del Sol)?`);
        }
      }
    }

    // ─── ALQUILAR FLOW ───
    else if (flow === 'alquilar') {
      if (step === 0) {
        setSearchParams((prev: any) => ({ ...prev, zones: [input] }));
        addMessage('bot', 'Genial. ¿Cuál es tu presupuesto máximo mensual para el alquiler?', 800);
        setStep(1);
      } else if (step === 1) {
        setSearchParams((prev: any) => ({ ...prev, max_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', 'Anotado. ¿Cuántas habitaciones y baños necesitas como mínimo?', 800);
        setStep(2);
      } else if (step === 2) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setSearchParams((prev: any) => ({ ...prev, min_bedrooms: beds }));
        addMessage('bot', '¿Buscas alguna característica especial? (Ej: terraza, ascensor, piscina, admite mascotas...)', 800);
        setStep(3);
      } else if (step === 3) {
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
                      <a href={`/propiedades/${p.slug}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center py-1.5 border border-[#C9A962] text-[#C9A962] hover:bg-[#C9A962] hover:text-[#0A0A0A] transition-colors rounded text-[10px] uppercase font-bold w-full">{botT('Ver Detalles', 'View Details')}</a>
                    </div>
                  </div>
                ))}
              </div>
            );
            addMessage('bot', (
              <div>
                <p>{botT(`¡He encontrado ${res.length} propiedades con más de un 70% de coincidencia!`, `I've found ${res.length} properties with over a 70% match!`)}</p>
                {resultsNode}
                <p className="mt-3">{botT('Para poder agendar las visitas y pasar tu perfil financiero al propietario, necesitamos unos datos más. ¿Qué edad tienes?', 'To schedule visits and send your financial profile to the owner, we need a few more details. How old are you?')}</p>
              </div>
            ));
          } else {
            addMessage('bot', botT('Actualmente no tenemos ninguna propiedad exacta al 100%. Sin embargo, para avisarte en cuanto entre algo ideal y evaluar tu perfil financiero, necesitamos unos datos más. ¿Qué edad tienes?', 'We currently do not have a 100% exact property match. However, to notify you as soon as something ideal comes in and evaluate your financial profile, we need a few more details. How old are you?'));
          }
        }, 2000);
      }
    }
    // ─── FORM FLOW: ALQUILAR ───
    else if (flow === 'alquilar_form') {
      if (step === 0) {
        setLeadData((prev: any) => ({ ...prev, age: parseInt(input) || undefined }));
        addMessage('bot', botT('¿De dónde eres (ciudad o nacionalidad)?', 'Where are you from (city or nationality)?'), 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData((prev: any) => ({ ...prev, nationality: input }));
        addMessage('bot', botT('¿A qué te dedicas profesionalmente?', 'What is your professional occupation?'), 800);
        setStep(2);
      } else if (step === 2) {
        setLeadData((prev: any) => ({ ...prev, occupation: input }));
        addMessage('bot', botT('Para el estudio de solvencia, ¿cuáles son tus ingresos mensuales netos aproximados?', 'For the solvency study, what is your approximate net monthly income?'), 800);
        setStep(3);
      } else if (step === 3) {
        setLeadData((prev: any) => ({ ...prev, monthly_income: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', botT('¿Qué antigüedad tienes en tu empresa actual?', 'How long have you been with your current company?'), 800);
        setStep(4);
      } else if (step === 4) {
        setLeadData((prev: any) => ({ ...prev, employment_seniority: input }));
        addMessage('bot', botT('¿Hay algún detalle adicional o comentario que quieras dejar anotado en tu perfil antes de finalizar?', 'Are there any additional details or comments you would like to note on your profile before finishing?'), 800);
        setStep(5);
      } else if (step === 5) {
        const finalStatus = results.length > 0 ? 'cualificado' : 'nuevo';
        const finalData = { ...leadData, agent_notes: (leadData.agent_notes ? leadData.agent_notes + ' | ' : '') + `Comentarios: ${input}`, status: finalStatus };
        setIsTyping(true);
        await saveLeadFromBot(finalData, searchParams as any);
        await sendLeadEmail(finalData, results, 'Alquiler');
        setIsTyping(false);
        setFlow('success');
        
        if (results.length > 0) {
          addMessage('bot', botT('¡Tu perfil está completado y cualificado! 🚀 Un asesor te contactará enseguida para organizar las visitas.', 'Your profile is complete and qualified! 🚀 An advisor will contact you shortly to organize visits.'));
        } else {
          addMessage('bot', botT('¡Tu perfil ha sido guardado con éxito! 🚀 Estás en nuestra lista de prioridad para próximas captaciones.', 'Your profile has been successfully saved! 🚀 You are on our priority list for upcoming properties.'));
        }
      }
    }

    // ─── COMPRAR FLOW ───
    else if (flow === 'comprar') {
      if (step === 0) {
        setSearchParams((prev: any) => ({ ...prev, zones: [input] }));
        addMessage('bot', botT('Genial. ¿Cuál es tu presupuesto máximo estimado?', 'Great. What is your estimated maximum budget?'), 800);
        setStep(1);
      } else if (step === 1) {
        setSearchParams((prev: any) => ({ ...prev, max_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', botT('Anotado. ¿Cuántas habitaciones y baños necesitas como mínimo?', 'Noted. What is the minimum number of bedrooms and bathrooms you need?'), 800);
        setStep(2);
      } else if (step === 2) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setSearchParams((prev: any) => ({ ...prev, min_bedrooms: beds }));
        addMessage('bot', botT('¿Buscas alguna característica especial? (Ej: terraza, ascensor, piscina, jardín...)', 'Are you looking for any special features? (e.g. terrace, elevator, pool, garden...)'), 800);
        setStep(3);
      } else if (step === 3) {
        const txt = input.toLowerCase();
        const updatedParams = { ...searchParams };
        if (txt.includes('terraza')) updatedParams.wants_terrace = true;
        if (txt.includes('ascensor')) updatedParams.wants_elevator = true;
        if (txt.includes('piscina')) updatedParams.wants_pool = true;
        if (txt.includes('jardin') || txt.includes('jardín')) updatedParams.wants_garden = true;
        setSearchParams(updatedParams);
        
        addMessage('bot', botT('Para ayudarte mejor con la viabilidad: ¿Ya tienes una hipoteca aprobada o cuentas con los fondos necesarios? (Sí/No)', 'To better assist you with viability: Do you already have an approved mortgage or the necessary funds? (Yes/No)'), 800);
        setStep(4);
      } else if (step === 4) {
        const txt = input.toLowerCase();
        const hasMortgage = txt.includes('si') || txt.includes('sí') || txt.includes('yes') || txt.includes('aprobada') || txt.includes('fondos');
        setLeadData((prev: any) => ({ ...prev, mortgage_approved: hasMortgage, agent_notes: (prev.agent_notes || '') + `Hipoteca/Fondos: ${input}` }));
        
        addMessage('bot', botT('En Gelabert Homes contamos con un servicio exclusivo de bróker hipotecario para conseguirte las mejores condiciones. ¿Te gustaría que te ofrezcamos este servicio gratuito de estudio? (Sí/No)', 'At Gelabert Homes, we offer an exclusive mortgage broker service to get you the best conditions. Would you like us to offer you this free study service? (Yes/No)'), 800);
        setStep(5);
      } else if (step === 5) {
        const txt = input.toLowerCase();
        const wantsMortgageService = txt.includes('si') || txt.includes('sí') || txt.includes('yes') || txt.includes('quiero') || txt.includes('vale');
        setLeadData((prev: any) => ({ ...prev, needs_mortgage_service: wantsMortgageService }));
        
        addMessage('bot', botT('Perfecto. ¿Para qué fecha límite o plazo aproximado te gustaría tener comprada la propiedad?', 'Perfect. By what approximate deadline or timeframe would you like to have purchased the property?'), 800);
        setStep(6);
      } else if (step === 6) {
        setLeadData((prev: any) => ({ ...prev, buy_deadline: input }));
        
        addMessage('bot', botT('¡Gracias por todos los detalles! Dame un segundo, voy a analizar nuestro portfolio de ventas...', 'Thank you for all the details! Give me a second, I will analyze our sales portfolio...'), 800);
        
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
                <p>{botT(`¡He encontrado ${res.length} opciones fantásticas!`, `I've found ${res.length} fantastic options!`)}</p>
                {resultsNode}
                <p className="mt-3">{botT('Para finalizar y poder enviarte los dosieres completos, ¿hay algún detalle adicional o comentario que quieras dejar anotado?', 'To finish and send you the complete dossiers, are there any additional details or comments you would like to note?')}</p>
              </div>
            ));
          } else {
            addMessage('bot', botT('Actualmente no dispongo de una propiedad 100% exacta. Sin embargo, para pasarte opciones "Off-Market" y avisarte de nuevas exclusivas, ¿hay algún detalle adicional que deba tener en cuenta?', 'I currently do not have a 100% exact property. However, to send you "Off-Market" options and notify you of new exclusives, are there any additional details I should keep in mind?'));
          }
        }, 2000);
      }
    }
    // ─── FORM FLOW: COMPRAR ───
    else if (flow === 'comprar_form') {
      if (step === 0) {
        const finalStatus = results.length > 0 ? 'cualificado' : 'nuevo';
        const finalData = { ...leadData, agent_notes: (leadData.agent_notes ? leadData.agent_notes + ' | ' : '') + `Comentarios: ${input}`, status: finalStatus };
        setIsTyping(true);
        await saveLeadFromBot(finalData, searchParams as any);
        await sendLeadEmail(finalData, results, 'Compra');
        setIsTyping(false);
        setFlow('success');

        if (results.length > 0) {
          addMessage('bot', botT('¡Perfil completado! 🚀 Un asesor de Gelabert Homes te contactará enseguida.', 'Profile completed! 🚀 A Gelabert Homes advisor will contact you shortly.'));
        } else {
          addMessage('bot', botT('¡Perfil guardado! 🚀 Te contactaremos de inmediato en cuanto nos confíen la venta de una propiedad con tus requisitos.', 'Profile saved! 🚀 We will contact you immediately as soon as we are entrusted with the sale of a property meeting your requirements.'));
        }
      }
    }

    // ─── VENDER FLOW ───
    else if (flow === 'vender') {
      if (step === 0) {
        setLeadData((prev: any) => ({ ...prev, sell_property_address: input }));
        addMessage('bot', botT('Perfecto. ¿Qué tipo de inmueble es? (Piso, chalet, ático, local...)', 'Perfect. What type of property is it? (Apartment, villa, penthouse, commercial...)'), 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData((prev: any) => ({ ...prev, sell_property_type: input }));
        addMessage('bot', botT('Entendido. Cuéntame un poco más: ¿cuántas habitaciones y baños tiene?', 'Understood. Tell me a bit more: how many bedrooms and bathrooms does it have?'), 800);
        setStep(2);
      } else if (step === 2) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setLeadData((prev: any) => ({ ...prev, sell_num_bedrooms: beds, sell_additional_info: input }));
        addMessage('bot', botT('¿Destaca por algo especial? (Ej: terraza amplia, piscina, cocina recién reformada, garaje, etc.)', 'Does it stand out for anything special? (e.g. large terrace, pool, newly renovated kitchen, garage, etc.)'), 800);
        setStep(3);
      } else if (step === 3) {
        const txt = input.toLowerCase();
        setLeadData((prev: any) => ({ 
          ...prev, 
          sell_has_terrace: txt.includes('terraza') || txt.includes('terrace'),
          sell_has_pool: txt.includes('piscina') || txt.includes('pool'),
          sell_is_reformed: txt.includes('reformad') || txt.includes('renovat'),
          sell_has_parking: txt.includes('garaje') || txt.includes('parking') || txt.includes('garage'),
          sell_additional_info: prev.sell_additional_info + ' | Extras: ' + input
        }));
        addMessage('bot', botT('Muy bien. ¿Tienes pensado ya un precio estimado de venta o prefieres que hagamos una valoración profesional gratuita?', 'Very good. Do you already have an estimated sale price in mind, or would you prefer us to do a free professional valuation?'), 800);
        setStep(4);
      } else if (step === 4) {
        setLeadData((prev: any) => ({ ...prev, sell_estimated_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', botT('¿Hay algún detalle adicional o comentario sobre la propiedad o la venta que quieras añadir?', 'Are there any additional details or comments about the property or the sale that you would like to add?'), 800);
        setStep(5);
      } else if (step === 5) {
        const finalData = { ...leadData, agent_notes: (leadData.agent_notes ? leadData.agent_notes + ' | ' : '') + `Comentarios: ${input}`, status: 'nuevo' as const };
        setIsTyping(true);
        await saveLeadFromBot(finalData);
        await sendLeadEmail(finalData, [], 'Venta');
        setIsTyping(false);
        setFlow('success');
        addMessage('bot', botT('¡Todo listo! 🚀 Tu solicitud de venta ya está en nuestro sistema. Un experto de Gelabert Homes te contactará muy pronto para darte el mejor servicio.', 'All set! 🚀 Your sale request is already in our system. A Gelabert Homes expert will contact you very soon to provide the best service.'));
      }
    } 

    // ─── ALQUILAR PROPIETARIO FLOW ───
    else if (flow === 'alquilar_propietario') {
      if (step === 0) {
        setLeadData((prev: any) => ({ ...prev, sell_property_address: input }));
        addMessage('bot', botT('Perfecto. ¿A partir de qué fecha estará disponible la propiedad para entrar a vivir?', 'Perfect. From what date will the property be available to move into?'), 800);
        setStep(1);
      } else if (step === 1) {
        setLeadData((prev: any) => ({ ...prev, agent_notes: (prev.agent_notes || '') + `Disponibilidad: ${input}` }));
        addMessage('bot', botT('Entendido. ¿Cuántas habitaciones y baños tiene?', 'Understood. How many bedrooms and bathrooms does it have?'), 800);
        setStep(2);
      } else if (step === 2) {
        const beds = parseInt(input.match(/\d+/)?.[0] || '0');
        setLeadData((prev: any) => ({ ...prev, sell_num_bedrooms: beds, sell_additional_info: input }));
        addMessage('bot', botT('¿Destaca por algo especial? (Ej: terraza, piscina, garaje, amueblado...)', 'Does it stand out for anything special? (e.g. terrace, pool, garage, furnished...)'), 800);
        setStep(3);
      } else if (step === 3) {
        const txt = input.toLowerCase();
        setLeadData((prev: any) => ({ 
          ...prev, 
          sell_has_terrace: txt.includes('terraza') || txt.includes('terrace'),
          sell_has_pool: txt.includes('piscina') || txt.includes('pool'),
          sell_is_furnished: txt.includes('amueblad') || txt.includes('furnished'),
          sell_has_parking: txt.includes('garaje') || txt.includes('parking') || txt.includes('garage'),
          sell_additional_info: prev.sell_additional_info + ' | Extras: ' + input
        }));
        addMessage('bot', botT('Muy bien. ¿Qué precio mensual tienes pensado pedir por el alquiler o prefieres una valoración nuestra?', 'Very good. What monthly price do you have in mind for the rent, or would you prefer us to do a valuation?'), 800);
        setStep(4);
      } else if (step === 4) {
        setLeadData((prev: any) => ({ ...prev, sell_estimated_price: parseInt(input.replace(/\D/g, '')) || undefined }));
        addMessage('bot', botT('Para finalizar y enviarte nuestra propuesta, ¿hay algún detalle adicional o comentario sobre la propiedad o las condiciones que quieras añadir?', 'To finish and send you our proposal, are there any additional details or comments about the property or the conditions that you would like to add?'), 800);
        setStep(5);
      } else if (step === 5) {
        const finalData = { ...leadData, agent_notes: (leadData.agent_notes ? leadData.agent_notes + ' | ' : '') + `Comentarios Adicionales: ${input}`, status: 'nuevo' as const };
        setIsTyping(true);
        await saveLeadFromBot(finalData);
        await sendLeadEmail(finalData, [], 'Alquiler (Propietario)');
        setIsTyping(false);
        setFlow('success');
        addMessage('bot', botT('¡Todo listo! 🚀 Tu solicitud de alquiler ya está en nuestro sistema. Un experto de Gelabert Homes te contactará muy pronto para asesorarte.', 'All set! 🚀 Your rental request is already in our system. A Gelabert Homes expert will contact you very soon to advise you.'));
      }
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
            className="fixed bottom-6 left-6 z-50 flex items-center gap-4"
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
            className="fixed bottom-6 left-6 z-50 w-[360px] h-[540px] max-h-[85vh] bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-[#1A1A1A] p-4 flex items-center justify-between border-b border-[#333333]">
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
