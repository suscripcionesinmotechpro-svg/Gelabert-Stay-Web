import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const PropertySkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn(
      "h-full flex flex-col bg-[#0D0D0D] border border-[#1F1F1F] overflow-hidden relative rounded-2xl",
      className
    )}>
      {/* Image Skeleton */}
      <div className="relative aspect-[4/3] bg-white/[0.03] overflow-hidden">
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
        />
        
        {/* Overlay Footer Skeleton */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-black/20 backdrop-blur-md border-t border-white/5 flex items-center justify-between">
          <div className="h-6 w-24 bg-white/5 rounded-md" />
          <div className="h-8 w-8 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-3/4 bg-white/5 rounded-md" />
          <div className="h-3 w-1/3 bg-white/5 rounded-md" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded-md" />
          <div className="h-3 w-5/6 bg-white/5 rounded-md" />
        </div>

        {/* Features Skeleton */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-3 w-12 bg-white/5 rounded-md" />
          <div className="h-3 w-12 bg-white/5 rounded-md" />
          <div className="h-3 w-12 bg-white/5 rounded-md" />
        </div>

        {/* Footer Skeleton */}
        <div className="mt-auto pt-4 border-t border-[#1F1F1F] flex justify-between items-center">
          <div className="h-3 w-20 bg-white/5 rounded-md" />
          <div className="h-6 w-16 bg-white/5 rounded-sm" />
        </div>
      </div>
    </div>
  );
};
