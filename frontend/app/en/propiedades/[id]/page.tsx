import { FichaPropiedad } from '../../../../src/views/FichaPropiedad';
import { Layout } from '../../../../src/components/Layout';
import { LanguageInitializer } from '../../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

async function getProperty(idOrSlug: string) {
  try {
    const isUUID = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    let url = `${SUPABASE_URL}/rest/v1/properties?`;
    if (isUUID) {
      url += `id=eq.${idOrSlug}`;
    } else {
      url += `or=(reference.ilike.${idOrSlug},slug.ilike.${idOrSlug})`;
    }
    url += `&select=*&limit=1`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 60 } // ISR: Revalidate every 60s
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch (e) {
    return null;
  }
}

type Params = Promise<{ id: string }>;

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&aacute;/g, "á")
    .replace(/&eacute;/g, "é")
    .replace(/&iacute;/g, "í")
    .replace(/&oacute;/g, "ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Eacute;/g, "É")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&#[0-9]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPrice(
  price: number | null,
  operation: string,
  isEn: boolean,
  priceType?: 'exact' | 'from' | 'range' | null,
  maxPrice?: number | null,
  currency?: string
) {
  if (!price) return null;
  const formatter = new Intl.NumberFormat(isEn ? "en-US" : "es-ES", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  });
  const formattedPrice = formatter.format(price);
  const feeLabel = operation === "alquiler" ? (isEn ? "/month" : "/mes") : "";

  if (priceType === 'from') {
    return isEn ? `From ${formattedPrice}${feeLabel}` : `Desde ${formattedPrice}${feeLabel}`;
  }
  
  if (priceType === 'range' && maxPrice) {
    const formattedMax = formatter.format(maxPrice);
    return `${formattedPrice} - ${formattedMax}${feeLabel}`;
  }

  return `${formattedPrice}${feeLabel}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolvedParams = await params;
  const property = await getProperty(resolvedParams.id);
  if (!property) return { title: 'Property | Gelabert Homes' };

  const isEn = true;

  const typeLabels: Record<string, { es: string; en: string }> = {
    piso: { es: "Piso", en: "Apartment" },
    casa: { es: "Casa", en: "House" },
    chalet: { es: "Chalet", en: "Villa" },
    atico: { es: "Ático", en: "Penthouse" },
    estudio: { es: "Estudio", en: "Studio" },
    loft: { es: "Loft", en: "Loft" },
    local: { es: "Local", en: "Commercial" },
    oficina: { es: "Oficina", en: "Office" },
    nave: { es: "Nave", en: "Warehouse" },
    terreno: { es: "Terreno", en: "Land" },
    negocio: { es: "Negocio", en: "Business" },
    habitacion: { es: "Habitación", en: "Room" },
    otro: { es: "Propiedad", en: "Property" }
  };

  const type = property.property_type || "otro";
  const typeLabel = typeLabels[type]?.en || typeLabels.otro.en;

  let opLabel = "";
  if (property.operation === "alquiler") {
    if (property.is_room_rental) {
      opLabel = "Room Rental";
    } else {
      opLabel = "Rent";
    }
  } else if (property.operation === "venta") {
    opLabel = "Sale";
  } else if (property.operation === "traspaso") {
    opLabel = "Transfer";
  }

  const baseTitle = property.title_en || property.meta_title_en || property.meta_title || property.title || `${opLabel} ${typeLabel}`;
  const cleanBaseTitle = (baseTitle || "").replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();

  // Structured sharing title (e.g. "Rent Apartment · Málaga · 800 €/month · 40 m² · Baths 1 · Floor 5th")
  const formattedPrice = formatPrice(
    property.price,
    property.operation,
    isEn,
    property.price_type,
    property.max_price,
    property.currency
  );
  const sharingTitleElements = [
    opLabel && typeLabel ? `${opLabel} ${typeLabel}` : null,
    property.city || null,
    formattedPrice || null,
    property.area_m2 ? `${property.area_m2} m²` : null,
    property.bedrooms > 0 ? `${property.bedrooms} ${property.bedrooms === 1 ? 'Bed' : 'Beds'}` : null,
    property.bathrooms ? `Baths ${property.bathrooms}` : null,
    property.floor ? `Floor ${property.floor}` : null
  ];
  const cleanSharingTitle = sharingTitleElements.filter(Boolean).join(" · ").replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();

  // Structured description (features list + clean text)
  const featuresList = [];
  if (property.city) featuresList.push(property.city);
  if (formattedPrice) featuresList.push(formattedPrice);
  if (property.area_m2) featuresList.push(`${property.area_m2} m²`);
  if (property.bedrooms > 0) featuresList.push(`Bedrooms ${property.bedrooms}`);
  if (property.bathrooms > 0) featuresList.push(`Baths ${property.bathrooms}`);
  if (property.floor) featuresList.push(`Floor ${property.floor}`);
  if (property.has_elevator) featuresList.push("Elevator");
  if (property.has_pool) featuresList.push("Pool");
  if (property.sea_views) featuresList.push("Sea Views");

  const rawShort = property.short_description_en || property.meta_description_en || property.short_description || property.meta_description;
  const rawLong = property.description_en || property.description;

  let descriptionBody = "";
  if (rawShort) {
    descriptionBody = stripHtml(rawShort);
  } else if (rawLong) {
    descriptionBody = stripHtml(rawLong).substring(0, 160);
  }

  let cleanSharingDesc = featuresList.join(" · ");
  if (descriptionBody) {
    cleanSharingDesc += ` | ${descriptionBody}`;
  }
  cleanSharingDesc = cleanSharingDesc.trim() || cleanBaseTitle;
  cleanSharingDesc = cleanSharingDesc.replace(/"/g, "&quot;").replace(/[\r\n]+/g, " ").trim();

  return {
    title: `${cleanBaseTitle} | Gelabert Homes`,
    description: cleanSharingDesc,
    openGraph: {
      title: cleanSharingTitle,
      description: cleanSharingDesc,
      images: property.main_image ? [{ url: property.main_image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanSharingTitle,
      description: cleanSharingDesc,
      images: property.main_image ? [property.main_image] : [],
    }
  };
}

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="en" />
      <Layout>
        <FichaPropiedad />
      </Layout>
    </>
  );
}
