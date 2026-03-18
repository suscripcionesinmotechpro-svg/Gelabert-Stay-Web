import { useState, useCallback } from 'react';
import { type Property } from '../types/property';

const MAX_COMPARE = 3;

export const useComparator = () => {
  const [compareList, setCompareList] = useState<Property[]>([]);

  const addToCompare = useCallback((property: Property) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === property.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, property];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((id: string) => {
    return compareList.some(p => p.id === id);
  }, [compareList]);

  const canAdd = compareList.length < MAX_COMPARE;

  return { compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, canAdd, maxCompare: MAX_COMPARE };
};
