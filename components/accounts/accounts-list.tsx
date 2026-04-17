"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, Wallet, Building2, CreditCard, Landmark, Coins, TrendingUp } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AccountType } from "@prisma/client";
import { useState } from "react";
import { AccountModal } from "./account-modal";
import { deleteAccount } from "@/lib/actions/accounts";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

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
  BANK: "Banco",
  WALLET: "Carteira",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Débito",
  PIX: "PIX",
  INVESTMENT: "Investimento",
  CRYPTO: "Cripto",
  OTHERS: "Outros",
};

export function AccountsList({ accounts }: AccountsListProps) {
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir esta conta?")) {
      const result = await deleteAccount(id);
      if (result.success) {
        toast.success("Conta excluída com sucesso");
      } else {
        toast.error(result.error);
      }
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
            <Card key={account.id} className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: account.color || "#000000" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                    <CardDescription className="text-xs">{typeLabels[account.type]}</CardDescription>
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
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(account.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="mt-4">
                  <span className="text-xs text-muted-foreground block">Saldo Atual</span>
                  <div className={`text-2xl font-bold ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30">
            <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando sua primeira conta de banco ou carteira.</p>
            <Button onClick={openCreateModal}>Adicionar Conta</Button>
          </div>
        )}
      </div>

      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        account={selectedAccount} 
      />
    </div>
  );
}
