import { motion } from 'framer-motion';

export const PageLoading = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A]">
      <div className="relative w-48 h-1 bg-white/5 overflow-hidden rounded-full">
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A962] to-transparent"
        />
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 font-primary text-[10px] uppercase tracking-[0.3em] text-[#C9A962]"
      >
        Gelabert Homes
      </motion.p>
    </div>
  );
};
