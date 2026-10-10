'use client';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateTransactionStatus } from '@/lib/actions/transactions';
import type { DebtTransactionDTO } from '@/lib/queries/transactions';
import { cn } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/utils/toast';
import { TransactionStatus } from '@prisma/client';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useTransition } from 'react';

const STATUS_MAP: Record<TransactionStatus, { label: string; className: string }> = {
  PAID: {
    label: 'Pago',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PENDING: {
    label: 'Pendente',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  OVERDUE: {
    label: 'Atrasado',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

const STATUS_OPTIONS: TransactionStatus[] = [
  TransactionStatus.PENDING,
  TransactionStatus.PAID,
  TransactionStatus.OVERDUE,
];

interface InstallmentStatusMenuProps {
  transaction: DebtTransactionDTO;
}

export function InstallmentStatusMenu({ transaction }: InstallmentStatusMenuProps) {
  const [isPending, startTransition] = useTransition();
  const { status } = transaction;

  const handleChange = (value: string) => {
    const nextStatus = value as TransactionStatus;
    if (nextStatus === status) return;

    startTransition(async () => {
      try {
        const result = await updateTransactionStatus(transaction.id, nextStatus);
        if (result.success) {
          showSuccess(
            'Status atualizado',
            result.movedToCurrentMonth
              ? `Parcela marcada como ${STATUS_MAP[nextStatus].label.toLowerCase()} e movida para o mês vigente.`
              : `Parcela marcada como ${STATUS_MAP[nextStatus].label.toLowerCase()}.`,
          );
        } else {
          showError(
            'Erro ao atualizar status',
            result.error || 'Não foi possível atualizar o status',
          );
        }
      } catch {
        showError('Erro inesperado', 'Não foi possível atualizar o status da parcela.');
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          type="button"
          className="cursor-pointer rounded-md disabled:cursor-wait disabled:opacity-70"
          aria-label="Alterar status da parcela"
        >
          <Badge
            variant="secondary"
            className={cn('gap-1 border-none', STATUS_MAP[status].className)}
          >
            {STATUS_MAP[status].label}
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-36">
        <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={status} onValueChange={handleChange}>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {STATUS_MAP[option].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
