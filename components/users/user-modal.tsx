'use client';

import { FormDialog } from '@/components/ui/form-dialog';
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
import {
  useUserForm,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from '@/hooks/forms/use-user-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

const roleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.MANAGER]: 'Gerente',
  [Role.VIEWER]: 'Visualizador',
};

export function UserModal({ isOpen, onClose, initialData }: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing, schema } = useUserForm({
    user: initialData || null,
    onSuccess: () => {
      onClose();
    },
  });

  const defaultValues = useMemo(() => {
    if (initialData) {
      return { name: initialData.name, role: initialData.role };
    }
    return { name: '', email: '', password: '', role: Role.VIEWER };
  }, [initialData]);

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as any,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Usuário' : 'Convidar Usuário'}
      description={
        isEditing
          ? 'Altere o nome ou a função do usuário no workspace.'
          : 'Crie um novo acesso para um membro da equipe.'
      }
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      confirmText={isEditing ? 'Atualizar' : 'Salvar'}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
        </div>
      </Form>
    </FormDialog>
  );
}
