'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { depositToGoal } from '@/lib/actions/goals';
import { formatCurrency } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Plus, Wallet } from 'lucide-react';
import { useState } from 'react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  goalName: string;
  currentAmount?: number;
  targetAmount?: number;
  onDepositSuccess?: (newAmount: number) => void;
}

export function DepositDialog({
  open,
  onOpenChange,
  goalId,
  goalName,
  currentAmount = 0,
  targetAmount = 0,
  onDepositSuccess,
}: DepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('Valor inválido', 'Informe um valor maior que zero');
      return;
    }

    const newAmount = currentAmount + parsedAmount;
    onDepositSuccess?.(newAmount);

    setIsSubmitting(true);

    try {
      const result = await depositToGoal(goalId, parsedAmount);

      if (result.success) {
        showSuccess(
          'Depósito realizado',
          `Valor de ${formatCurrency(parsedAmount)} adicionado à meta "${goalName}"`
        );
        setAmount('');
        onOpenChange(false);
      } else {
        showError('Erro ao depositar', result.error);
      }
    } catch {
      showError('Erro ao depositar', 'Ocorreu um erro ao processar o depósito');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Depositar na Meta
          </DialogTitle>
          <DialogDescription>Adicione um valor para a meta "{goalName}"</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor do Depósito</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2">
                  R$
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting ? (
                'Depositando...'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Depositar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}