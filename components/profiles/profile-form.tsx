'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from '@/lib/actions/profiles';
import { maskPhone } from '@/lib/utils/phone';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const profileSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    bio: z.string().max(300, 'Máximo 300 caracteres').optional(),
    phone: z.string().optional().nullable(),
    notifyEmail: z.boolean().default(false),
    notifyWhatsapp: z.boolean().default(false),
  })
  .refine((data) => !data.notifyWhatsapp || !!data.phone, {
    message: 'Informe um telefone para receber notificações via WhatsApp',
    path: ['phone'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialName: string;
  initialBio: string;
  initialPhone: string;
  initialNotifyEmail: boolean;
  initialNotifyWhatsapp: boolean;
  email: string;
  permissionProfileName: string;
}

export function ProfileForm({
  initialName,
  initialBio,
  initialPhone,
  initialNotifyEmail,
  initialNotifyWhatsapp,
  email,
  permissionProfileName,
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      name: initialName,
      bio: initialBio,
      phone: initialPhone,
      notifyEmail: initialNotifyEmail,
      notifyWhatsapp: initialNotifyWhatsapp,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        showSuccess('Perfil atualizado com sucesso!');
      } else {
        showError('Erro ao atualizar perfil', result.error || 'Erro inesperado.');
      }
    } catch {
      showError('Erro ao atualizar perfil', 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-500" />
            <div>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seu nome, contato e preferências de notificação.
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-indigo-500 hover:bg-indigo-500">{permissionProfileName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-muted-foreground text-sm font-medium">E-mail</label>
              <div className="relative">
                <Input
                  value={email}
                  disabled
                  className="cursor-not-allowed bg-slate-50 pl-9 dark:bg-slate-800"
                />
              </div>
              <p className="text-muted-foreground text-xs">O e-mail não pode ser alterado.</p>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Fale um pouco sobre você..."
                      className="resize-none"
                      rows={3}
                      maxLength={300}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Notificações</p>
              <p className="text-muted-foreground text-xs">
                Escolha por onde deseja receber alertas de transações, orçamentos e metas, além das
                notificações no próprio sistema.
              </p>
              <FormField
                control={form.control}
                name="notifyEmail"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifyEmail"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="notifyEmail" className="cursor-pointer">
                      Receber notificações por e-mail
                    </Label>
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="notifyWhatsapp"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifyWhatsapp"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="notifyWhatsapp" className="cursor-pointer">
                      Receber notificações por WhatsApp
                    </Label>
                  </div>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar alterações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
