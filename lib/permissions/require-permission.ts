import { authOptions } from '@/lib/auth-options';
import { hasPermission } from '@/lib/permissions/has-permission';
import type { PermissionAction } from '@prisma/client';
import { getServerSession, type Session } from 'next-auth';

export class ForbiddenError extends Error {
  constructor(message = 'Sem permissão para executar esta ação') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Guarda de autorização para Server Actions e Server Components: garante que
 * há sessão autenticada e que o usuário tem a permissão `resource:action`.
 * Retorna a sessão para reaproveitar `workspaceId`/`id` na chamada seguinte.
 */
export async function requirePermission(
  resource: string,
  action: PermissionAction,
): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ForbiddenError('Não autenticado');
  if (!hasPermission(session.user.permissions, resource, action)) {
    throw new ForbiddenError();
  }
  return session;
}
