'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreditCardUsage } from '@/lib/queries/credit-cards-client';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  OVERDUE: 'Atrasada',
  PAID: 'Paga',
};

const STATUS_VARIANT: Record<string, 'secondary' | 'destructive' | 'default'> = {
  PENDING: 'secondary',
  OVERDUE: 'destructive',
  PAID: 'default',
};

interface CreditCardUsageDialogProps {
  creditCardId: string | null;
  cardName?: string;
  onOpenChange: (open: boolean) => void;
}

export function CreditCardUsageDialog({
  creditCardId,
  cardName,
  onOpenChange,
}: CreditCardUsageDialogProps) {
  const { items, isLoading } = useCreditCardUsage(creditCardId);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={!!creditCardId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Consumo do cartão{cardName ? ` — ${cardName}` : ''}</DialogTitle>
          <DialogDescription>
            Transações e parcelas de dívida que ainda estão consumindo o limite na competência
            atual.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhuma transação ou parcela consumindo o limite neste momento.
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.description}</span>
                          {item.debtName && (
                            <span className="text-muted-foreground text-xs">
                              Dívida: {item.debtName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[item.status] || 'secondary'}>
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm font-semibold">
                <span>Total consumido no mês</span>
                <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
