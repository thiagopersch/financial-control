'use client';

import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ComponentProps, ReactNode } from 'react';

export interface FormTabDefinition<Tab extends string> {
  value: Tab;
  label: string;
  icon?: ReactNode;
}

interface FormTabsListProps<Tab extends string> {
  tabs: readonly FormTabDefinition<Tab>[];
  /** Abas com campos inválidos recebem um marcador vermelho. */
  errorTabs?: Set<Tab>;
  className?: string;
}

/** Lista de abas de formulário com indicador de erro por aba (rola na horizontal no mobile). */
export function FormTabsList<Tab extends string>({
  tabs,
  errorTabs,
  className,
}: FormTabsListProps<Tab>) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <TabsList className={cn('w-full min-w-max sm:min-w-0', className)}>
        {tabs.map((tab) => {
          const hasError = errorTabs?.has(tab.value);
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn('px-3', hasError && 'text-destructive dark:text-destructive')}
              aria-invalid={hasError || undefined}
            >
              {tab.icon}
              {tab.label}
              {hasError && (
                <span
                  className="bg-destructive size-1.5 rounded-full"
                  aria-label="Campos pendentes"
                />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}

/**
 * Conteúdo de aba sempre montado (escondido quando inativo): os campos continuam
 * registrados no formulário, então valores e validação não se perdem ao trocar de aba.
 */
export function FormTabContent({
  className,
  children,
  ...props
}: ComponentProps<typeof TabsContent> & { children: ReactNode }) {
  return (
    <TabsContent
      forceMount
      className={cn('flex flex-col gap-4 pt-2 data-[state=inactive]:hidden', className)}
      {...props}
    >
      {children}
    </TabsContent>
  );
}
