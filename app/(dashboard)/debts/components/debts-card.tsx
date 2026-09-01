'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { DEBT_STATUS_BADGE_VARIANT, DEBT_STATUS_LABELS } from '@/lib/constants/debt-status';
import type { DebtDTO } from '@/lib/queries/debts';
import { AlertTriangle, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface DebtsCardProps {
  debt: DebtDTO;
  onView: (debt: DebtDTO) => void;
  onEdit: (debt: DebtDTO) => void;
  onDelete: (debt: DebtDTO) => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export function DebtsCard({ debt, onView, onEdit, onDelete }: DebtsCardProps) {
  const debtPaid = debt.initialValue - debt.currentValue;
  const debtPercentage = debt.initialValue > 0 ? (debtPaid / debt.initialValue) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`h-5 w-5 ${debt.status === 'ACTIVE' ? 'text-red-500' : 'text-gray-400'}`}
          />
          <CardTitle className="text-lg">{debt.name}</CardTitle>
          <Badge variant={DEBT_STATUS_BADGE_VARIANT[debt.status]}>
            {DEBT_STATUS_LABELS[debt.status]}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(debt)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(debt)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(debt)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(debt.accountName ||
            debt.supplierName ||
            debt.categoryName ||
            debt.paymentMethodName) && (
            <div className="text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-1 border-b pb-2 text-xs">
              {debt.accountName && (
                <span>
                  Conta: <span className="text-foreground font-medium">{debt.accountName}</span>
                </span>
              )}
              {debt.supplierName && (
                <span>
                  Fornecedor:{' '}
                  <span className="text-foreground font-medium">{debt.supplierName}</span>
                </span>
              )}
              {debt.categoryName && (
                <span>
                  Categoria:{' '}
                  <span className="text-foreground font-medium">{debt.categoryName}</span>
                </span>
              )}
              {debt.paymentMethodName && (
                <span>
                  Pagamento:{' '}
                  <span className="text-foreground font-medium">{debt.paymentMethodName}</span>
                </span>
              )}
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-medium">{formatCurrency(debt.initialValue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Falta Pagar:</span>
            <span className="font-medium text-red-500">{formatCurrency(debt.currentValue)}</span>
          </div>
          {debt.interestRate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Juros:</span>
              <span className="font-medium">{debt.interestRate}%</span>
            </div>
          )}
          {debt.installments && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcelas:</span>
              <span className="font-medium">
                {debt.installments - (debt.remainingInstallments ?? debt.installments)}/
                {debt.installments} pagas (
                {debt.calculationType === 'FIXED_INSTALLMENT' ? 'valor fixo' : 'dividido'})
              </span>
            </div>
          )}
          {debt.installmentValue && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor da Parcela:</span>
              <span className="font-medium">{formatCurrency(debt.installmentValue)}</span>
            </div>
          )}
          {debt.dueDay && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vencimento:</span>
              <span className="font-medium">Dia {debt.dueDay}</span>
            </div>
          )}
          <Progress value={debtPercentage} className="mt-2" />
          <p className="text-muted-foreground text-right text-xs">
            {debtPercentage.toFixed(1)}% pago
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
