import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { BlogPost as BlogPostType } from '../types/blog';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { PageLoading } from '../components/PageLoading';

export const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error || !data) {
          navigate(`${langPrefix}/blog`, { replace: true });
          return;
        }
        setPost(data);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        navigate(`${langPrefix}/blog`, { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate, langPrefix]);

  if (loading) return <PageLoading />;
  if (!post) return null;

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-[#FAF8F5] pb-24">
      <Helmet>
        <title>{post.seo_title || `${post.title} | Gelabert Homes Blog`}</title>
        <meta name="description" content={post.seo_description || ''} />
        <meta property="og:title" content={post.seo_title || post.title} />
        <meta property="og:description" content={post.seo_description || ''} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
      </Helmet>

      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-20 px-6 md:px-14 min-h-[50vh] flex flex-col items-center justify-center border-b border-[#1F1F1F]">
        {post.cover_image && (
          <>
            <div className="absolute inset-0 z-0 bg-[#050505]">
              {post.cover_image.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                <video
                  src={post.cover_image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-20 blur-sm"
                />
              ) : (
                <img
                  src={post.cover_image}
                  className="w-full h-full object-cover opacity-20 blur-sm"
                  alt=""
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-black/50" />
            </div>
          </>
        )}
        
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          <Link
            to={`${langPrefix}/blog`}
            className="self-start md:self-auto flex items-center gap-2 font-primary text-[10px] uppercase tracking-[0.2em] text-[#C9A962] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Volver al Blog
          </Link>

          {post.category && (
            <span className="px-3 py-1 bg-[#C9A962]/10 border border-[#C9A962]/30 font-primary text-[10px] tracking-widest uppercase text-[#C9A962] rounded-sm">
              {post.category}
            </span>
          )}

          <h1 className="font-secondary text-4xl md:text-6xl text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 font-primary text-xs text-[#888888] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C9A962]" />
              {new Date(post.published_at || post.created_at).toLocaleDateString(i18n.language, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="w-1 h-1 rounded-full bg-[#333]" />
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#C9A962]" />
              Equipo Gelabert
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image/Video (Clear) */}
      {post.cover_image && (
        <section className="w-full max-w-5xl mx-auto px-6 md:px-14 -mt-10 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-xl overflow-hidden shadow-2xl border border-[#1F1F1F]"
          >
            {post.cover_image.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
              <video
                src={post.cover_image}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto block"
              />
            ) : (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-auto block"
              />
            )}
          </motion.div>
        </section>
      )}

      {/* Article Content */}
      <section className="w-full max-w-3xl mx-auto px-6 md:px-14 pt-20">
        <div 
          className="prose prose-invert prose-lg max-w-none font-primary text-[#DFDFE6] leading-relaxed whitespace-pre-wrap
            prose-headings:font-secondary prose-headings:text-[#FAF8F5] prose-headings:font-normal
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-[#1F1F1F] prose-h2:pb-4
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-[#CCCCCC] prose-p:mb-6
            prose-a:text-[#C9A962] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-bold
            prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:text-[#CCCCCC]
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:text-[#CCCCCC]
            prose-li:mb-2
            prose-blockquote:border-l-4 prose-blockquote:border-[#C9A962] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[#888888]
            prose-img:rounded-xl prose-img:border prose-img:border-[#1F1F1F] prose-img:w-full prose-img:h-auto prose-img:my-10 prose-img:shadow-2xl
            [&_video]:rounded-xl [&_video]:w-full [&_video]:my-10 [&_video]:shadow-2xl [&_video]:border [&_video]:border-[#1F1F1F]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </section>
    </div>
  );
};
