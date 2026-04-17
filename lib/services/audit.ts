import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function createAuditLog({
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
}: {
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return;

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        workspaceId: session.user.workspaceId,
        action,
        entity,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function getAuditLogs(workspaceId: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where: { workspaceId } }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAuditLogsByEntity(workspaceId: string, entity: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: {
      workspaceId,
      entity,
      entityId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
