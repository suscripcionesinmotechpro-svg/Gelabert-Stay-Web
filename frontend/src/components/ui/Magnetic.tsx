"use client";

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const Magnetic = ({ children, strength = 0.35, className }: MagneticProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHoverSupported, setIsHoverSupported] = useState(false);

  useEffect(() => {
    // Check if hover is supported on current client device
    const supportsHover = !window.matchMedia('(hover: none)').matches;
    setIsHoverSupported(supportsHover);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHoverSupported || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Calculate distance from center of the wrapped element
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    setPosition({ x: distanceX * strength, y: distanceY * strength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 180, damping: 15, mass: 0.1 }}
      className={className}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
};
