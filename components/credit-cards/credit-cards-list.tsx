"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { deleteCreditCard, getCreditCards } from "@/lib/actions/credit-cards";
import { getCreditCards as getCreditCardsQuery } from "@/lib/queries/credit-cards";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCardModal } from "./credit-card-modal";

interface Account {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  month: number;
  year: number;
  amount: number;
  dueDate: string | null;
  status: string;
}

interface CreditCardData {
  id: string;
  limit: number;
  usedAmount: number;
  availableLimit: number;
  usagePercentage: number;
  closingDay: number;
  dueDay: number;
  color: string | null;
  accountId: string;
  account: Account;
  invoices: Invoice[];
}

interface CreditCardsListProps {
  creditCards: CreditCardData[];
  accounts: Account[];
}

export function CreditCardsList({ creditCards: initialCreditCards, accounts }: CreditCardsListProps) {
  const [creditCards, setCreditCards] = useState(initialCreditCards);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setCardToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (cardToDelete) {
      const result = await deleteCreditCard(cardToDelete);
      if (result.success) {
        toast.success("Cartão excluído com sucesso", {
          position: "bottom-center",
          richColors: true,
        });
        setCreditCards((prev) => prev.filter((c) => c.id !== cardToDelete));
      } else {
        toast.error(result.error || "Erro ao excluir cartão", {
          position: "bottom-center",
          richColors: true,
        });
      }
      setIsDeleteModalOpen(false);
      setCardToDelete(null);
    }
  };

  const openEditModal = (card: CreditCardData) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedCard(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handleSuccess = async () => {
    const cards = await getCreditCardsQuery();
    setCreditCards(cards);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-yellow-500">Aberta</Badge>;
      case "CLOSED":
        return <Badge className="bg-blue-500">Fechada</Badge>;
      case "PAID":
        return <Badge className="bg-green-500">Paga</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-muted-foreground">Gerencie seus cartões de crédito e faturas</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Nenhum cartão cadastrado</h3>
            <p className="text-muted-foreground mt-2 text-center">
              Cadastre seu primeiro cartão de crédito para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map((card) => (
            <Card key={card.id} style={{ borderTopColor: card.color || '#6366f1', borderTopWidth: 4 }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" style={{ color: card.color || '#6366f1' }} />
                  <CardTitle className="text-lg">{card.account?.name || "Cartão"}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditModal(card)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(card.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Limite Utilizado</span>
                    <span className="font-medium">{card.usagePercentage.toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={card.usagePercentage}
                    className={`h-2 ${getUsageColor(card.usagePercentage)}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Limite</p>
                    <p className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {card.limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Disponível</p>
                    <p className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-4 w-4" />
                      {card.availableLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Fechamento: dia {card.closingDay}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Vencimento: dia {card.dueDay}</span>
                  </div>
                </div>
                {card.invoices.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="mb-2 text-sm font-medium">Faturas Recentes</p>
                    <div className="space-y-2">
                      {card.invoices.slice(0, 3).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between text-sm">
                          <span>
                            {invoice.month}/{invoice.year}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              R${" "}
                              {Number(invoice.amount).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreditCardModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        creditCard={selectedCard ? {
          id: selectedCard.id,
          limit: String(selectedCard.limit),
          closingDay: selectedCard.closingDay,
          dueDay: selectedCard.dueDay,
          accountId: selectedCard.accountId,
          color: selectedCard.color || '#6366f1',
          account: selectedCard.account,
        } : undefined}
        accounts={accounts}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Cartão"
        description="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
    </div>
  );
}