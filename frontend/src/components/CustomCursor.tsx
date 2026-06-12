"use client";

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorType, setCursorType] = useState<'default' | 'pointer'>('default');

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Trailing spring configurations for smooth but responsive ring tracking (snapped up for instant feel)
  const springConfig = { stiffness: 850, damping: 42, mass: 0.04 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check if device supports hover (only show custom cursor on desktop)
    const isHoverSupported = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isHoverSupported) return;

    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      let nextType: 'default' | 'pointer' = 'default';
      if (
        target.closest('a, button, input[type="submit"], input[type="button"], select, [role="button"], [data-cursor]')
      ) {
        nextType = 'pointer';
      }

      setCursorType(nextType);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Apply global CSS class to body to hide standard cursor on desktop
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Tiny solid golden center dot - instant raw tracking for perfect responsive feel */}
      <motion.div
        className="fixed w-1.5 h-1.5 rounded-full bg-[#C9A962] -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ x: mouseX, y: mouseY }}
      />

      {/* Trailing blurred/expanded circle */}
      <motion.div
        className="fixed w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-[background-color,border-color,box-shadow] duration-200 pointer-events-none"
        style={{
          x: cursorX,
          y: cursorY,
          backgroundColor: 'transparent',
          borderColor: 'rgba(201, 169, 98, 0.6)',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          boxShadow: 'none',
        }}
        animate={{
          scale: cursorType === 'pointer' ? 1.5 : 1,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.1 }}
      />
    </div>
  );
};
