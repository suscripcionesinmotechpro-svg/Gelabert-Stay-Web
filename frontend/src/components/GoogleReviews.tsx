import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
  relative_time_description?: string;
}

interface ReviewsData {
  reviews: GoogleReview[];
  rating: number;
  total: number;
}

// ─── Google Logo SVG ─────────────────────────────────────────────────────────

const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        className={s <= Math.round(rating) ? 'fill-[#FBBC05] text-[#FBBC05]' : 'fill-transparent text-white/20'}
      />
    ))}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ReviewSkeleton = () => (
  <div className="flex flex-col gap-4 p-6 border border-white/5 bg-[#0F0F0F] rounded-sm animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3 w-28 bg-white/10 rounded" />
        <div className="h-2.5 w-20 bg-white/5 rounded" />
      </div>
    </div>
    <div className="h-2.5 w-20 bg-white/10 rounded" />
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="h-3 w-5/6 bg-white/5 rounded" />
      <div className="h-3 w-4/6 bg-white/5 rounded" />
    </div>
  </div>
);

// ─── Review Card ──────────────────────────────────────────────────────────────

const ReviewCard = ({ review, index }: { review: GoogleReview; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 200;
  const needsTruncation = review.text.length > MAX_CHARS;
  const displayText = expanded || !needsTruncation ? review.text : review.text.slice(0, MAX_CHARS) + '…';
  const initials = review.author_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex flex-col gap-4 p-6 border border-white/5 bg-[#0F0F0F] hover:border-[#C9A962]/20 transition-colors duration-300 group rounded-sm relative overflow-hidden"
    >
      {/* Subtle gold glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A962]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Quote icon */}
      <Quote className="absolute top-4 right-4 text-[#C9A962]/10 w-8 h-8 group-hover:text-[#C9A962]/20 transition-colors" />

      {/* Author */}
      <div className="flex items-center gap-3 relative z-10">
        {review.profile_photo_url ? (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#C9A962]/15 border border-[#C9A962]/20 flex items-center justify-center shrink-0">
            <span className="font-secondary text-[#C9A962] text-sm font-bold">{initials}</span>
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-primary text-sm text-[#FAF8F5] font-semibold leading-tight truncate">{review.author_name}</span>
          <span className="font-primary text-[10px] text-[#555] uppercase tracking-wider">
            {review.relative_time_description || new Date(review.time * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
          </span>
        </div>
        {/* Google badge */}
        <div className="ml-auto shrink-0 opacity-50 group-hover:opacity-80 transition-opacity">
          <GoogleLogo size={16} />
        </div>
      </div>

      {/* Stars */}
      <StarRating rating={review.rating} size={13} />

      {/* Review text */}
      {review.text ? (
        <div className="relative z-10">
          <p className="font-primary text-sm text-[#888] leading-relaxed italic">
            &ldquo;{displayText}&rdquo;
          </p>
          {needsTruncation && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 font-primary text-[11px] text-[#C9A962] hover:text-[#D4B673] transition-colors uppercase tracking-wider font-bold"
            >
              {expanded ? 'Ver menos ↑' : 'Leer más ↓'}
            </button>
          )}
        </div>
      ) : (
        <p className="font-primary text-xs text-white/20 italic">Reseña sin texto</p>
      )}
    </motion.div>
  );
};

// ─── Global Rating Badge ──────────────────────────────────────────────────────

export const GoogleRatingBadge = ({ rating, total }: { rating: number; total: number }) => {
  if (!rating) return null;
  return (
    <a
      href="https://www.google.com/maps/place/Gelabert+Homes+Real+Estate/@36.5236896,-4.6026549,15z"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/8 hover:border-[#C9A962]/30 hover:bg-white/[0.05] transition-all group rounded-sm"
      title="Ver reseñas en Google"
    >
      <GoogleLogo size={16} />
      <div className="flex flex-col leading-none">
        <span className="font-primary text-[10px] text-[#555] uppercase tracking-wider">Google Reviews</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-primary text-sm text-[#FAF8F5] font-bold">{rating.toFixed(1)}</span>
          <div className="flex gap-px">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={9} className={s <= Math.round(rating) ? 'fill-[#FBBC05] text-[#FBBC05]' : 'fill-transparent text-white/20'} />
            ))}
          </div>
          {total > 0 && (
            <span className="font-primary text-[10px] text-[#555]">({total})</span>
          )}
        </div>
      </div>
    </a>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

export const GoogleReviewsSection = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';
  const t = (es: string, en: string) => lang === 'en' ? en : es;

  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const CARDS_PER_PAGE = 3;

  useEffect(() => {
    supabase.functions.invoke('google-reviews').then(({ data, error }) => {
      if (!error && data && data.rating) {
        setData(data);
      }
      setLoading(false);
    });
  }, []);

  const reviews = data?.reviews || [];
  const totalPages = Math.ceil(reviews.length / CARDS_PER_PAGE);
  const visible = reviews.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <section className="w-full px-6 md:px-14 py-24 bg-[#080808] relative overflow-hidden">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/20 to-transparent" />

      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <GoogleLogo size={22} />
              <span className="font-primary text-[11px] text-[#666] uppercase tracking-[0.25em] font-bold">
                {t('Reseñas verificadas', 'Verified Reviews')}
              </span>
            </div>
            <h2 className="font-secondary text-4xl md:text-5xl text-[#FAF8F5] leading-tight">
              {t('Lo que dicen en Google', 'What clients say on Google')}
            </h2>
          </div>

          {/* Overall rating pill */}
          {!loading && data && data.rating > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-4 px-6 py-4 bg-[#0F0F0F] border border-[#C9A962]/20 rounded-sm shrink-0"
            >
              <div className="flex flex-col items-center">
                <span className="font-secondary text-4xl text-[#C9A962] leading-none">{data.rating.toFixed(1)}</span>
                <StarRating rating={data.rating} size={12} />
                <span className="font-primary text-[10px] text-[#555] uppercase tracking-wider mt-1">
                  {data.total > 0 ? `${data.total} ${t('reseñas', 'reviews')}` : t('en Google', 'on Google')}
                </span>
              </div>
              <div className="w-[1px] h-12 bg-white/5" />
              <GoogleLogo size={28} />
            </motion.div>
          )}
        </motion.div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <ReviewSkeleton key={i} />)}
          </div>
        ) : reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16 border border-white/5 bg-[#0F0F0F]"
          >
            <GoogleLogo size={36} />
            <p className="font-primary text-[#555] text-sm text-center max-w-xs">
              {t(
                'Aún no hay reseñas en Google. ¡Sé el primero en compartir tu experiencia!',
                'No Google reviews yet. Be the first to share your experience!'
              )}
            </p>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                {visible.map((review, i) => (
                  <ReviewCard key={`${page}-${i}`} review={review} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#666] hover:border-[#C9A962]/40 hover:text-[#C9A962] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`rounded-full transition-all duration-300 ${
                        page === i
                          ? 'w-5 h-2 bg-[#C9A962]'
                          : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="w-10 h-10 border border-white/10 flex items-center justify-center text-[#666] hover:border-[#C9A962]/40 hover:text-[#C9A962] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/20 to-transparent" />
    </section>
  );
};
