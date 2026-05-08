'use client';

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
import { tagSchema, useTagForm } from '@/hooks/forms/use-tag-form';
import type { TagDTO } from '@/lib/queries/tags';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TagFormValues } from '@/hooks/forms/use-tag-form';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface TagsFormProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: TagDTO | null;
  onSuccess?: () => void;
}

export function TagsForm({ isOpen, onClose, tag, onSuccess }: TagsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { handleSubmit, isEditing } = useTagForm({
    tag,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const defaultValues = useMemo<TagFormValues>(() => {
    if (tag) {
      return {
        name: tag.name,
        color: tag.color || '#6366f1',
      };
    }
    return {
      name: '',
      color: '#6366f1',
    };
  }, [tag]);

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultValues]);

  const onSubmit = async (values: TagFormValues) => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  };

  return (
    <FormDialog
      title={isEditing ? 'Editar Tag' : 'Nova Tag'}
      description="Crie tags para organizar e categorizar suas transações."
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
                  <Input placeholder="Ex: Alimentação, Transporte..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="h-10 w-16 p-1" {...field} />
                    <span className="text-muted-foreground font-mono text-sm">{field.value}</span>
                  </div>
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
