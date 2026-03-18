import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ 
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={cn(
        "bg-[#1A1A1A] rounded-md overflow-hidden relative",
        className
      )}
    >
      <motion.div 
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A962]/5 to-transparent skew-x-[-20deg]"
      />
    </motion.div>
  );
};

export const PropertyCardSkeleton = () => (
  <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl overflow-hidden h-full flex flex-col">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="pt-6 border-t border-[#1F1F1F]">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);
