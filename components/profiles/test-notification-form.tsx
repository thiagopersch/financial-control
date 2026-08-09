'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectSearch } from '@/components/ui/select-search';
import { sendTestNotification } from '@/lib/actions/workspace-settings';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';

interface TestNotificationFormProps {
  users: { id: string; name: string | null; email: string }[];
}

export function TestNotificationForm({ users }: TestNotificationFormProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!userId) {
      showError('Selecione um usuário para enviar a notificação de teste.');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendTestNotification(userId);
      if (result.success) {
        showSuccess(result.message || 'Notificação de teste enviada.');
      } else {
        showError(result.error || 'Não foi possível enviar a notificação de teste.');
      }
    } catch {
      showError('Erro inesperado ao enviar notificação de teste.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-indigo-500" />
          <div>
            <CardTitle className="text-lg">Testar Integração</CardTitle>
            <CardDescription>
              Envie uma mensagem de teste por e-mail e WhatsApp para um usuário específico.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SelectSearch
            className="sm:max-w-xs"
            options={users.map((u) => ({
              value: u.id,
              label: `${u.name || u.email} (${u.email})`,
            }))}
            value={userId}
            onValueChange={setUserId}
            placeholder="Selecione um usuário..."
            emptyText="Nenhum usuário encontrado."
          />
          <Button type="button" onClick={handleSend} disabled={isSending || !userId}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar teste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
