"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface CartService {
  id: string;
  titleKey?: string;
  tagKey?: string;
  descKey?: string;
  title: string;
  tag: string;
  icon: ReactNode; // emoji string or JSX element
  desc: string;
}

interface ServiceCartContextType {
  cartItems: CartService[];
  isOpen: boolean;
  addService: (service: CartService) => void;
  removeService: (id: string) => void;
  isInCart: (id: string) => boolean;
  toggleService: (service: CartService) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  count: number;
}

const ServiceCartContext = createContext<ServiceCartContextType | undefined>(undefined);

export const ServiceCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      const existing = prev.find(s => s.id === service.id);
      if (existing) {
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

  return (
    <ServiceCartContext.Provider value={{
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
    }}>
      {children}
    </ServiceCartContext.Provider>
  );
};

export const useServiceCartContext = () => {
  const context = useContext(ServiceCartContext);
  if (context === undefined) {
    throw new Error('useServiceCart must be used within a ServiceCartProvider');
  }
  return context;
};
