'use client';

import { Label } from '@/components/ui/label';
import { Slot } from '@/components/ui/slot';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';

/**
 * Integração react-hook-form + MUI. Mesma API de antes (FormField/FormItem/
 * FormLabel/FormControl/FormMessage): o `FormControl` repassa `id`,
 * `aria-invalid` e `aria-describedby` ao campo, e a mensagem do Zod aparece
 * como `FormHelperText` em vermelho.
 */
const Form = FormProvider;

const FormFieldContext = React.createContext<{ name: string } | null>(null);
const FormItemContext = React.createContext<{ id: string }>({ id: '' });

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ControllerProps<TFieldValues, TName>,
) => {
  const value = React.useMemo(() => ({ name: props.name }), [props.name]);
  return (
    <FormFieldContext.Provider value={value}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const { id } = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  if (!fieldContext) throw new Error('useFormField should be used within <FormField>');

  const fieldState = getFieldState(fieldContext.name, formState);
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function FormItem({ className, children, ...props }, ref) {
    const id = React.useId();
    const value = React.useMemo(() => ({ id }), [id]);
    return (
      <FormItemContext.Provider value={value}>
        <Box
          ref={ref}
          className={className}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          {...(props as Record<string, unknown>)}
        >
          {children}
        </Box>
      </FormItemContext.Provider>
    );
  },
);

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(function FormLabel({ className, required, children, ...props }, ref) {
  const { error, formItemId } = useFormField();
  return (
    <Label
      ref={ref}
      className={
        [error ? 'text-destructive' : '', className].filter(Boolean).join(' ') || undefined
      }
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && (
        <Box component="span" sx={{ color: 'error.main', ml: 0.25 }}>
          *
        </Box>
      )}
    </Label>
  );
});

const FormControl = React.forwardRef<
  HTMLElement,
  { children?: React.ReactNode } & Record<string, unknown>
>(function FormControl(props, ref) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function FormDescription({ className, children }, ref) {
  const { formDescriptionId } = useFormField();
  return (
    <FormHelperText ref={ref} id={formDescriptionId} className={className} sx={{ m: 0 }}>
      {children}
    </FormHelperText>
  );
});

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function FormMessage({ className, children }, ref) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : children;
  if (!body) return null;
  return (
    <FormHelperText
      ref={ref}
      id={formMessageId}
      error
      role="alert"
      className={className}
      sx={{ m: 0, fontWeight: 500, fontSize: '0.8125rem' }}
    >
      {body}
    </FormHelperText>
  );
});

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
