'use client';

import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  supplierSchema,
  useSupplierForm,
  type SupplierFormValues,
} from '@/hooks/forms/use-supplier-form';
import { maskDocument } from '@/lib/utils/document';
import type { SupplierDTO } from '@/lib/queries/suppliers';
import { zodResolver } from '@hookform/resolvers/zod';
import { SupplierPersonType } from '@prisma/client';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

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
        personType: supplier.personType,
        document: supplier.document ?? '',
        contact: supplier.contact ?? '',
        address: supplier.address ?? '',
        isActive: supplier.isActive,
      };
    }
    return {
      name: '',
      personType: SupplierPersonType.COMPANY,
      document: '',
      contact: '',
      address: '',
      isActive: true,
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
  }, [isOpen, defaultValues, form]);

  const personType = form.watch('personType');

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
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <FormField
              control={form.control}
              name="personType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Tipo de Fornecedor</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('document', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SupplierPersonType.INDIVIDUAL}>Pessoa Física</SelectItem>
                      <SelectItem value={SupplierPersonType.COMPANY}>Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{personType === 'INDIVIDUAL' ? 'CPF' : 'CNPJ'}</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder={
                        personType === 'INDIVIDUAL' ? '000.000.000-00' : '00.000.000/0001-00'
                      }
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(maskDocument(e.target.value, personType))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Empresa XYZ Ltda" {...field} />
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
                  <Input placeholder="Ex: (99) 99999-9999" {...field} value={field.value ?? ''} />
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
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <Label htmlFor="isActive" className="cursor-pointer">
                  Ativo
                </Label>
              </div>
            )}
          />
        </div>
      </Form>
    </FormDialog>
  );
}
