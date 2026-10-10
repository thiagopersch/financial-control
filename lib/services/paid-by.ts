import prisma from '@/lib/prisma';

/**
 * "Pago por" precisa ser um usuário do mesmo workspace. Na criação (ou ao trocar
 * o usuário) ele também precisa estar ativo; manter um vínculo antigo com um
 * usuário que foi desativado depois é permitido.
 */
export async function assertValidPaidBy(
  workspaceId: string,
  paidById: string | null | undefined,
  previousPaidById?: string | null,
) {
  if (!paidById) return null;
  const user = await prisma.user.findFirst({
    where: { id: paidById, workspaceId },
    select: { isActive: true },
  });
  if (!user) return 'Usuário de "Pago por" inválido';
  if (!user.isActive && paidById !== previousPaidById) return 'Usuário de "Pago por" está inativo';
  return null;
}
