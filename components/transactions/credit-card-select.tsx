'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import { AlertTriangle } from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface CreditCardSelectProps {
  cards: CreditCardDTO[];
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CreditCardSelect({
  cards,
  value,
  onValueChange,
  placeholder = 'Selecione o cartão',
}: CreditCardSelectProps) {
  return (
    <Select onValueChange={onValueChange} value={value || ''}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {cards.length === 0 && (
          <div className="text-muted-foreground px-2 py-1.5 text-sm">
            Nenhum cartão de crédito vinculado a esta conta.
          </div>
        )}
        <TooltipProvider>
          {cards.map((card) => {
            const isExceeded = card.availableLimit <= 0;
            const isNearLimit = !isExceeded && card.usagePercentage >= 80;

            const label = (
              <div className="flex w-full items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: card.color || '#6366f1' }}
                />
                <span className="flex-1 truncate">{card.account.name}</span>
                {isNearLimit && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {isExceeded ? 'Sem limite' : `${formatCurrency(card.availableLimit)} disp.`}
                </span>
              </div>
            );

            if (isExceeded) {
              return (
                <Tooltip key={card.id}>
                  <TooltipTrigger asChild>
                    <span className="pointer-events-auto block">
                      <SelectItem value={card.id} disabled>
                        {label}
                      </SelectItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Limite do cartão {card.account.name} está esgotado (
                    {formatCurrency(card.usedAmount)} de {formatCurrency(card.limit)} usados) — não
                    é possível selecioná-lo para novas transações.
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <SelectItem key={card.id} value={card.id}>
                {label}
              </SelectItem>
            );
          })}
        </TooltipProvider>
      </SelectContent>
    </Select>
  );
}
