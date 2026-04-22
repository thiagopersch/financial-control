'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useSupplierForm,
  type SupplierFormValues,
  supplierSchema,
} from '@/hooks/forms/use-supplier-form';
import type { SupplierDTO } from '@/lib/queries/suppliers';

interface SuppliersFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: SupplierDTO | null;
  onSuccess?: () => void;
}

export function SuppliersForm({ isOpen, onClose, supplier, onSuccess }: SuppliersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useSupplierForm({
    supplier,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<SupplierFormValues>(() => {
    if (supplier) {
      return {
        name: supplier.name,
        document: supplier.document || '',
        contact: supplier.contact || '',
        address: supplier.address || '',
      };
    }
    return {
      name: '',
      document: '',
      contact: '',
      address: '',
    };
  }, [supplier]);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultValues]);

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      description="Preencha os dados do fornecedor."
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Empresa XYZ Ltda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ/CPF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 00.000.000/0001-00"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contato</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: (11) 99999-9999" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Rua Example, 123 - São Paulo, SP"
                    {...field}
                    value={field.value || ''}
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
