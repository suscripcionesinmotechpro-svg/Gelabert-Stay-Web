import { useState, useEffect } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('gelabert_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem('gelabert_favorites', JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
};
