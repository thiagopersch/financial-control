'use server';

import { requirePermission } from '@/lib/permissions/require-permission';
import prisma from '@/lib/prisma';
import { assertKeepsSystemProfileUser } from '@/lib/services/permission-profiles';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  permissionProfileId: z.string().min(1, 'Selecione um perfil de permissão'),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    permissionProfileId: z.string().min(1, 'Selecione um perfil de permissão'),
    phone: z.string().optional().nullable(),
    notifyEmail: z.boolean().default(false),
    notifyWhatsapp: z.boolean().default(false),
  })
  .refine((data) => !data.notifyWhatsapp || !!data.phone, {
    message: 'Informe um telefone para ativar notificações via WhatsApp',
    path: ['phone'],
  });

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    const session = await requirePermission('users', 'CREATE');
    const validated = createUserSchema.parse(data);

    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) return { success: false, error: 'Já existe um usuário com este e-mail' };

    const profile = await prisma.permissionProfile.findFirst({
      where: { id: validated.permissionProfileId, workspaceId: session.user.workspaceId },
    });
    if (!profile) return { success: false, error: 'Perfil de permissão inválido' };

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        permissionProfileId: validated.permissionProfileId,
        workspaceId: session.user.workspaceId,
      },
    });

    await prisma.profile.create({ data: { userId: user.id } });

    revalidatePath('/users');
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: 'Dados inválidos' };
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar usuário',
    };
  }
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  try {
    const session = await requirePermission('users', 'UPDATE');
    const validated = updateUserSchema.parse(data);

    const profile = await prisma.permissionProfile.findFirst({
      where: { id: validated.permissionProfileId, workspaceId: session.user.workspaceId },
    });
    if (!profile) return { success: false, error: 'Perfil de permissão inválido' };

    await assertKeepsSystemProfileUser(
      prisma,
      session.user.workspaceId,
      id,
      validated.permissionProfileId,
    );

    const user = await prisma.user.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: { name: validated.name, permissionProfileId: validated.permissionProfileId },
    });

    await prisma.profile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
      update: {
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
    });

    revalidatePath('/users');
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
    };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await requirePermission('users', 'DELETE');

    if (id === session.user.id)
      return { success: false, error: 'Você não pode excluir sua própria conta' };

    await assertKeepsSystemProfileUser(prisma, session.user.workspaceId, id, null);

    await prisma.user.delete({ where: { id, workspaceId: session.user.workspaceId } });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao excluir usuário',
    };
  }
}
