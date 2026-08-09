'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { updateWorkspaceNotificationSettings } from '@/lib/actions/workspace-settings';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Settings } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const settingsSchema = z.object({
  whatsappApiUrl: z.string().optional().nullable(),
  whatsappApiToken: z.string().optional().nullable(),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.coerce.number().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  smtpFrom: z.string().optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface NotificationSettingsFormProps {
  initialValues: SettingsFormValues;
}

export function NotificationSettingsForm({ initialValues }: NotificationSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as never,
    defaultValues: initialValues,
  });

  async function onSubmit(data: SettingsFormValues) {
    setIsLoading(true);
    try {
      const result = await updateWorkspaceNotificationSettings(data);
      if (result.success) {
        showSuccess('Configurações salvas com sucesso!');
      } else {
        showError('Erro ao salvar', result.error || 'Erro inesperado.');
      }
    } catch {
      showError('Erro ao salvar', 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-500" />
          <div>
            <CardTitle className="text-lg">Configurações de Notificação (Admin)</CardTitle>
            <CardDescription>
              Chaves de integração para envio de notificações por e-mail e WhatsApp para toda a
              organização.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold">E-mail (SMTP)</p>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host SMTP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="smtp.exemplo.com"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porta</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="587"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="usuario@exemplo.com"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remetente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Financeiro <naoresponda@exemplo.com>"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-semibold">WhatsApp</p>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="whatsappApiUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da API</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://api.provedor.com/send"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Endpoint do provedor de WhatsApp Business que receberá{' '}
                        {`{ phone, message }`}.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsappApiToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token de acesso</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar configurações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
