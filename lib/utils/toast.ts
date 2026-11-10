'use client';

import { enqueueSnackbar, type VariantType } from 'notistack';
import { createElement, Fragment, type ReactNode } from 'react';
import { ZodError } from 'zod';

/**
 * Notificações (toasts) do app via notistack + MUI. Mesma API de antes
 * (`showSuccess`/`showError`…), então nenhum chamador precisou mudar.
 */
interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

function render(title: string, description?: string): ReactNode {
  if (!description) return title;
  return createElement(
    Fragment,
    null,
    createElement('strong', { style: { display: 'block' } }, title),
    createElement('span', { style: { whiteSpace: 'pre-line', opacity: 0.9 } }, description),
  );
}

export function toast({ type, title, description }: ToastMessage) {
  enqueueSnackbar(render(title, description), { variant: type as VariantType });
}

export function showSuccess(title: string, description?: string) {
  toast({ type: 'success', title, description });
}

export function showError(title: string, description?: string) {
  toast({ type: 'error', title, description });
}

export function showInfo(title: string, description?: string) {
  toast({ type: 'info', title, description });
}

export function showWarning(title: string, description?: string) {
  toast({ type: 'warning', title, description });
}

function listMessages(messages: string[]) {
  return messages.length > 1 ? messages.map((m, i) => `${i + 1}. ${m}`).join('\n') : messages[0];
}

export function showValidationErrors(error: unknown) {
  if (error instanceof ZodError) {
    showError(
      'Erro de validação',
      listMessages(error.issues.map((i) => i.message)) || 'Dados inválidos',
    );
    return;
  }
  showError(
    'Erro de validação',
    error instanceof Error ? error.message || 'Dados inválidos' : 'Dados inválidos',
  );
}

export function showFormErrors(errors: Record<string, { message?: string }>) {
  const messages = Object.values(errors)
    .filter((error) => error?.message)
    .map((error) => error!.message!);
  if (messages.length > 0) showError('Erro de validação', listMessages(messages));
}
