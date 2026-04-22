'use client';

import { toast as sonner, ToasterProps } from 'sonner';
import { ZodError } from 'zod';

const defaultOptions: ToasterProps = {
  position: 'bottom-center' as const,
  richColors: true,
  closeButton: true,
};

interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export function toast({ type, title, description }: ToastMessage) {
  switch (type) {
    case 'success':
      sonner.success(title, { ...defaultOptions, description });
      break;
    case 'error':
      sonner.error(title, { ...defaultOptions, description });
      break;
    case 'info':
      sonner.info(title, { ...defaultOptions, description });
      break;
    case 'warning':
      sonner.warning(title, { ...defaultOptions, description });
      break;
  }
}

export function showSuccess(title: string, description?: string) {
  toast({ type: 'success', title, description });
}

export function showError(title: string, description?: string) {
  sonner.error(title, { ...defaultOptions, description });
}

export function showInfo(title: string, description?: string) {
  toast({ type: 'info', title, description });
}

export function showWarning(title: string, description?: string) {
  toast({ type: 'warning', title, description });
}

export function showValidationErrors(error: unknown) {
  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => issue.message);
    const description =
      messages.length > 1
        ? messages.map((m, i) => `${i + 1}. ${m}`).join('\n')
        : messages[0] || 'Dados inválidos';
    sonner.error('Erro de validação', {
      ...defaultOptions,
      description,
    });
    return;
  }

  if (error instanceof Error) {
    sonner.error('Erro de validação', {
      ...defaultOptions,
      description: error.message || 'Dados inválidos',
    });
    return;
  }

  sonner.error('Erro de validação', {
    ...defaultOptions,
    description: 'Dados inválidos',
  });
}

export function showFormErrors(errors: Record<string, { message?: string }>) {
  const messages = Object.values(errors)
    .filter((error) => error?.message)
    .map((error) => error!.message);

  if (messages.length > 0) {
    const description =
      messages.length > 1 ? messages.map((m, i) => `${i + 1}. ${m}`).join('\n') : messages[0];
    sonner.error('Erro de validação', {
      ...defaultOptions,
      description,
    });
  }
}
