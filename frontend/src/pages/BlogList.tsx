import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { BlogPost } from '../types/blog';
import { Calendar, User, ArrowRight } from 'lucide-react';

export const BlogList = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const langPrefix = i18n.language.startsWith('en') ? '/en' : '';

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-[#FAF8F5]">
      <Helmet>
        <title>{t('nav.blog') || 'Blog'} | Gelabert Homes</title>
        <meta name="description" content="Noticias, tendencias y artículos sobre el mercado inmobiliario de lujo en la Costa del Sol por Gelabert Homes." />
      </Helmet>

      {/* Header Section */}
      <section className="relative w-full pt-40 pb-20 px-6 md:px-14 flex items-end justify-center overflow-hidden min-h-[40vh]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/carousel/generated-1773179848841.webp"
            className="w-full h-full object-cover opacity-40 brightness-75"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl w-full flex flex-col gap-6 items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-1.5 border border-[#C9A962]/30 bg-[#C9A962]/5 font-primary text-[10px] tracking-[0.25em] uppercase text-[#C9A962]"
          >
            Insights & Noticias
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-secondary text-5xl md:text-7xl lg:text-8xl text-white tracking-tight"
          >
            {t('nav.blog') || 'El Blog'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-primary text-[#888888] max-w-2xl text-lg"
          >
            Descubra las últimas tendencias, análisis del mercado y guías exclusivas sobre inversión y estilo de vida en la Costa del Sol.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-14 py-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-[#0F0F0F] rounded-lg h-[400px] border border-[#1F1F1F]" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-32 border border-[#1F1F1F] rounded-2xl bg-[#0F0F0F]">
            <p className="text-[#888888] font-primary text-lg">Próximamente publicaremos nuevos artículos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post, index) => {
              const isEn = i18n.language.startsWith('en');
              const displayTitle = isEn ? (post.title_en || post.title) : post.title;
              const displayDescription = isEn ? (post.seo_description_en || post.seo_description || '') : (post.seo_description || '');
              const coverUrl = post.cover_video || post.cover_image;
              const isVideo = !!post.cover_video || (post.cover_image?.match(/\.(mp4|webm|mov)(\?.*)?$/i));

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col gap-5 border border-[#1F1F1F] bg-[#0F0F0F] hover:border-[#C9A962]/40 transition-colors rounded-xl overflow-hidden"
                >
                  <Link to={`${langPrefix}/blog/${post.slug}`} className="relative h-auto overflow-hidden block border-b border-[#1F1F1F]">
                    {coverUrl ? (
                      isVideo ? (
                        <video
                          src={coverUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <img
                          src={coverUrl}
                          alt={displayTitle}
                          className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                        />
                      )
                    ) : (
                      <div className="w-full h-64 bg-[#1A1A1A] flex items-center justify-center">
                        <span className="text-[#333333]">{isEn ? 'No media' : 'Sin multimedia'}</span>
                      </div>
                    )}
                    {post.category && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 font-primary text-[10px] uppercase tracking-wider text-[#C9A962] rounded-sm">
                        {post.category}
                      </div>
                    )}
                  </Link>

                  <div className="p-6 pt-2 flex flex-col flex-1 gap-4">
                    <div className="flex items-center gap-4 font-primary text-[11px] text-[#666666] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <Link to={`${langPrefix}/blog/${post.slug}`} className="group-hover:text-[#C9A962] transition-colors">
                      <h3 className="font-secondary text-2xl leading-tight text-[#FAF8F5] line-clamp-2">
                        {displayTitle}
                      </h3>
                    </Link>

                    <p className="font-primary text-[#888888] text-sm leading-relaxed line-clamp-3">
                      {displayDescription}
                    </p>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#1F1F1F]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#C9A962]/20 border border-[#C9A962]/30 flex items-center justify-center text-[#C9A962]">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="font-primary text-xs text-[#888888]">{isEn ? 'Gelabert Team' : 'Equipo Gelabert'}</span>
                      </div>
                      
                      <Link
                        to={`${langPrefix}/blog/${post.slug}`}
                        className="font-primary text-[11px] uppercase tracking-widest text-[#C9A962] flex items-center gap-2 group-hover:text-white transition-colors"
                      >
                        {isEn ? 'Read more' : 'Leer más'}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
