'use client';

import { createContext, startTransition, useContext, useTransition, type ReactNode } from 'react';

interface PeriodTransitionContextValue {
  /** `true` enquanto a navegação disparada pela troca de período ainda não terminou. */
  isPending: boolean;
  startPeriodTransition: (callback: () => void) => void;
}

const PeriodTransitionContext = createContext<PeriodTransitionContextValue>({
  isPending: false,
  startPeriodTransition: startTransition,
});

/**
 * Compartilha o estado pendente da troca de período (MonthSelector) com os componentes
 * da página. O `router.push` roda dentro de uma transition: o Next mantém a tela antiga
 * enquanto o servidor refaz as queries, e `isPending` alimenta os overlays de loading.
 */
export function PeriodTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startPeriodTransition] = useTransition();

  return (
    <PeriodTransitionContext.Provider value={{ isPending, startPeriodTransition }}>
      {children}
    </PeriodTransitionContext.Provider>
  );
}

export function usePeriodTransition() {
  return useContext(PeriodTransitionContext);
}
