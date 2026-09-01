import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import type { BlockTree } from '@/lib/notification-templates/block-types';
import { getServerSession } from 'next-auth';

export type NotificationTemplateDTO = {
  id: string;
  name: string;
  type: string;
  channel: 'EMAIL' | 'WHATSAPP';
  subject: string;
  bodyHtml: string;
  bodyWhatsapp: string;
  content: BlockTree | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedByName: string;
};

function toDTO(template: {
  id: string;
  name: string;
  type: string;
  channel: string;
  subject: string;
  bodyHtml: string;
  bodyWhatsapp: string;
  content: unknown;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string | null; email: string };
}): NotificationTemplateDTO {
  return {
    id: template.id,
    name: template.name,
    type: template.type,
    channel: template.channel as 'EMAIL' | 'WHATSAPP',
    subject: template.subject,
    bodyHtml: template.bodyHtml,
    bodyWhatsapp: template.bodyWhatsapp,
    content: (template.content as BlockTree | null) ?? null,
    imageUrl: template.imageUrl,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    updatedByName: template.user.name ?? template.user.email,
  };
}

export async function getNotificationTemplates(): Promise<NotificationTemplateDTO[]> {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  try {
    const templates = await prisma.notificationTemplate.findMany({
      where: { workspaceId: session.user.workspaceId, userId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map(toDTO);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return [];
  }
}

export async function getNotificationTemplate(id: string): Promise<NotificationTemplateDTO | null> {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const template = await prisma.notificationTemplate.findFirst({
      where: { id, workspaceId: session.user.workspaceId, userId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    return template ? toDTO(template) : null;
  } catch (error) {
    console.error('Error fetching notification template:', error);
    return null;
  }
}
