import { BlogPost } from '../../../src/views/BlogPost';
import { Layout } from '../../../src/components/Layout';
import { LanguageInitializer } from '../../../src/components/LanguageInitializer';
import type { Metadata } from 'next';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aumqjpqngmhpbwytpets.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bXFqcHFuZ21ocGJ3eXRwZXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODgyNjMsImV4cCI6MjA4ODc2NDI2M30.OHi4bRiyFUv2lBHu3wb1IKchj2qF6rZ354uhCQeeAlU";

async function getBlogPost(slug: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${slug}&select=*&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 60 } // ISR
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch (e) {
    return null;
  }
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getBlogPost(resolvedParams.slug);
  if (!post) return { title: 'Artículo | Gelabert Homes' };

  return {
    title: `${post.title} | Gelabert Homes`,
    description: post.excerpt || 'Artículo de nuestro blog inmobiliario.',
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    }
  };
}

export default function Page() {
  return (
    <>
      <LanguageInitializer lang="es" />
      <Layout>
        <BlogPost />
      </Layout>
    </>
  );
}
