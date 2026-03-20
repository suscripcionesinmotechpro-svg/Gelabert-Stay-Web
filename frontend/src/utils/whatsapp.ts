export type WhatsAppContext = 'property' | 'owner' | 'general' | 'contact' | 'services' | 'properties_list' | 'tenants';

interface WhatsAppLinkProps {
  context: WhatsAppContext;
  propertyRef?: string;
  propertyName?: string;
  phoneNumber?: string;
  url?: string;
}

/**
 * Generates a context-aware WhatsApp link with pre-filled messages.
 * Adapts the message based on where the user is on the website.
 */
export const getWhatsAppLink = ({ 
  context, 
  propertyRef, 
  propertyName, 
  phoneNumber = '34611898827',
  url
}: WhatsAppLinkProps) => {
  const baseUrl = `https://wa.me/${phoneNumber.replace(/\s+/g, '')}`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  let message = '';

  switch (context) {
    case 'property':
      message = `Hola, me interesa la propiedad ${propertyName || 'Propiedad'} que vi en la web. Ref: ${propertyRef || ''}\n\n🔗 ${currentUrl}`;
      break;
    case 'properties_list':
      message = `Hola, acabo de ver vuestro catálogo de propiedades y me gustaría recibir más información sobre las propiedades disponibles.\n\n🔗 ${currentUrl}`;
      break;
    case 'services':
      message = `Hola, estoy interesado en vuestros servicios inmobiliarios y me gustaría recibir más información.\n\n🔗 ${currentUrl}`;
      break;
    case 'owner':
      message = `Hola, soy propietario y me gustaría recibir información sobre vuestros servicios de gestión y venta de inmuebles.\n\n🔗 ${currentUrl}`;
      break;
    case 'tenants':
      message = `Hola, busco vivienda y me gustaría que me ayudaseis a encontrar la propiedad ideal.\n\n🔗 ${currentUrl}`;
      break;
    case 'contact':
      message = `Hola, me gustaría realizar una consulta sobre vuestros servicios inmobiliarios.\n\n🔗 ${currentUrl}`;
      break;
    case 'general':
    default:
      message = `Hola, me gustaría recibir más información sobre Gelabert Homes Real Estate.\n\n🔗 ${currentUrl}`;
      break;
  }

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
};

/**
 * Determines the WhatsApp context based on the current URL path.
 * Used by the FloatingContact component to send relevant pre-filled messages.
 */
export const getContextFromPath = (pathname: string): {
  context: WhatsAppContext;
  label: string;
  labelEs: string;
} => {
  // Property detail page: /propiedades/GEL-XXX or /en/propiedades/GEL-XXX
  const propertyDetailMatch = pathname.match(/\/propiedades\/([^\/]+)$/);
  if (propertyDetailMatch) {
    return { 
      context: 'property', 
      label: 'Enquire about this property',
      labelEs: 'Consultar esta propiedad'
    };
  }

  // Properties list
  if (pathname.includes('/propiedades')) {
    return { 
      context: 'properties_list', 
      label: 'Browse properties with us',
      labelEs: 'Ver propiedades disponibles'
    };
  }

  // Services page
  if (pathname.includes('/servicios')) {
    return { 
      context: 'services', 
      label: 'Ask about our services',
      labelEs: 'Consultar servicios'
    };
  }

  // Owners / Propietarios page
  if (pathname.includes('/propietarios')) {
    return { 
      context: 'owner', 
      label: 'Services for property owners',
      labelEs: 'Servicios para propietarios'
    };
  }

  // Contact page
  if (pathname.includes('/contacto')) {
    return { 
      context: 'contact', 
      label: 'Send us a message',
      labelEs: 'Enviar consulta'
    };
  }

  // Default / home
  return { 
    context: 'general', 
    label: 'Chat with us',
    labelEs: 'Contactar por WhatsApp'
  };
};
