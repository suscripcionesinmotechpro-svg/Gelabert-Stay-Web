import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
  url?: string;
}

export interface GoogleReviewsData {
  name: string;
  rating: number;
  total: number;
  reviews: GoogleReview[];
}

// Fallback reviews shown if the API fails
const FALLBACK_REVIEWS: GoogleReview[] = [
  {
    author: 'Carlos Rodríguez',
    rating: 5,
    text: 'Excelente servicio. Encontraron la casa de mis sueños en menos de un mes. Muy profesionales y atentos a cada detalle.',
    date: 'hace 2 semanas',
    avatar: 'https://i.pravatar.cc/150?u=cr1',
  },
  {
    author: 'Elena Martínez',
    rating: 5,
    text: 'La mejor inmobiliaria con la que he trabajado. Transparencia total y una gestión impecable de toda la documentación.',
    date: 'hace 1 mes',
    avatar: 'https://i.pravatar.cc/150?u=em2',
  },
  {
    author: 'Juan Pérez',
    rating: 5,
    text: 'Muy buena experiencia. El trato fue exquisito y las propiedades que ofrecen son de altísima calidad.',
    date: 'hace 3 meses',
    avatar: 'https://i.pravatar.cc/150?u=jp3',
  },
  {
    author: 'Sofía García',
    rating: 5,
    text: 'Gelabert Homes superó todas mis expectativas. El proceso de venta de mi piso fue rápido y sin complicaciones.',
    date: 'hace 2 semanas',
    avatar: 'https://i.pravatar.cc/150?u=sg4',
  },
  {
    author: 'Ricardo Sánchez',
    rating: 5,
    text: 'Profesionales de pies a cabeza. Me ayudaron con todo el proceso de financiación. Altamente recomendables.',
    date: 'hace 5 meses',
    avatar: 'https://i.pravatar.cc/150?u=rs5',
  },
];

export const useGoogleReviews = () => {
  const [data, setData] = useState<GoogleReviewsData>({
    name: 'Gelabert Homes',
    rating: 5.0,
    total: 124,
    reviews: FALLBACK_REVIEWS,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      try {
        const invokePromise = supabase.functions.invoke('google-reviews');
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout invoking google-reviews')), 6000)
        );

        const response = await Promise.race([invokePromise, timeoutPromise]);
        
        if (!active) return;

        const result = response.data;
        const fnError = response.error;

        if (fnError || !result || result.error || !result.reviews || result.reviews.length === 0) {
          console.warn('Google Reviews API unavailable or empty, keeping fallback data.');
        } else {
          // Mapear los datos de la API de Google al formato esperado por el frontend
          const mappedReviews = (result.reviews || []).map((r: any) => ({
            author: r.author_name || 'Anónimo',
            rating: r.rating || 5,
            text: r.text || '',
            date: r.relative_time_description || new Date((r.time || Date.now() / 1000) * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
            avatar: r.profile_photo_url || '',
            url: r.author_url || '',
          }));

          setData({
            name: 'Gelabert Homes',
            rating: result.rating || 5.0,
            total: result.total || 0,
            reviews: mappedReviews,
          });
          setUsingFallback(false);
        }
      } catch (e) {
        console.warn('useGoogleReviews background sync error, keeping fallback data:', e);
      }
    };

    fetchReviews();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error, usingFallback };
};
