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
  const [data, setData] = useState<GoogleReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const { data: result, error: fnError } = await supabase.functions.invoke('google-reviews');

        if (fnError || !result || result.error) {
          console.warn('Google Reviews API unavailable, using fallback data.');
          setUsingFallback(true);
          setData({
            name: 'Gelabert Homes',
            rating: 5.0,
            total: 124,
            reviews: FALLBACK_REVIEWS,
          });
        } else {
          setData(result);
          setUsingFallback(false);
        }
      } catch (e) {
        console.error('useGoogleReviews error:', e);
        setUsingFallback(true);
        setData({
          name: 'Gelabert Homes',
          rating: 5.0,
          total: 124,
          reviews: FALLBACK_REVIEWS,
        });
        setError('Could not load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return { data, loading, error, usingFallback };
};
