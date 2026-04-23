'use client';

import { ActionsAccounts } from '@/app/(dashboard)/accounts/components/actions';
import { NotFoundAccounts } from '@/app/(dashboard)/accounts/components/not-found';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { deleteAccount } from '@/lib/actions/accounts';
import type { AccountDTO } from '@/lib/queries/accounts';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Building2, Coins, CreditCard, Landmark, TrendingUp, Wallet2 } from 'lucide-react';
import { useState } from 'react';
import { AccountsForm } from './accounts-form';
import { AccountsHeader } from './accounts-header';

interface AccountsListProps {
  accounts: AccountDTO[];
  onRefresh: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  BANK: Building2,
  WALLET: Wallet2,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: Landmark,
  PIX: Coins,
  INVESTMENT: TrendingUp,
  CRYPTO: Coins,
  OTHERS: Wallet2,
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

      {accounts.length === 0 && <NotFoundAccounts openCreate={openCreate} />}

      {accounts.length > 0 && (
        <ActionsAccounts
          accounts={accounts}
          openEdit={openEdit}
          handleDelete={handleDelete}
          typeIcons={typeIcons}
          typeLabels={typeLabels}
        />
      )}

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
