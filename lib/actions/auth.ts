"use server";

import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("E-mail inválido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .max(30, "A senha deve ter no máximo 30 caracteres"),
  companyName: z.string().min(2, "O nome da empresa deve ter pelo menos 2 caracteres"),
});

export type RegisterData = z.infer<typeof registerSchema>;

export async function register(data: RegisterData) {
  try {
    const validatedData = registerSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: "Usuário com este e-mail já existe." };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // multi-tenant: create workspace and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: validatedData.companyName,
        },
      });

      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: Role.ADMIN,
          workspaceId: workspace.id,
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
        },
      });

      // Create default categories
      await tx.category.createMany({
        data: [
          { name: "Vendas", type: "INCOME", color: "#10b981", workspaceId: workspace.id },
          { name: "Serviços", type: "INCOME", color: "#3b82f6", workspaceId: workspace.id },
          { name: "Aluguel", type: "EXPENSE", color: "#ef4444", workspaceId: workspace.id },
          { name: "Salários", type: "EXPENSE", color: "#f59e0b", workspaceId: workspace.id },
          { name: "Marketing", type: "EXPENSE", color: "#8b5cf6", workspaceId: workspace.id },
        ],
      });

      return { user, workspace };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Dados inválidos." };
    }
    return { success: false, error: "Ocorreu um erro ao criar sua conta." };
  }
}
