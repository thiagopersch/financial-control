'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { showError, showSuccess } from '@/lib/utils/toast';
import {
  Building2,
  Coins,
  CreditCard,
  Landmark,
  MoreHorizontal,
  PencilIcon,
  Plus,
  TrashIcon,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { AccountModal } from './account-modal';

interface AccountsListProps {
  accounts: any[];
}

const typeIcons: Record<string, any> = {
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

export function AccountsList({ accounts }: AccountsListProps) {
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (accountToDelete) {
      const result = await deleteAccount(accountToDelete);
      if (result.success) {
        showSuccess('Conta excluída com sucesso');
      } else {
        showError(result.error || 'Erro ao excluir conta');
      }
      setIsDeleteModalOpen(false);
      setAccountToDelete(null);
    }
  };

  const openEditModal = (account: any) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedAccount(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suas Contas</h2>
          <p className="text-muted-foreground">
            Gerencie seus bancos, carteiras e cartões em um só lugar.
          </p>
        </div>
        <Button onClick={openCreateModal} className="h-10">
          <Plus className="mr-2 h-4 w-4" /> Nova Conta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          const Icon = typeIcons[account.type] || Wallet;
          return (
            <Card
              key={account.id}
              className="cursor-pointer overflow-hidden border-l-4 transition-all hover:shadow-md"
              style={{ borderLeftColor: account.color || '#000000' }}
              onClick={() => openEditModal(account)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-muted rounded-lg p-2">
                    <Icon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {typeLabels[account.type]}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditModal(account)}>
                      <PencilIcon className="mr-2 h-4 w-4" />
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
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <span className="text-muted-foreground block text-xs">Saldo</span>
                  <span className="text-muted-foreground text-sm">Calculado via transações</span>
                </div>
              </CardContent>
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
            <Button onClick={openCreateModal}>Adicionar Conta</Button>
          </div>
        )}
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        account={selectedAccount}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Conta"
        description="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
    </div>
  );
}
