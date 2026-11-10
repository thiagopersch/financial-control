'use client';

import { usePeriodTransition } from '@/components/period-transition';
import { cn } from '@/lib/utils';
import Skeleton from '@mui/material/Skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

const LOADING_TEXT = 'Buscando informações...';

interface LoadingOverlayProps {
  loading: boolean;
  /** Mantido por compatibilidade: o skeleton sempre ocupa o tamanho do conteúdo. */
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

/**
 * Enquanto `loading`, troca visualmente o conteúdo por um skeleton do mesmo
 * tamanho (o layout não pula) — o conteúdo antigo continua montado por baixo.
 */
export function LoadingOverlay({ loading, children, className }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)} aria-busy={loading}>
      <div style={{ visibility: loading ? 'hidden' : 'visible', height: '100%' }}>{children}</div>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="status"
            className="absolute inset-0 z-10"
          >
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{ width: '100%', height: '100%', transform: 'none', borderRadius: 'inherit' }}
            />
            <span className="sr-only">{LOADING_TEXT}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** `LoadingOverlay` ligado à troca de período do MonthSelector. */
export function PeriodLoading(props: Omit<LoadingOverlayProps, 'loading'>) {
  const { isPending } = usePeriodTransition();
  return <LoadingOverlay loading={isPending} {...props} />;
}
