'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { deleteCreditCard } from '@/lib/actions/credit-cards';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import { showError, showSuccess } from '@/lib/utils/toast';
import { CreditCard, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreditCardsForm } from './credit-cards-form';
import { CreditCardsHeader } from './credit-cards-header';

interface CreditCardsListProps {
  creditCards: CreditCardDTO[];
  accounts: AccountDTO[];
  onRefresh?: () => void;
}

export function CreditCardsList({
  creditCards: initialCreditCards,
  accounts,
  onRefresh,
}: CreditCardsListProps) {
  const [creditCards, setCreditCards] = useState<CreditCardDTO[]>(initialCreditCards);
  const [selectedCard, setSelectedCard] = useState<CreditCardDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setCardToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (cardToDelete) {
      const result = await deleteCreditCard(cardToDelete);
      if (result.success) {
        showSuccess('Cartão excluído com sucesso');
        setCreditCards((prev) => prev.filter((c) => c.id !== cardToDelete));
      } else {
        showError(result.error || 'Erro ao excluir cartão');
      }
      setIsDeleteOpen(false);
      setCardToDelete(null);
    }
  };

  const openCreate = () => {
    setSelectedCard(null);
    setIsFormOpen(true);
  };

  const openEdit = (card: CreditCardDTO) => {
    setSelectedCard(card);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <CreditCardsHeader onCreate={openCreate} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {creditCards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" style={{ color: card.color || '#6366f1' }} />
                <CardTitle className="text-base font-semibold">{card.account.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => openEdit(card)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(card.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Limite disponível</span>
                  <span className="font-semibold">
                    R$ {card.availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Progress value={card.usagePercentage} className="h-2" />
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    Usado: R${' '}
                    {card.usedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span>
                    Total: R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-muted-foreground">Fechamento: dia {card.closingDay}</span>
                  <span className="text-muted-foreground">Vencimento: dia {card.dueDay}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {creditCards.length === 0 && (
          <div className="bg-muted/30 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
            <div className="bg-background mb-4 rounded-full p-4 shadow-sm">
              <Plus className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium">Nenhum cartão encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando seu primeiro cartão de crédito.
            </p>
            <Button onClick={openCreate}>Adicionar Cartão</Button>
          </div>
        )}
      </div>

      <CreditCardsForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        creditCard={selectedCard}
        accounts={accounts}
        onSuccess={() => {
          onRefresh?.();
          setIsFormOpen(false);
        }}
      />

      <DeleteConfirmModal
        title="Excluir Cartão de Crédito"
        description="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
