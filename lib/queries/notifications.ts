import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function getNotifications(limit: number = 20) {
  const session = await authOptions;
  // This is a server-side function, we need to get session differently
  // The actual session is passed from the calling function
  return null;
}

export async function getNotificationsByUserId(
  userId: string,
  workspaceId: string,
  limit: number = 20,
) {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return notifications;
}

export async function getUnreadNotificationCount(userId: string, workspaceId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      workspaceId,
      isRead: false,
    },
  });

  return count;
}

export async function getNotificationsWithPagination(
  userId: string,
  workspaceId: string,
  page: number = 1,
  limit: number = 20,
) {
  const offset = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    }),
    prisma.notification.count({
      where: {
        userId,
        workspaceId,
      },
    }),
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
