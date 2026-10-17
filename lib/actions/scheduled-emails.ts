'use server';

import { requirePermission, ForbiddenError } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { getScheduledEmail } from '@/lib/queries/scheduled-emails';
import { scheduledEmailSchema, type ScheduledEmailInput } from '@/lib/schemas/scheduled-email';
import { createAuditLog } from '@/lib/services/audit';
import { computeNextEmailRun } from '@/lib/services/email-schedule';
import { runScheduledEmail } from '@/lib/services/scheduled-email-runner';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

type ActionResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

function toErrorResult(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof ForbiddenError) return { success: false, error: error.message };
  if (error instanceof z.ZodError) {
    return { success: false, error: error.issues[0]?.message ?? 'Dados inválidos' };
  }
  console.error(fallback, error);
  return { success: false, error: fallback };
}

/** Normalizes fields that don't apply to the chosen frequency/report type. */
function toData(input: ScheduledEmailInput) {
  return {
    ...input,
    intervalDays: input.frequency === 'EVERY_N_DAYS' ? input.intervalDays : null,
    dayOfWeek: input.frequency === 'WEEKLY' ? input.dayOfWeek : null,
    dayOfMonth: input.frequency === 'MONTHLY' ? input.dayOfMonth : null,
  };
}

async function assertTemplate(workspaceId: string, input: ScheduledEmailInput) {
  if (!input.templateId) return null;
  const template = await prisma.notificationTemplate.findFirst({
    where: { id: input.templateId, workspaceId, channel: 'EMAIL' },
    select: { type: true },
  });
  if (!template) return 'Template não encontrado';
  if (template.type !== input.reportType) return 'O template escolhido é de outro tipo';
  return null;
}

export async function createScheduledEmail(
  input: ScheduledEmailInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('scheduled', 'CREATE');
    const validated = scheduledEmailSchema.parse(input);
    const workspaceId = session.user.workspaceId;

    const templateError = await assertTemplate(workspaceId, validated);
    if (templateError) return { success: false, error: templateError };

    const data = toData(validated);
    const created = await prisma.scheduledEmail.create({
      data: {
        ...data,
        nextRun: computeNextEmailRun(data),
        workspaceId,
        createdById: session.user.id,
      },
    });

    await createAuditLog({
      action: 'CREATE_SCHEDULED_EMAIL',
      entity: 'ScheduledEmail',
      entityId: created.id,
      newValue: data,
    });
    revalidatePath('/scheduled');
    return { success: true, data: { id: created.id } };
  } catch (error) {
    return toErrorResult(error, 'Erro ao criar agendamento de e-mail');
  }
}

export async function updateScheduledEmail(
  id: string,
  input: ScheduledEmailInput,
): Promise<ActionResult> {
  try {
    const session = await requirePermission('scheduled', 'UPDATE');
    const validated = scheduledEmailSchema.parse(input);
    const workspaceId = session.user.workspaceId;

    const existing = await prisma.scheduledEmail.findFirst({ where: { id, workspaceId } });
    if (!existing) return { success: false, error: 'Agendamento não encontrado' };

    const templateError = await assertTemplate(workspaceId, validated);
    if (templateError) return { success: false, error: templateError };

    const data = toData(validated);
    await prisma.scheduledEmail.update({
      where: { id },
      data: { ...data, nextRun: computeNextEmailRun(data) },
    });

    await createAuditLog({
      action: 'UPDATE_SCHEDULED_EMAIL',
      entity: 'ScheduledEmail',
      entityId: id,
      oldValue: existing,
      newValue: data,
    });
    revalidatePath('/scheduled');
    return { success: true };
  } catch (error) {
    return toErrorResult(error, 'Erro ao atualizar agendamento de e-mail');
  }
}

export async function deleteScheduledEmail(id: string): Promise<ActionResult> {
  try {
    const session = await requirePermission('scheduled', 'DELETE');
    const result = await prisma.scheduledEmail.deleteMany({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (result.count === 0) return { success: false, error: 'Agendamento não encontrado' };

    await createAuditLog({
      action: 'DELETE_SCHEDULED_EMAIL',
      entity: 'ScheduledEmail',
      entityId: id,
    });
    revalidatePath('/scheduled');
    return { success: true };
  } catch (error) {
    return toErrorResult(error, 'Erro ao excluir agendamento de e-mail');
  }
}

export async function toggleScheduledEmail(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const session = await requirePermission('scheduled', 'UPDATE');
    const existing = await prisma.scheduledEmail.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) return { success: false, error: 'Agendamento não encontrado' };

    await prisma.scheduledEmail.update({
      where: { id },
      // Reactivating recomputes nextRun so missed occurrences aren't sent in a burst.
      data: { isActive, ...(isActive ? { nextRun: computeNextEmailRun(existing) } : {}) },
    });

    await createAuditLog({
      action: 'TOGGLE_SCHEDULED_EMAIL',
      entity: 'ScheduledEmail',
      entityId: id,
      newValue: { isActive },
    });
    revalidatePath('/scheduled');
    return { success: true };
  } catch (error) {
    return toErrorResult(error, 'Erro ao alterar status do agendamento');
  }
}

/** Sends the e-mail now to the configured recipients (does not change nextRun). */
export async function runScheduledEmailNow(id: string): Promise<ActionResult> {
  try {
    const session = await requirePermission('scheduled', 'UPDATE');
    const schedule = await getScheduledEmail(session.user.workspaceId, id);
    if (!schedule) return { success: false, error: 'Agendamento não encontrado' };

    const result = await runScheduledEmail(schedule, { manual: true });
    await createAuditLog({
      action: 'RUN_SCHEDULED_EMAIL',
      entity: 'ScheduledEmail',
      entityId: id,
      newValue: { manual: true, ...result },
    });
    revalidatePath('/scheduled');
    if (result.status === 'FAILED')
      return { success: false, error: `Falha no envio: ${result.error}` };
    return { success: true };
  } catch (error) {
    return toErrorResult(error, 'Erro ao enviar e-mail agendado');
  }
}

/** Sends a "[Teste]" copy only to the logged-in user; no log, no CC. */
export async function sendScheduledEmailPreview(id: string): Promise<ActionResult> {
  try {
    const session = await requirePermission('scheduled', 'VIEW');
    const schedule = await getScheduledEmail(session.user.workspaceId, id);
    if (!schedule) return { success: false, error: 'Agendamento não encontrado' };
    if (!session.user.email) return { success: false, error: 'Seu usuário não possui e-mail' };

    const result = await runScheduledEmail(schedule, {
      manual: true,
      recipients: { to: [session.user.email], cc: [] },
    });
    await createAuditLog({
      action: 'TEST_SEND_SCHEDULED_EMAIL',
      entity: 'ScheduledEmail',
      entityId: id,
      newValue: { to: session.user.email, ...result },
    });
    if (result.status === 'FAILED')
      return { success: false, error: `Falha no envio: ${result.error}` };
    return { success: true };
  } catch (error) {
    return toErrorResult(error, 'Erro ao enviar teste');
  }
}
