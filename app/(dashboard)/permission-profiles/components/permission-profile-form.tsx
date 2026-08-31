'use client';

import { PermissionTree } from '@/components/permissions/permission-tree';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  permissionProfileSchema,
  usePermissionProfileForm,
  type PermissionProfileFormValues,
} from '@/hooks/forms/use-permission-profile-form';
import { usePermissionCatalog } from '@/hooks/use-permission-profiles';
import type { PermissionProfileDTO } from '@/lib/queries/permission-profiles';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface PermissionProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: PermissionProfileDTO | null;
  onSuccess?: () => void;
}

export function PermissionProfileForm({
  isOpen,
  onClose,
  profile,
  onSuccess,
}: PermissionProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { catalog } = usePermissionCatalog();
  const isSystem = !!profile?.isSystem;

  const { isEditing, handleSubmit } = usePermissionProfileForm({
    profile,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<PermissionProfileFormValues>(() => {
    if (profile) {
      return {
        name: profile.name,
        description: profile.description ?? '',
        permissionIds: profile.permissionIds,
      };
    }
    return { name: '', description: '', permissionIds: [] };
  }, [profile]);

  const form = useForm<PermissionProfileFormValues>({
    resolver: zodResolver(permissionProfileSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen, defaultValues, form]);

  const onSubmit = async (values: PermissionProfileFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar perfil de permissão' : 'Novo perfil de permissão'}
      description="Defina o nome, a descrição e marque as páginas e ações que este perfil pode acessar."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Financeiro, Suporte, Somente leitura..."
                    {...field}
                    disabled={isSystem}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Breve descrição do que este perfil pode fazer"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="permissionIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Permissões</FormLabel>
                <FormControl>
                  <PermissionTree
                    catalog={catalog}
                    selectedIds={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}
