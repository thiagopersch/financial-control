'use server';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const profileSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    bio: z.string().max(300, 'Bio deve ter no máximo 300 caracteres').optional().nullable(),
    phone: z.string().optional().nullable(),
    notifyEmail: z.boolean().default(false),
    notifyWhatsapp: z.boolean().default(false),
  })
  .refine((data) => !data.notifyWhatsapp || !!data.phone, {
    message: 'Informe um telefone para receber notificações via WhatsApp',
    path: ['phone'],
  });

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  try {
    const validated = profileSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validated.name },
    });

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bio: validated.bio,
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
      update: {
        bio: validated.bio,
        phone: validated.phone,
        notifyEmail: validated.notifyEmail,
        notifyWhatsapp: validated.notifyWhatsapp,
      },
    });

    revalidatePath('/profiles');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Dados inválidos' };
    }
    return { success: false, error: 'Erro ao atualizar perfil' };
  }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: 'Não autorizado' };

  const bcrypt = await import('bcryptjs');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, error: 'Usuário não encontrado' };

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) return { success: false, error: 'Senha atual incorreta' };

  if (data.newPassword.length < 6)
    return { success: false, error: 'A nova senha deve ter pelo menos 6 caracteres' };

  const hashed = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return { success: true };
}
