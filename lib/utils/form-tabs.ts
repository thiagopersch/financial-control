import type { FieldErrors, FieldValues } from 'react-hook-form';

/** Campos de cada aba de um formulário, na ordem em que aparecem. */
export type TabFieldMap<Tab extends string> = Record<Tab, readonly string[]>;

function hasError(errors: FieldErrors<FieldValues>, field: string) {
  return !!errors[field];
}

/** Abas que contêm pelo menos um campo com erro. */
export function getTabsWithErrors<Tab extends string>(
  errors: FieldErrors<FieldValues>,
  tabFields: TabFieldMap<Tab>,
): Set<Tab> {
  const result = new Set<Tab>();
  for (const tab of Object.keys(tabFields) as Tab[]) {
    if (tabFields[tab].some((field) => hasError(errors, field))) result.add(tab);
  }
  return result;
}

/** Primeira aba (na ordem das abas) com campo inválido. */
export function findFirstTabWithError<Tab extends string>(
  errors: FieldErrors<FieldValues>,
  tabFields: TabFieldMap<Tab>,
  tabOrder: readonly Tab[],
): Tab | null {
  return tabOrder.find((tab) => tabFields[tab].some((field) => hasError(errors, field))) ?? null;
}

/** Rótulos dos campos inválidos, na ordem das abas e dos campos dentro de cada aba. */
export function getInvalidFieldLabels<Tab extends string>(
  errors: FieldErrors<FieldValues>,
  tabFields: TabFieldMap<Tab>,
  tabOrder: readonly Tab[],
  labels: Record<string, string>,
): string[] {
  const ordered = tabOrder.flatMap((tab) => tabFields[tab]);
  const extra = Object.keys(errors).filter((field) => !ordered.includes(field));
  return [...ordered, ...extra]
    .filter((field) => hasError(errors, field))
    .map((field) => labels[field] ?? field);
}

/**
 * Foca o primeiro controle inválido da aba ativa. Usa o `aria-invalid` que o
 * `FormControl` aplica, então funciona para inputs, selects e comboboxes.
 * Roda no próximo frame para dar tempo da aba recém-ativada ficar visível.
 */
export function focusFirstInvalidField(container?: HTMLElement | null) {
  requestAnimationFrame(() => {
    const root = container ?? document;
    const panel = root.querySelector<HTMLElement>('[role="tabpanel"][data-state="active"]') ?? root;
    const target = panel.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!target) return;
    const focusable = target.matches('input, textarea, button, [tabindex]')
      ? target
      : (target.querySelector<HTMLElement>('input, textarea, button, [tabindex]') ?? target);
    focusable.focus({ preventScroll: true });
    focusable.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
