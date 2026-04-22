'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function CardLoginRegisters({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] animate-pulse rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] h-[50%] w-[50%] animate-pulse rounded-full bg-cyan-600/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[30%] w-[30%] animate-pulse rounded-full bg-purple-600/20 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        }}
        key={pathname}
        className="relative z-10 w-full max-w-md"
      >
        {children}
      </motion.div>

      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}
