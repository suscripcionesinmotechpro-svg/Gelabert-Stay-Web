import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGoogleReviews } from '../hooks/useGoogleReviews';

const GoogleLogo = ({ size = 24 }: { size?: number }) => (
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
      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-[#C9A962]/30"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

export const ReviewsCarousel = ({ onExpand }: { onExpand: () => void }) => {
  const { t } = useTranslation();
  const { data, loading } = useGoogleReviews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const reviews = data?.reviews ?? [];

  const nextReview = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const prevReview = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  // Reset index when reviews load
  useEffect(() => {
    setCurrentIndex(0);
  }, [reviews.length]);

  useEffect(() => {
    if (isPaused || reviews.length === 0) return;
    const timer = setInterval(nextReview, 6000);
    return () => clearInterval(timer);
  }, [nextReview, isPaused, reviews.length]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 800 : -800,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 800 : -800,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const review = reviews[currentIndex];
  const rating = data?.rating ?? 5.0;
  const total = data?.total ?? 0;

  return (
    <div
      className="relative w-full max-w-4xl mx-auto px-4 py-12 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with Google branding */}
      <div className="flex flex-col items-center mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
            <GoogleLogo size={22} />
          </div>
          <h2 className="text-2xl md:text-3xl font-secondary text-gradient-gold tracking-tight">
            Google Reviews
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={18} fill="#C9A962" className="text-[#C9A962]" />
            ))}
          </div>
          <span className="text-sm text-[#FAF8F5]/60 font-medium">
            {loading
              ? '...'
              : `${rating.toFixed(1)} / 5.0${total > 0 ? ` · ${total} reseñas` : ''}`
            }
          </span>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative h-[300px] md:h-[260px] flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-[#C9A962]/60">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-sm">Cargando reseñas...</span>
          </div>
        ) : review ? (
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
              }}
              className="absolute w-full"
            >
              <div className="glass-deep p-8 md:p-12 rounded-2xl border border-[#C9A962]/20 relative group overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#C9A962]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center text-center space-y-5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {review.avatar ? (
                      <img
                        src={review.avatar}
                        alt={review.author}
                        className="w-16 h-16 rounded-full border-2 border-[#C9A962]/30 object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <AvatarFallback name={review.author} />
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                      <GoogleLogo size={12} />
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < review.rating ? '#C9A962' : 'transparent'}
                        className={i < review.rating ? 'text-[#C9A962]' : 'text-[#C9A962]/30'}
                      />
                    ))}
                  </div>

                  {/* Review text */}
                  <div className="space-y-3 max-w-2xl">
                    <p className="text-base md:text-lg text-[#FAF8F5]/90 italic font-light leading-relaxed">
                      "{review.text}"
                    </p>
                    <div className="space-y-0.5">
                      <h4 className="text-[#C9A962] font-semibold tracking-wider uppercase text-xs">
                        {review.author}
                      </h4>
                      <p className="text-[#FAF8F5]/40 text-[10px] uppercase tracking-[0.2em]">
                        {review.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* Controls */}
      {!loading && reviews.length > 1 && (
        <>
          <div className="flex items-center justify-center gap-8 mt-8">
            <button
              onClick={prevReview}
              className="p-3 rounded-full border border-[#C9A962]/20 text-[#C9A962] hover:bg-[#C9A962]/10 transition-all hover:scale-110 active:scale-95"
              aria-label="Anterior reseña"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={onExpand}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C9A962] to-[#D4B673] text-[#0A0A0A] font-primary text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_20px_rgba(201,169,98,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquare size={14} />
              {t('reviews.viewAll', 'Ver todas las reseñas')}
            </button>

            <button
              onClick={nextReview}
              className="p-3 rounded-full border border-[#C9A962]/20 text-[#C9A962] hover:bg-[#C9A962]/10 transition-all hover:scale-110 active:scale-95"
              aria-label="Siguiente reseña"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-[#C9A962]' : 'w-1.5 bg-[#C9A962]/20 hover:bg-[#C9A962]/40'
                }`}
                aria-label={`Ir a reseña ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
