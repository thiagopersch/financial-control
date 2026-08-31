'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const scheduledTransactionSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'BUSINESS_DAYS']),
  dayOfMonth: z.number().min(1).max(31).optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  paymentMethodId: z.string().min(1, 'Meio de pagamento é obrigatório'),
  creditCardId: z.string().nullable().optional(),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório'),
  nextRun: z.string().optional(),
});

async function assertCreditCardWhenRequired(paymentMethodId: string, creditCardId?: string | null) {
  const paymentMethod = await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
  if (paymentMethod?.isCreditCard && !creditCardId) {
    return 'Cartão de crédito é obrigatório para este meio de pagamento';
  }
  return null;
}

export async function createScheduledTransaction(data: z.infer<typeof scheduledTransactionSchema>) {
  try {
    const session = await requirePermission('scheduled', 'CREATE');
    const validated = scheduledTransactionSchema.parse(data);

    const creditCardError = await assertCreditCardWhenRequired(
      validated.paymentMethodId,
      validated.creditCardId,
    );
    if (creditCardError) return { success: false, error: creditCardError };

    const nextRun = validated.nextRun ? new Date(validated.nextRun) : new Date();

    const transaction = await prisma.scheduledTransaction.create({
      data: {
        name: validated.name,
        type: validated.type,
        amount: validated.amount,
        frequency: validated.frequency,
        dayOfMonth: validated.dayOfMonth || 1,
        nextRun,
        isActive: true,
        categoryId: validated.categoryId,
        accountId: validated.accountId,
        paymentMethodId: validated.paymentMethodId,
        creditCardId: validated.creditCardId,
        supplierId: validated.supplierId,
        workspaceId: session.user.workspaceId,
      },
    });

    revalidatePath('/scheduled');
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error creating scheduled transaction:', error);
    return { success: false, error: 'Erro ao criar agendamento' };
  }
}

export async function updateScheduledTransaction(
  id: string,
  data: Partial<z.infer<typeof scheduledTransactionSchema>>,
) {
  try {
    const session = await requirePermission('scheduled', 'UPDATE');
    if (data.paymentMethodId) {
      const creditCardError = await assertCreditCardWhenRequired(
        data.paymentMethodId,
        data.creditCardId,
      );
      if (creditCardError) return { success: false, error: creditCardError };
    }

    const transaction = await prisma.scheduledTransaction.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: {
        ...data,
        nextRun: data.nextRun ? new Date(data.nextRun) : undefined,
      },
    });

    revalidatePath('/scheduled');
    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error updating scheduled transaction:', error);
    return { success: false, error: 'Erro ao atualizar agendamento' };
  }
}

export async function deleteScheduledTransaction(id: string) {
  try {
    const session = await requirePermission('scheduled', 'DELETE');
    await prisma.scheduledTransaction.delete({
      where: { id, workspaceId: session.user.workspaceId },
    });

    revalidatePath('/scheduled');
    return { success: true };
  } catch (error) {
    console.error('Error deleting scheduled transaction:', error);
    return { success: false, error: 'Erro ao excluir agendamento' };
  }
}

export async function toggleScheduledTransaction(id: string, isActive: boolean) {
  try {
    const session = await requirePermission('scheduled', 'UPDATE');
    await prisma.scheduledTransaction.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: { isActive },
    });

    revalidatePath('/scheduled');
    return { success: true };
  } catch (error) {
    console.error('Error toggling scheduled transaction:', error);
    return { success: false, error: 'Erro ao atualizar agendamento' };
  }
}
