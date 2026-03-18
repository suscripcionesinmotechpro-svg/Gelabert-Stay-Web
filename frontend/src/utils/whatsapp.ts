export type WhatsAppContext = 'property' | 'owner' | 'general' | 'contact';

interface WhatsAppLinkProps {
  context: WhatsAppContext;
  propertyRef?: string;
  propertyName?: string;
  phoneNumber?: string;
  url?: string;
}

/**
 * Generates a context-aware WhatsApp link with pre-filled messages.
 * Includes property details, owner service interest, or general contact.
 */
export const getWhatsAppLink = ({ 
  context, 
  propertyRef, 
  propertyName, 
  phoneNumber = '34624419992',
  url
}: WhatsAppLinkProps) => {
  const baseUrl = `https://wa.me/${phoneNumber.replace(/\s+/g, '')}`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  let message = '';

  switch (context) {
    case 'property':
      message = `Hola, estoy interesado en recibir más información sobre esta propiedad:\n\n🏠 *${propertyName || 'Propiedad'}*\nReferencia: ${propertyRef || 'N/A'}\n\nEnlace: ${currentUrl}`;
      break;
    case 'owner':
      message = `Hola, soy propietario y me gustaría recibir información sobre vuestros servicios de gestión y venta de inmuebles.\n\nVengo desde: ${currentUrl}`;
      break;
    case 'contact':
      message = `Hola Gelabert Stay, me gustaría realizar una consulta general sobre vuestros servicios inmobiliarios.\n\nEnlace de referencia: ${currentUrl}`;
      break;
    case 'general':
    default:
      message = `Hola Gelabert Stay, me gustaría recibir más información sobre vuestros servicios.\n\nEnlace: ${currentUrl}`;
      break;
  }

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
};
