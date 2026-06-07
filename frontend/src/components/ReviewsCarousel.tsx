import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGoogleReviews } from '../hooks/useGoogleReviews';

const AUTOPLAY_DURATION = 8000; // ms

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
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg border-2 border-[#C9A962]/30 flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

// CSS keyframe for the progress bar — injected once
const PROGRESS_STYLE_ID = 'reviews-progress-keyframes';
function ensureProgressKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(PROGRESS_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PROGRESS_STYLE_ID;
  style.textContent = `
    @keyframes reviewProgress {
      from { width: 0%; }
      to   { width: 100%; }
    }
    .review-progress-bar {
      animation: reviewProgress linear forwards;
    }
    .review-progress-bar.paused {
      animation-play-state: paused;
    }
  `;
  document.head.appendChild(style);
}

export const ReviewsCarousel = ({ onExpand }: { onExpand: () => void }) => {
  const { t } = useTranslation();
  const { data, loading } = useGoogleReviews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // Incrementing this key restarts both the autoplay timer and the CSS progress animation
  const [resetKey, setResetKey] = useState(0);

  // Touch / swipe support
  const touchStartX = useRef<number | null>(null);

  const reviews = data?.reviews ?? [];

  // Inject CSS keyframes once on mount
  useEffect(() => { ensureProgressKeyframes(); }, []);

  const goToNext = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setResetKey((k) => k + 1);
  }, [reviews.length]);

  const goToPrev = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setResetKey((k) => k + 1);
  }, [reviews.length]);

  const goToIndex = useCallback((idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    setResetKey((k) => k + 1);
  }, [currentIndex]);

  // Reset when reviews first load
  useEffect(() => {
    setCurrentIndex(0);
    setResetKey((k) => k + 1);
  }, [reviews.length]);

  // Autoplay — resetKey forces a fresh timer after every manual navigation
  useEffect(() => {
    if (isPaused || reviews.length === 0) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
      setResetKey((k) => k + 1);
    }, AUTOPLAY_DURATION);
    return () => clearTimeout(timer);
  }, [resetKey, isPaused, reviews.length]);

  // Sync progress bar and JS timer when hover out (unpaused)
  useEffect(() => {
    if (!isPaused && reviews.length > 0) {
      setResetKey((k) => k + 1);
    }
  }, [isPaused, reviews.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = (touchStartX.current ?? 0) - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goToNext() : goToPrev();
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '110%' : '-110%', opacity: 0, scale: 0.94 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? '110%' : '-110%', opacity: 0, scale: 0.94 }),
  };

  const review = reviews[currentIndex];
  const rating = data?.rating ?? 5.0;
  const total = data?.total ?? 0;

  return (
    <div
      className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 pb-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header: Google branding + score */}
      <div className="flex flex-col items-center mb-10 sm:mb-12 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center shadow-xl overflow-hidden border border-white/10 shrink-0">
            <GoogleLogo size={28} />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-secondary text-gradient-gold tracking-tight font-medium">
            Google Reviews
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={20} fill="#C9A962" className="text-[#C9A962]" />
            ))}
          </div>
          <span className="text-sm sm:text-base text-[#FAF8F5]/80 font-medium tracking-wide">
            {loading ? '...' : `${rating.toFixed(1)} / 5.0 · ${total > 0 ? `${total} reseñas` : ''}`}
          </span>
        </div>
      </div>

      {/* Carousel with side arrows */}
      <div className="relative flex items-center gap-2 sm:gap-3">

        {/* ← Left arrow */}
        <button
          onClick={goToPrev}
          disabled={loading || reviews.length === 0}
          className="flex-shrink-0 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#C9A962]/30 bg-[#161616]/80 backdrop-blur-sm text-[#C9A962] flex items-center justify-center
            hover:bg-[#C9A962]/15 hover:border-[#C9A962]/60 hover:scale-110
            active:scale-95 transition-all duration-200 shadow-lg
            disabled:opacity-20 disabled:pointer-events-none"
          aria-label="Reseña anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Card area */}
        <div
          className="relative flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16 text-[#C9A962]/60">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-sm">Cargando reseñas...</span>
            </div>
          ) : review ? (
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 280, damping: 28 },
                  opacity: { duration: 0.22 },
                  scale: { duration: 0.22 },
                }}
                className="w-full"
              >
                <div className="glass-deep p-6 sm:p-8 md:p-10 rounded-2xl border border-[#C9A962]/20 relative overflow-hidden">
                  {/* Decorative blur */}
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#C9A962]/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {review.avatar ? (
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#C9A962]/30 object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <AvatarFallback name={review.author} />
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-[3px] shadow-md">
                        <GoogleLogo size={11} />
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < review.rating ? '#C9A962' : 'transparent'}
                          className={i < review.rating ? 'text-[#C9A962]' : 'text-[#C9A962]/30'}
                        />
                      ))}
                    </div>

                    {/* Review text */}
                    <div className="space-y-3 w-full max-w-xl">
                      <p className="text-sm sm:text-base md:text-lg text-[#FAF8F5]/90 italic font-light leading-relaxed">
                        "{review.text}"
                      </p>
                      <div className="space-y-0.5 pt-1">
                        <h4 className="text-[#C9A962] font-semibold tracking-wider uppercase text-[11px] sm:text-xs">
                          {review.author}
                        </h4>
                        <p className="text-[#FAF8F5]/40 text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">
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

        {/* → Right arrow */}
        <button
          onClick={goToNext}
          disabled={loading || reviews.length === 0}
          className="flex-shrink-0 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#C9A962]/30 bg-[#161616]/80 backdrop-blur-sm text-[#C9A962] flex items-center justify-center
            hover:bg-[#C9A962]/15 hover:border-[#C9A962]/60 hover:scale-110
            active:scale-95 transition-all duration-200 shadow-lg
            disabled:opacity-20 disabled:pointer-events-none"
          aria-label="Siguiente reseña"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Progress bar + dots + CTA */}
      {!loading && reviews.length > 1 && (
        <div className="mt-5 space-y-4">

          {/* ── Autoplay progress bar (pure CSS animation, no setInterval) ── */}
          <div className="w-full h-[2px] bg-[#C9A962]/10 rounded-full overflow-hidden">
            <div
              key={`progress-${resetKey}`}
              className={`h-full bg-gradient-to-r from-[#C9A962] to-[#D4B673] rounded-full review-progress-bar${isPaused ? ' paused' : ''}`}
              style={{ animationDuration: `${AUTOPLAY_DURATION}ms` }}
            />
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-7 bg-[#C9A962]'
                    : 'w-1.5 bg-[#C9A962]/20 hover:bg-[#C9A962]/50'
                }`}
                aria-label={`Ir a reseña ${idx + 1}`}
              />
            ))}
          </div>

          {/* CTA button */}
          <div className="flex justify-center pt-1">
            <button
              onClick={onExpand}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C9A962] to-[#D4B673] text-[#0A0A0A] font-primary text-[11px] sm:text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_20px_rgba(201,169,98,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquare size={13} />
              {t('reviews.viewAll', 'Ver todas las reseñas')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
