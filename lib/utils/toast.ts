'use client';

import { toast as sonner } from 'sonner';
import { ZodError } from 'zod';

const defaultOptions = {
  position: 'bottom-center' as const,
  richColors: true,
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
    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      const message = `${path ? `${path}: ` : ''}${issue.message}`;
      sonner.error('Erro de validação', {
        ...defaultOptions,
        description: message,
      });
    });
    return;
  }

  if (error instanceof Error) {
    sonner.error('Erro de validação', {
      ...defaultOptions,
      description: error.message,
    });
    return;
  }

  sonner.error('Erro de validação', {
    ...defaultOptions,
    description: 'Dados inválidos',
  });
}

export function showFormErrors(errors: Record<string, { message?: string }>) {
  Object.values(errors).forEach((error) => {
    if (error?.message) {
      sonner.error('Erro de validação', {
        ...defaultOptions,
        description: error.message,
      });
    }
  });
}
