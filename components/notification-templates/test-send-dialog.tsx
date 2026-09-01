'use client';

import { AsyncSelectSearch } from '@/components/ui/async-select-search';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SelectSearch, type SelectSearchOption } from '@/components/ui/select-search';
import { sendTestNotificationTemplate } from '@/lib/actions/notification-template-test-send';
import {
  detectTemplateEntityPages,
  VARIABLE_CATALOG,
} from '@/lib/notification-templates/variable-catalog';
import { useAccounts } from '@/lib/queries/accounts-client';
import { useBudgets } from '@/lib/queries/budgets-client';
import { useCreditCards } from '@/lib/queries/credit-cards-client';
import { useDebts } from '@/lib/queries/debts-client';
import { useGoals } from '@/lib/queries/goals-client';
import type { NotificationTemplateDTO } from '@/lib/queries/notification-templates';
import { usePaymentMethods } from '@/lib/queries/payment-methods-client';
import type { WorkspaceUserOption } from '@/lib/queries/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Loader2, Send } from 'lucide-react';
import { useMemo, useState } from 'react';

interface TestSendDialogProps {
  template: NotificationTemplateDTO | null;
  users: WorkspaceUserOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_LABELS: Record<string, string> = Object.fromEntries(
  VARIABLE_CATALOG.map((page) => [page.id, page.label]),
);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function TestSendDialog({ template, users, open, onOpenChange }: TestSendDialogProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [entityIds, setEntityIds] = useState<Record<string, string | undefined>>({});
  const [isSending, setIsSending] = useState(false);

  const { accounts } = useAccounts();
  const { paymentMethods } = usePaymentMethods();
  const { creditCards } = useCreditCards();
  const { debts } = useDebts();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  const detectedPages = useMemo(() => {
    if (!template) return [];
    return detectTemplateEntityPages(template).filter((p) => p !== 'general' && p !== 'user');
  }, [template]);

  const isComplete = !!userId && detectedPages.every((page) => !!entityIds[page]);

  const optionsForPage = (page: string): SelectSearchOption[] => {
    switch (page) {
      case 'account':
        return accounts.map((a) => ({ value: a.id, label: a.name }));
      case 'paymentMethod':
        return paymentMethods.map((pm) => ({ value: pm.id, label: pm.name }));
      case 'creditCard':
        return creditCards.map((c) => ({ value: c.id, label: c.account.name }));
      case 'debt':
        return debts.map((d) => ({ value: d.id, label: d.name }));
      case 'budget':
        return budgets.map((b) => ({ value: b.id, label: b.category?.name || 'Orçamento' }));
      case 'goal':
        return goals.map((g) => ({ value: g.id, label: g.name }));
      default:
        return [];
    }
  };

  const handleSend = async () => {
    if (!template || !userId || !isComplete) return;
    setIsSending(true);
    try {
      const result = await sendTestNotificationTemplate({
        templateId: template.id,
        userId,
        entityIds: {
          transactionId: entityIds.transaction,
          accountId: entityIds.account,
          paymentMethodId: entityIds.paymentMethod,
          creditCardId: entityIds.creditCard,
          debtId: entityIds.debt,
          budgetId: entityIds.budget,
          goalId: entityIds.goal,
        },
      });
      if (result.success) {
        showSuccess('Envio de teste realizado com sucesso!');
        onOpenChange(false);
      } else {
        showError(result.error || 'Não foi possível enviar o teste.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Testar envio</DialogTitle>
          <DialogDescription>
            Escolha um destinatário e os registros reais que devem preencher as variáveis deste
            template.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label="Destinatário">
            <SelectSearch
              options={users.map((u) => ({
                value: u.id,
                label: `${u.name || u.email} (${u.email})`,
              }))}
              value={userId}
              onValueChange={setUserId}
              placeholder="Selecione um usuário"
            />
          </Field>

          {detectedPages.map((page) => (
            <Field key={page} label={PAGE_LABELS[page] || page}>
              {page === 'transaction' ? (
                <AsyncSelectSearch
                  value={entityIds.transaction ?? null}
                  onValueChange={(v) =>
                    setEntityIds((prev) => ({ ...prev, transaction: v ?? undefined }))
                  }
                  fetchOptions={async (query) => {
                    const res = await fetch(
                      `/api/transactions?q=${encodeURIComponent(query)}&limit=100`,
                    );
                    const data = await res.json();
                    return (data.transactions || []).map((t: { id: string; label: string }) => ({
                      value: t.id,
                      label: t.label,
                    }));
                  }}
                  placeholder="Buscar transação..."
                />
              ) : (
                <SelectSearch
                  options={optionsForPage(page)}
                  value={entityIds[page] ?? null}
                  onValueChange={(v) =>
                    setEntityIds((prev) => ({ ...prev, [page]: v ?? undefined }))
                  }
                  placeholder={`Selecione ${PAGE_LABELS[page] || page}`}
                />
              )}
            </Field>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSend} disabled={!isComplete || isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
