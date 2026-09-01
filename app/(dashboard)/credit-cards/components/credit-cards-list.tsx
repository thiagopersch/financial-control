'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListPagination } from '@/components/ui/list-pagination';
import { Progress } from '@/components/ui/progress';
import { useCrudDialogState } from '@/hooks/use-crud-dialog-state';
import { useDeleteConfirm } from '@/hooks/use-delete-confirm';
import { usePersistedPageFilters } from '@/hooks/use-persisted-page-filters';
import { deleteCreditCard } from '@/lib/actions/credit-cards';
import type { AccountDTO } from '@/lib/queries/accounts';
import type { CreditCardDTO } from '@/lib/queries/credit-cards';
import { CreditCard, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CreditCardUsageDialog } from './credit-card-usage-dialog';
import { CreditCardsForm } from './credit-cards-form';
import { CreditCardsHeader } from './credit-cards-header';

const PAGE_SIZE = 10;

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

  useEffect(() => {
    setCreditCards(initialCreditCards);
  }, [initialCreditCards]);

  const {
    selected: selectedCard,
    isFormOpen,
    openCreate,
    openEdit,
    close,
  } = useCrudDialogState<CreditCardDTO>();

  const {
    isOpen: isDeleteOpen,
    requestDelete: handleDelete,
    confirmDelete,
    cancel: cancelDelete,
  } = useDeleteConfirm(deleteCreditCard, {
    successMessage: 'Cartão excluído com sucesso',
    errorMessage: 'Erro ao excluir cartão',
    onSuccess: (id) => setCreditCards((prev) => prev.filter((c) => c.id !== id)),
  });

  const [usageCard, setUsageCard] = useState<CreditCardDTO | null>(null);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  usePersistedPageFilters('credit-cards', { search, accountFilter }, (saved) => {
    if (saved.search !== undefined) setSearch(saved.search);
    if (saved.accountFilter) setAccountFilter(saved.accountFilter);
  });

  const accountOptions = useMemo(() => {
    const map = new Map<string, string>();
    creditCards.forEach((card) => map.set(card.account.id, card.account.name));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [creditCards]);

  const filteredCreditCards = useMemo(() => {
    return creditCards.filter((card) => {
      const matchesSearch = card.account.name.toLowerCase().includes(search.toLowerCase());
      const matchesAccount = accountFilter === 'all' || card.accountId === accountFilter;
      return matchesSearch && matchesAccount;
    });
  }, [creditCards, search, accountFilter]);

  const totalCount = filteredCreditCards.length;
  const paginatedCreditCards = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCreditCards.slice(start, start + pageSize);
  }, [filteredCreditCards, page, pageSize]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    return params;
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleAccountFilterChange = (value: string) => {
    setAccountFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <CreditCardsHeader
        searchParams={searchParams}
        onSearch={handleSearchChange}
        accountFilter={accountFilter}
        onAccountFilterChange={handleAccountFilterChange}
        accountOptions={accountOptions}
        onCreate={openCreate}
        paginationSlotRef={setPaginationSlot}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedCreditCards.map((card) => (
          <Card
            key={card.id}
            className="cursor-pointer overflow-hidden rounded-tl-2xl rounded-bl-2xl border-l-4 transition-all ease-in-out hover:border-l-8 hover:shadow-md"
            style={{ borderLeftColor: card.color || '#6366f1' }}
            onClick={() => openEdit(card)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" style={{ color: card.color || '#6366f1' }} />
                <CardTitle className="text-base font-semibold">{card.account.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => setUsageCard(card)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver consumo do cartão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(card)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(card.id)}
                    className="text-destructive"
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

        {paginatedCreditCards.length === 0 && (
          <div className="bg-muted/30 col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12">
            <div className="bg-background mb-4 rounded-full p-4 shadow-sm">
              <Plus className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium">Nenhum cartão encontrado</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {creditCards.length === 0
                ? 'Comece adicionando seu primeiro cartão.'
                : 'Nenhum cartão corresponde à busca ou filtro selecionado.'}
            </p>
            {creditCards.length === 0 && <Button onClick={openCreate}>Adicionar Cartão</Button>}
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          paginationSlot={paginationSlot}
        />
      )}

      <CreditCardsForm
        isOpen={isFormOpen}
        onClose={close}
        creditCard={selectedCard}
        accounts={accounts}
        onSuccess={() => {
          onRefresh?.();
          close();
        }}
      />

      <CreditCardUsageDialog
        creditCardId={usageCard?.id ?? null}
        cardName={usageCard?.account.name}
        onOpenChange={(open) => !open && setUsageCard(null)}
      />

      <DeleteConfirmModal
        title="Excluir Cartão de Crédito"
        description="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}
