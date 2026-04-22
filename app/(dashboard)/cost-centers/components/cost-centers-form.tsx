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
  useCostCenterForm,
  type CostCenterFormValues,
  costCenterSchema,
} from '@/hooks/forms/use-cost-center-form';
import type { CostCenterDTO } from '@/lib/queries/cost-centers';

interface CostCentersFormProps {
  isOpen: boolean;
  onClose: () => void;
  costCenter?: CostCenterDTO | null;
  onSuccess?: () => void;
}

export function CostCentersForm({ isOpen, onClose, costCenter, onSuccess }: CostCentersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useCostCenterForm({
    costCenter,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<CostCenterFormValues>(() => {
    if (costCenter) {
      return {
        name: costCenter.name,
        description: costCenter.description || '',
      };
    }
    return {
      name: '',
      description: '',
    };
  }, [costCenter]);

  const form = useForm<CostCenterFormValues>({
    resolver: zodResolver(costCenterSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultValues]);

  const onSubmit = async (values: CostCenterFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
      description="Preencha os dados do centro de custo."
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
                  <Input placeholder="Ex: Marketing, TI, RH..." {...field} />
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
                    placeholder="Descrição opcional..."
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
