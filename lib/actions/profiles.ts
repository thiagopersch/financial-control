"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  bio: z.string().max(300, "Bio deve ter no máximo 300 caracteres").optional().nullable(),
});

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  try {
    const validated = profileSchema.parse(data);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: validated.name },
    });

    await prisma.profile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, bio: validated.bio },
      update: { bio: validated.bio },
    });

    revalidatePath("/profiles");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar perfil" };
  }
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Não autorizado" };

  const bcrypt = await import("bcrypt");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, error: "Usuário não encontrado" };

  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) return { success: false, error: "Senha atual incorreta" };

  if (data.newPassword.length < 6)
    return { success: false, error: "A nova senha deve ter pelo menos 6 caracteres" };

  const hashed = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return { success: true };
}
