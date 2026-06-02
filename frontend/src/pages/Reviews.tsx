import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReviewsCarousel } from '../components/ReviewsCarousel';
import { useGoogleReviews } from '../hooks/useGoogleReviews';

const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AvatarFallback = ({ name }: { name: string }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#C9A962', '#4285F4', '#34A853', '#EA4335', '#FBBC05', '#8B5CF6'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

export const Reviews = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, loading } = useGoogleReviews();

  const reviews = data?.reviews ?? [];
  const rating = data?.rating ?? 5.0;
  const total = data?.total ?? 0;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-16 sm:py-20 bg-mesh overflow-hidden relative">
      {/* Decorative blurs */}
      <div className="absolute top-1/4 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#C9A962]/5 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#C9A962]/3 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 mb-6 sm:mb-8 relative z-10 px-6"
      >
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-secondary text-gradient-gold">
          {t('reviews.title', 'Nuestros Clientes')}
        </h1>
        <p className="text-[#FAF8F5]/60 max-w-md sm:max-w-xl mx-auto font-light tracking-wide text-sm sm:text-base">
          {t('reviews.subtitle', 'La satisfacción de nuestros clientes es nuestra mayor recompensa. Descubre por qué confían en Gelabert Homes.')}
        </p>
      </motion.div>

      <ReviewsCarousel onExpand={() => setIsModalOpen(true)} />

      {/* Full Reviews Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm"
            />

            {/* Sheet on mobile (slides from bottom), centered modal on sm+ */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full sm:max-w-2xl sm:mx-4 bg-[#161616] border-t sm:border border-[#C9A962]/20 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_-16px_64px_-12px_rgba(0,0,0,0.8)] sm:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
              style={{ maxHeight: '90dvh' }}
            >
              {/* Drag handle (mobile only) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[#FAF8F5]/20" />
              </div>

              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-[#161616] px-5 sm:px-8 py-4 sm:py-5 border-b border-[#C9A962]/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GoogleLogo size={15} />
                    <h3 className="text-sm sm:text-base font-secondary text-[#C9A962]">
                      {t('reviews.allReviews', 'Todas las reseñas')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={9} fill="#C9A962" className="text-[#C9A962]" />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#FAF8F5]/40 uppercase tracking-widest">
                      {loading ? '...' : `${rating.toFixed(1)} · ${total > 0 ? t('reviews.reviewsCount', { count: total }) : 'Google'}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-[#FAF8F5]/60 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-3" style={{ maxHeight: 'calc(90dvh - 90px)' }}>
                {loading ? (
                  <div className="flex justify-center items-center py-20 text-[#C9A962]/60">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : (
                  reviews.map((review, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#C9A962]/20 transition-all"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        {review.avatar ? (
                          <img
                            src={review.avatar}
                            alt={review.author}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <AvatarFallback name={review.author} />
                        )}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-[#FAF8F5] truncate">{review.author}</h4>
                            <span className="text-[10px] text-[#FAF8F5]/40 uppercase whitespace-nowrap flex-shrink-0 pt-0.5">{review.date}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                fill={i < review.rating ? '#C9A962' : 'transparent'}
                                className={i < review.rating ? 'text-[#C9A962]' : 'text-[#C9A962]/20'}
                              />
                            ))}
                          </div>
                          {review.text ? (
                            <p className="text-xs sm:text-sm text-[#FAF8F5]/70 leading-relaxed font-light">
                              {review.text}
                            </p>
                          ) : (
                            <p className="text-xs text-[#FAF8F5]/30 italic">{t('reviews.noComment')}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}

                {/* CTA footer */}
                <div className="pt-4 flex justify-center pb-2">
                  <a
                    href="https://g.page/r/gelabert-homes/review"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#C9A962] hover:underline transition-opacity hover:opacity-80"
                  >
                    {t('reviews.writeReview', 'Escribir una reseña en Google')}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social proof footer */}
      {!loading && total > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 flex flex-col items-center space-y-2"
        >
          <div className="flex items-center gap-2">
            <GoogleLogo size={14} />
            <span className="text-[11px] text-[#FAF8F5]/40 uppercase tracking-widest font-medium">
              {t('reviews.satisfiedClients', { count: total })}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
