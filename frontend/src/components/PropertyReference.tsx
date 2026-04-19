import React from 'react';
import { cn } from '../lib/utils';

interface PropertyReferenceProps {
  reference: string;
  className?: string;
  variant?: 'outline' | 'solid' | 'minimal';
}

export const PropertyReference: React.FC<PropertyReferenceProps> = ({ 
  reference, 
  className,
  variant = 'solid'
}) => {
  if (!reference) return null;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all duration-300",
      variant === 'solid' && "bg-[#C9A962]/10 border border-[#C9A962]/20 shadow-sm",
      variant === 'outline' && "border border-[#C9A962]/40 bg-transparent",
      variant === 'minimal' && "bg-[#1A1A1A] border border-[#2A2A2A]",
      className
    )}>
      <span className={cn(
        "font-primary text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold",
        "text-[#C9A962]"
      )}>
        REF:
      </span>
      <span className={cn(
        "font-primary text-[10px] md:text-xs font-black tracking-tight",
        "text-[#FAF8F5]"
      )}>
        {reference}
      </span>
    </div>
  );
};
