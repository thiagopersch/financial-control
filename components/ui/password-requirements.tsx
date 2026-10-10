'use client';

import { cn } from '@/lib/utils';
import { getPasswordChecklist } from '@/lib/validations/password';
import { Check, X } from 'lucide-react';

/** Checklist visual da regra de senha, atualizado conforme o usuário digita. */
export function PasswordRequirements({ value, className }: { value: string; className?: string }) {
  return (
    <ul className={cn('grid gap-1 text-xs sm:grid-cols-2', className)} aria-live="polite">
      {getPasswordChecklist(value ?? '').map((item) => (
        <li
          key={item.key}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            item.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {item.met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          {item.label}
        </li>
      ))}
    </ul>
  );
}
