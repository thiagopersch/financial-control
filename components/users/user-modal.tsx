'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUser, updateUser } from '@/lib/actions/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role: z.enum(Role),
});

const updateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.email('E-mail inválido').optional(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(Role),
});

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function UserModal({ isOpen, onClose, initialData }: UserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const schema = isEditing ? updateSchema : createSchema;
  type FormValues = z.infer<typeof createSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: Role.VIEWER,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        password: '',
        role: initialData.role,
      });
    } else {
      form.reset({ name: '', email: '', password: '', role: Role.VIEWER });
    }
  }, [initialData, form]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      let result;
      if (isEditing) {
        result = await updateUser(initialData.id, { name: data.name, role: data.role });
      } else {
        result = await createUser({
          name: data.name,
          email: data.email,
          password: data.password!,
          role: data.role,
        });
      }

      if (result.success) {
        showSuccess(
          isEditing ? 'Usuário atualizado!' : 'Usuário criado com sucesso!',
          isEditing ? 'O usuário foi atualizado.' : 'O usuário foi criado.',
        );
        onClose();
      } else {
        showError(
          result.error || (isEditing ? 'Erro ao atualizar usuário.' : 'Erro ao criar usuário.'),
          isEditing ? 'Erro ao atualizar usuário.' : 'Erro ao criar usuário.',
        );
      }
    } catch {
      showError('Erro inesperado.', 'Erro ao criar ou atualizar usuário.');
    } finally {
      setIsLoading(false);
    }
  }

  const roleLabels: Record<Role, string> = {
    [Role.ADMIN]: 'Administrador',
    [Role.MANAGER]: 'Gerente',
    [Role.VIEWER]: 'Visualizador',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Convidar Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere o nome ou a função do usuário no workspace.'
              : 'Crie um novo acesso para um membro da equipe.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Jhon doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jhondoe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha provisória</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Role).map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabels[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
