import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface CartService {
  id: string;
  title: string;
  tag: string;
  icon: ReactNode; // emoji string or JSX element
  desc: string;
}

export const useServiceCart = () => {
  const [cartItems, setCartItems] = useState<CartService[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addService = useCallback((service: CartService) => {
    setCartItems(prev => {
      if (prev.find(s => s.id === service.id)) return prev;
      return [...prev, service];
    });
  }, []);

  const removeService = useCallback((id: string) => {
    setCartItems(prev => prev.filter(s => s.id !== id));
  }, []);

  const isInCart = useCallback((id: string) => {
    return cartItems.some(s => s.id === id);
  }, [cartItems]);

  const toggleService = useCallback((service: CartService) => {
    setCartItems(prev => {
      if (prev.find(s => s.id === service.id)) {
        return prev.filter(s => s.id !== service.id);
      }
      return [...prev, service];
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return {
    cartItems,
    isOpen,
    addService,
    removeService,
    isInCart,
    toggleService,
    clearCart,
    openCart,
    closeCart,
    count: cartItems.length,
  };
};
