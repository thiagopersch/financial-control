import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  // Round to cents first so values like -0.001 (float rounding noise) or -0
  // don't render as "-R$ 0,00" for what is effectively a zero amount.
  const rounded = Math.round(value * 100) / 100;
  const normalized = rounded === 0 ? 0 : rounded;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(normalized);
}
