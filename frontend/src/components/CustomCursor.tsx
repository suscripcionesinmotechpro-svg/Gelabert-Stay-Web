"use client";

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const CustomCursor = () => {
  const { i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [cursorType, setCursorType] = useState<'default' | 'ver' | 'pointer'>('default');

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

      // Detect hover states by inspecting closest data-cursor attributes
      const target = e.target as HTMLElement | null;
      if (!target) return;

      let nextType: 'default' | 'ver' | 'pointer' = 'default';
      const cursorEl = target.closest('[data-cursor]');
      if (cursorEl) {
        const type = cursorEl.getAttribute('data-cursor');
        if (type === 'ver') {
          nextType = 'ver';
        }
      } else if (target.closest('a, button, input[type="submit"], input[type="button"], select, [role="button"]')) {
        nextType = 'pointer';
      }

      // Prevent redundant state updates & unnecessary re-renders
      setCursorType((prev) => (prev !== nextType ? nextType : prev));
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Apply global CSS class to body to hide standard cursor on desktop
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
        className="fixed rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-primary text-[10px] font-bold tracking-[0.2em] uppercase text-[#0A0A0A] bg-transparent border border-[#C9A962]/60"
        style={{ x: cursorX, y: cursorY }}
        animate={{
          width: cursorType === 'ver' ? 76 : cursorType === 'pointer' ? 36 : 24,
          height: cursorType === 'ver' ? 76 : cursorType === 'pointer' ? 36 : 24,
          backgroundColor: cursorType === 'ver' ? 'rgba(201, 169, 98, 0.95)' : 'rgba(201, 169, 98, 0)',
          borderColor: cursorType === 'ver' ? 'rgba(201, 169, 98, 0.95)' : 'rgba(201, 169, 98, 0.6)',
          boxShadow: cursorType === 'ver' ? '0 0 24px rgba(201, 169, 98, 0.45)' : 'none',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.1 }}
      >
        {cursorType === 'ver' && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            {i18n.language.startsWith('en') ? 'VIEW' : 'VER'}
          </motion.span>
        )}
      </motion.div>
    </div>
  );
};
