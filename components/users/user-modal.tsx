'use client';

import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { SelectSearch } from '@/components/ui/select-search';
import { usePermissionProfiles } from '@/hooks/use-permission-profiles';
import { useUserForm } from '@/hooks/forms/use-user-form';
import { maskPhone } from '@/lib/utils/phone';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function UserModal({ isOpen, onClose, initialData }: UserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profiles } = usePermissionProfiles();

  const profileOptions = useMemo(
    () => profiles.map((profile) => ({ value: profile.id, label: profile.name })),
    [profiles],
  );

  const { handleSubmit, isEditing, schema } = useUserForm({
    user: initialData || null,
    onSuccess: () => {
      onClose();
    },
  });

  const defaultValues = useMemo(() => {
    if (initialData) {
      return {
        name: initialData.name,
        permissionProfileId: initialData.permissionProfileId || '',
        phone: initialData.profile?.phone || '',
        notifyEmail: initialData.profile?.notifyEmail || false,
        notifyWhatsapp: initialData.profile?.notifyWhatsapp || false,
      };
    }
    return { name: '', email: '', password: '', permissionProfileId: '' };
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
          ? 'Altere o nome ou o perfil de permissão do usuário no workspace.'
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
            name="permissionProfileId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Perfil de Permissão</FormLabel>
                <FormControl>
                  <SelectSearch
                    options={profileOptions}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? '')}
                    placeholder="Selecione um perfil de permissão"
                    emptyText="Nenhum perfil encontrado."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEditing && (
            <>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
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
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Notificações</p>
                <FormField
                  control={form.control}
                  name="notifyEmail"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="user-notifyEmail"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="user-notifyEmail" className="cursor-pointer">
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
                        id="user-notifyWhatsapp"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="user-notifyWhatsapp" className="cursor-pointer">
                        Receber notificações por WhatsApp
                      </Label>
                    </div>
                  )}
                />
              </div>
            </>
          )}
        </div>
      </Form>
    </FormDialog>
  );
}
