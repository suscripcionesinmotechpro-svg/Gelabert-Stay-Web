"use client";

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PremiumImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'cover' | 'contain';
}

export function PremiumImage({
  src,
  alt,
  className,
  wrapperClassName,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  objectFit = 'cover'
}: PremiumImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Fallback for missing/empty image URLs
  const imageSrc = src || '/images/placeholder.jpg';

  return (
    <div className={cn('relative overflow-hidden w-full h-full', wrapperClassName)}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-[#161616] animate-pulse z-10"
          />
        )}
      </AnimatePresence>

      <Image
        src={imageSrc}
        alt={alt || 'Gelabert Homes Property'}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        style={{ objectFit }}
        className={cn(
          'transition-all duration-1000 ease-in-out',
          isLoaded && !error ? 'opacity-100 scale-100' : 'opacity-0 scale-110',
          className
        )}
      />
    </div>
  );
}
