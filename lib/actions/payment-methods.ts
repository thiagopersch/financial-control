'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/services/audit';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().optional().default('#6366f1'),
  isCreditCard: z.boolean().optional().default(false),
  accountIds: z.array(z.string()).default([]),
});

export async function createPaymentMethod(data: z.infer<typeof paymentMethodSchema>) {
  try {
    const session = await requirePermission('payment-methods', 'CREATE');
    const validated = paymentMethodSchema.parse(data);

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        name: validated.name,
        color: validated.color,
        isCreditCard: validated.isCreditCard,
        workspaceId: session.user.workspaceId,
        accounts: {
          connect: validated.accountIds.map((id) => ({ id })),
        },
      },
    });

    await createAuditLog({
      action: 'CREATE_PAYMENT_METHOD',
      entity: 'PaymentMethod',
      entityId: paymentMethod.id,
      newValue: validated,
    });

    revalidatePath('/payment-methods');
    return { success: true, data: paymentMethod };
  } catch (error) {
    console.error('Error creating payment method:', error);
    return { success: false, error: 'Erro ao criar meio de pagamento' };
  }
}

export async function updatePaymentMethod(id: string, data: z.infer<typeof paymentMethodSchema>) {
  try {
    const session = await requirePermission('payment-methods', 'UPDATE');
    const validated = paymentMethodSchema.parse(data);

    const existing = await prisma.paymentMethod.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) return { success: false, error: 'Meio de pagamento não encontrado' };

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: validated.name,
        color: validated.color,
        isCreditCard: validated.isCreditCard,
        accounts: {
          set: validated.accountIds.map((accountId) => ({ id: accountId })),
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE_PAYMENT_METHOD',
      entity: 'PaymentMethod',
      entityId: paymentMethod.id,
      oldValue: existing,
      newValue: validated,
    });

    revalidatePath('/payment-methods');
    return { success: true, data: paymentMethod };
  } catch (error) {
    console.error('Error updating payment method:', error);
    return { success: false, error: 'Erro ao atualizar meio de pagamento' };
  }
}

export async function deletePaymentMethod(id: string) {
  try {
    const session = await requirePermission('payment-methods', 'DELETE');
    const paymentMethod = await prisma.paymentMethod.delete({
      where: {
        id,
        workspaceId: session.user.workspaceId,
      },
    });

    await createAuditLog({
      action: 'DELETE_PAYMENT_METHOD',
      entity: 'PaymentMethod',
      entityId: id,
      oldValue: paymentMethod,
    });

    revalidatePath('/payment-methods');
    return { success: true };
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return { success: false, error: 'Erro ao excluir meio de pagamento' };
  }
}
