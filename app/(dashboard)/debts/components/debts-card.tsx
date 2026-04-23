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
import type { DebtDTO } from '@/lib/queries/debts';
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface DebtsCardProps {
  debt: DebtDTO;
  onEdit: (debt: DebtDTO) => void;
  onDelete: (debt: DebtDTO) => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export function DebtsCard({ debt, onEdit, onDelete }: DebtsCardProps) {
  const debtPaid = debt.initialValue - debt.currentValue;
  const debtPercentage = debt.initialValue > 0 ? (debtPaid / debt.initialValue) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`h-5 w-5 ${debt.isActive ? 'text-red-500' : 'text-gray-400'}`}
          />
          <CardTitle className="text-lg">{debt.name}</CardTitle>
          <Badge variant={debt.isActive ? 'default' : 'secondary'}>
            {debt.isActive ? 'Ativa' : 'Quitada'}
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
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor Original:</span>
            <span className="font-medium">{formatCurrency(debt.initialValue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor Atual:</span>
            <span className="font-medium text-red-500">{formatCurrency(debt.currentValue)}</span>
          </div>
          {debt.interestRate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Juros:</span>
              <span className="font-medium">{debt.interestRate}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pagamento Mínimo:</span>
            <span className="font-medium">{formatCurrency(debt.minimumPayment)}</span>
          </div>
          {debt.installments && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcelas:</span>
              <span className="font-medium">
                {debt.installments}x (
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
          <Progress value={debtPercentage} className="mt-2" />
          <p className="text-muted-foreground text-right text-xs">
            {debtPercentage.toFixed(1)}% pago
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
