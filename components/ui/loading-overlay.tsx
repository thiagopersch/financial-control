'use client';

import { usePeriodTransition } from '@/components/period-transition';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

const LOADING_TEXT = 'Buscando informações...';

interface LoadingOverlayProps {
  loading: boolean;
  /** `sm`: só o spinner (cards de número). `md`: spinner + texto (gráficos, tabelas, listas). */
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

/**
 * Mantém o conteúdo atual visível (esmaecido) e sobrepõe um indicador de carregamento
 * enquanto `loading` for verdadeiro.
 */
export function LoadingOverlay({ loading, size = 'md', children, className }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)} aria-busy={loading}>
      {children}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            role="status"
            className="bg-background/60 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] backdrop-blur-[1px]"
          >
            {size === 'sm' ? (
              <>
                <Spinner className="text-primary size-5" role="presentation" aria-hidden />
                <span className="sr-only">{LOADING_TEXT}</span>
              </>
            ) : (
              <>
                <Spinner className="text-primary size-6" role="presentation" aria-hidden />
                <span className="text-muted-foreground text-sm font-medium">{LOADING_TEXT}</span>
              </>
            )}
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
