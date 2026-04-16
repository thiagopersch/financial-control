"use server";

import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.nativeEnum(Role),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  role: z.nativeEnum(Role),
});

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN)
    return { success: false, error: "Sem permissão para criar usuários" };

  try {
    const validated = createUserSchema.parse(data);

    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) return { success: false, error: "Já existe um usuário com este e-mail" };

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: validated.role,
        workspaceId: session.user.workspaceId,
      },
    });

    await prisma.profile.create({ data: { userId: user.id } });

    revalidatePath("/users");
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: "Dados inválidos" };
    return { success: false, error: "Erro ao criar usuário" };
  }
}

export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN)
    return { success: false, error: "Sem permissão para editar usuários" };

  // Prevent removing the last ADMIN
  if (data.role !== Role.ADMIN) {
    const admins = await prisma.user.count({
      where: { workspaceId: session.user.workspaceId, role: Role.ADMIN },
    });
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (admins === 1 && targetUser?.role === Role.ADMIN) {
      return { success: false, error: "Deve existir pelo menos um administrador no workspace" };
    }
  }

  try {
    const validated = updateUserSchema.parse(data);
    const user = await prisma.user.update({
      where: { id, workspaceId: session.user.workspaceId },
      data: { name: validated.name, role: validated.role },
    });

    revalidatePath("/users");
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar usuário" };
  }
}

export async function deleteUser(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN)
    return { success: false, error: "Sem permissão para excluir usuários" };

  if (id === session.user.id)
    return { success: false, error: "Você não pode excluir sua própria conta" };

  try {
    await prisma.user.delete({ where: { id, workspaceId: session.user.workspaceId } });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir usuário" };
  }
}
