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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolvedParams = await params;
  const property = await getProperty(resolvedParams.id);
  if (!property) return { title: 'Property | Gelabert Homes' };

  const title = property.title_en || property.title;
  const description = property.description_en || property.description;

  return {
    title: `${title} - ${property.city || ''} | Gelabert Homes`,
    description: description ? description.substring(0, 155) + '...' : 'Property details.',
    openGraph: {
      title: title,
      description: description,
      images: property.main_image ? [{ url: property.main_image }] : [],
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
