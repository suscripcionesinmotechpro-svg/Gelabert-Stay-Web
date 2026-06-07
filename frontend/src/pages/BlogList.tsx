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
    <div className="w-full min-h-screen bg-[#121212] text-[#FAF8F5]">
      <Helmet>
        <title>{t('nav.blog') || 'Blog'} | Gelabert Homes</title>
        <meta name="description" content={t('blog.seo_description')} />
      </Helmet>

      {/* Header Section */}
      <section className="relative w-full pt-40 pb-20 px-6 md:px-14 flex items-end justify-center overflow-hidden min-h-[40vh]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/carousel/generated-1773179848841.webp"
            className="w-full h-full object-cover opacity-40 brightness-75"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl w-full flex flex-col gap-6 items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-1.5 border border-[#C9A962]/30 bg-[#C9A962]/5 font-primary text-[10px] tracking-[0.25em] uppercase text-[#C9A962]"
          >
            {t('blog.badge')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-secondary text-5xl md:text-7xl lg:text-8xl text-white tracking-tight"
          >
            {t('blog.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-primary text-[#888888] max-w-2xl text-lg"
          >
            {t('blog.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-14 py-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-[#1C1C1C] rounded-lg h-[400px] border border-[#1F1F1F]" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-32 border border-[#1F1F1F] rounded-2xl bg-[#1C1C1C]">
            <p className="text-[#888888] font-primary text-lg">{t('blog.coming_soon')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post, index) => {
              const isEn = i18n.language.startsWith('en');
              const displayTitle = isEn ? (post.title_en || post.title) : post.title;
              const coverUrl = post.cover_video || post.cover_image;
              const isVideo = !!post.cover_video || (post.cover_image?.match(/\.(mp4|webm|mov)(\?.*)?$/i));

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group flex flex-col border border-[#1F1F1F] bg-[#1C1C1C] hover:border-[#C9A962]/40 transition-all duration-500 rounded-xl overflow-hidden h-full shadow-2xl"
                >
                  <Link to={`${langPrefix}/blog/${post.slug}`} className="relative aspect-[2/3] overflow-hidden block border-b border-[#1F1F1F]">
                    {coverUrl ? (
                      isVideo ? (
                        <video
                          src={coverUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      ) : (
                        <img
                          src={coverUrl}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                        <span className="text-[#333333] font-primary text-xs tracking-widest uppercase">{t('blog.no_media')}</span>
                      </div>
                    )}
                    {post.category && (
                      <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 font-primary text-[9px] uppercase tracking-[0.2em] text-[#C9A962] rounded-sm z-10 shadow-xl">
                        {t(`blog.categories.${post.category}`) || post.category}
                      </div>
                    )}
                    {/* Sutil overlay gradiente en la imagen */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>

                  <div className="p-8 flex flex-col flex-1 gap-6">
                    <div className="flex items-center gap-4 font-primary text-[10px] text-[#666666] uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#C9A962]/60" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <Link to={`${langPrefix}/blog/${post.slug}`} className="group-hover:text-[#C9A962] transition-colors">
                      <h3 className="font-secondary text-3xl leading-[1.1] text-[#FAF8F5] tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                        {displayTitle}
                      </h3>
                    </Link>

                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C9A962]/10 border border-[#C9A962]/20 flex items-center justify-center text-[#C9A962] group-hover:bg-[#C9A962] group-hover:text-black transition-all duration-300">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-primary text-[11px] uppercase tracking-widest text-[#888888] group-hover:text-white transition-colors">{t('blog.team')}</span>
                      </div>
                      
                      <Link
                        to={`${langPrefix}/blog/${post.slug}`}
                        className="font-primary text-[10px] uppercase tracking-[0.25em] text-[#C9A962] flex items-center gap-2 group-hover:text-white transition-colors"
                      >
                        {t('blog.read_more')}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
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
