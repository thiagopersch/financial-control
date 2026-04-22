'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteAccount } from '@/lib/actions/accounts';
import type { AccountDTO } from '@/lib/queries/accounts';
import { showError, showSuccess } from '@/lib/utils/toast';
import {
  Building2,
  Coins,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { AccountsForm } from './accounts-form';
import { AccountsHeader } from './accounts-header';

interface AccountsListProps {
  accounts: AccountDTO[];
  onRefresh: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  BANK: Building2,
  WALLET: Wallet,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: Landmark,
  PIX: Coins,
  INVESTMENT: TrendingUp,
  CRYPTO: Coins,
  OTHERS: Wallet,
};

const typeLabels: Record<string, string> = {
  BANK: 'Banco',
  WALLET: 'Carteira',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Débito',
  PIX: 'PIX',
  INVESTMENT: 'Investimento',
  CRYPTO: 'Cripto',
  OTHERS: 'Outros',
};

export function AccountsList({ accounts, onRefresh }: AccountsListProps) {
  const [selectedAccount, setSelectedAccount] = useState<AccountDTO | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (accountToDelete) {
      const result = await deleteAccount(accountToDelete);
      if (result.success) {
        showSuccess('Conta excluída com sucesso!');
        onRefresh();
      } else {
        showError('Erro ao excluir conta', result.error || 'Não foi possível excluir a conta!');
      }
      setIsDeleteOpen(false);
      setAccountToDelete(null);
    }
  };

  const openCreate = () => {
    setSelectedAccount(null);
    setIsFormOpen(true);
  };

  const openEdit = (account: AccountDTO) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <AccountsHeader onCreate={openCreate} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accounts.map((account) => {
          const Icon = typeIcons[account.type] || Wallet;
          const label = typeLabels[account.type] || 'Outro';

          return (
            <Card
              key={account.id}
              className="cursor-pointer overflow-hidden rounded-tl-2xl rounded-bl-2xl border-l-4 transition-all ease-in-out hover:border-l-8 hover:shadow-md"
              style={{ borderLeftColor: account.color || '#000000' }}
              onClick={() => openEdit(account)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-muted rounded-lg p-2">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                    <CardDescription className="text-xs">{label}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEdit(account)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(account.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <div className="bg-muted/30 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
            <div className="bg-background mb-4 rounded-full p-4 shadow-sm">
              <Plus className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece adicionando sua primeira conta de banco ou carteira.
            </p>
            <Button onClick={openCreate}>Adicionar Conta</Button>
          </div>
        )}
      </div>

      <AccountsForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        account={selectedAccount}
        onSuccess={() => {
          onRefresh();
          setIsFormOpen(false);
        }}
      />

      <DeleteConfirmModal
        title="Exclusão de sua conta bancária"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
