'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from '@/lib/actions/profiles';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@prisma/client';
import { Loader2, Save, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(300, 'Máximo 300 caracteres').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  VIEWER: 'Visualizador',
};

const roleColors: Record<Role, string> = {
  ADMIN: 'bg-purple-500 hover:bg-purple-500',
  MANAGER: 'bg-blue-500 hover:bg-blue-500',
  VIEWER: 'bg-slate-500 hover:bg-slate-500',
};

interface ProfileFormProps {
  initialName: string;
  initialBio: string;
  email: string;
  role: Role;
}

export function ProfileForm({ initialName, initialBio, email, role }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialName, bio: initialBio },
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
              <CardDescription>Atualize seu nome e biografia.</CardDescription>
            </div>
          </div>
          <Badge className={roleColors[role]}>{roleLabels[role]}</Badge>
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
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
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
