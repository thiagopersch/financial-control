import { fetchWithTimeout, resolveTimeoutMs } from '@/lib/http/fetch-with-timeout';
import { logger } from '@/lib/logger';
import { isBlobImageUrl, isTemplateImageUrl } from '@/lib/notification-templates/image-url';
import {
  applyConditionals,
  interpolate,
  stripHtml,
} from '@/lib/notification-templates/interpolate';
import { resolveEmailBodyHtml } from '@/lib/notification-templates/render';
import prisma from '@/lib/prisma';
import type { NotificationTemplate } from '@prisma/client';
import { readFile } from 'fs/promises';
import nodemailer, { type Transporter } from 'nodemailer';
import path from 'path';

export interface DeliveryTarget {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

function absoluteImageUrl(imageUrl: string) {
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  // NEXTAUTH_URL is already required for NextAuth to work, so it's guaranteed
  // to be set per-environment — used as a fallback in case NEXT_PUBLIC_APP_URL
  // (an explicit override) isn't configured.
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  return base ? `${base.replace(/\/$/, '')}${imageUrl}` : null;
}

type DeliveryWorkspace = SmtpWorkspace & {
  whatsappApiUrl: string | null;
  whatsappApiToken: string | null;
};

/**
 * Best-effort delivery: never throws, since a failed WhatsApp/e-mail send
 * must not block the in-app notification that already succeeded.
 */
export async function deliverNotification(target: DeliveryTarget) {
  await deliverNotifications([target]);
}

/**
 * Entrega várias notificações do mesmo workspace com as consultas feitas uma
 * única vez (workspace, usuários/perfis e templates) e um único transport SMTP
 * com pool — antes eram 5 consultas e uma conexão SMTP nova por notificação.
 */
export async function deliverNotifications(targets: DeliveryTarget[]) {
  if (targets.length === 0) return;
  const byWorkspace = new Map<string, DeliveryTarget[]>();
  for (const target of targets) {
    const list = byWorkspace.get(target.workspaceId) ?? [];
    list.push(target);
    byWorkspace.set(target.workspaceId, list);
  }
  await Promise.all(
    Array.from(byWorkspace, ([workspaceId, list]) => deliverForWorkspace(workspaceId, list)),
  );
}

async function deliverForWorkspace(workspaceId: string, targets: DeliveryTarget[]) {
  let transporter: Transporter | null = null;
  try {
    const userIds = [...new Set(targets.map((t) => t.userId))];
    const types = [...new Set(targets.map((t) => t.type))];

    const [workspace, users, templates] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          whatsappApiUrl: true,
          whatsappApiToken: true,
          smtpHost: true,
          smtpPort: true,
          smtpUser: true,
          smtpPassword: true,
          smtpFrom: true,
          externalApiTimeoutMs: true,
        },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds }, workspaceId },
        select: {
          id: true,
          email: true,
          profile: { select: { notifyEmail: true, notifyWhatsapp: true, phone: true } },
        },
      }),
      prisma.notificationTemplate.findMany({
        where: {
          userId: { in: userIds },
          workspaceId,
          type: { in: types as never[] },
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Template mais recente por usuário/tipo/canal (mesma regra do findFirst anterior).
    const templateIndex = new Map<string, NotificationTemplate>();
    for (const template of templates) {
      const key = `${template.userId}:${template.type}:${template.channel}`;
      if (!templateIndex.has(key)) templateIndex.set(key, template);
    }
    const userById = new Map(users.map((u) => [u.id, u]));

    if (isSmtpConfigured(workspace)) transporter = createTransport(workspace!, { pool: true });

    for (const { userId, type, title, message, metadata } of targets) {
      const user = userById.get(userId);
      const profile = user?.profile;
      if (!user || !profile) continue;

      const vars: Record<string, unknown> = { title, message, ...(metadata || {}) };

      if (profile.notifyEmail && user.email && transporter) {
        const emailTemplate = templateIndex.get(`${userId}:${type}:EMAIL`);
        if (emailTemplate) {
          const subject = interpolate(emailTemplate.subject, vars);
          const htmlBody = interpolate(
            applyConditionals(resolveEmailBodyHtml(emailTemplate), vars),
            vars,
          );
          await sendEmail(
            workspace,
            user.email,
            subject,
            stripHtml(htmlBody),
            htmlBody,
            emailTemplate.imageUrl,
            undefined,
            transporter,
          );
        } else {
          await sendEmail(
            workspace,
            user.email,
            title,
            message,
            null,
            null,
            undefined,
            transporter,
          );
        }
      }

      if (profile.notifyWhatsapp && profile.phone) {
        const whatsappTemplate = templateIndex.get(`${userId}:${type}:WHATSAPP`);
        const waMessage = whatsappTemplate
          ? stripHtml(interpolate(whatsappTemplate.bodyWhatsapp, vars))
          : `*${title}*\n${message}`;
        await sendWhatsApp(
          workspace as DeliveryWorkspace | null,
          profile.phone,
          waMessage,
          whatsappTemplate?.imageUrl ?? null,
        );
      }
    }
  } catch (error) {
    logger.error('notification.delivery_failed', { workspaceId, error });
  } finally {
    transporter?.close();
  }
}

const TEMPLATE_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'notification-templates');

/**
 * Conteúdo da imagem do template, apenas se for um upload válido: arquivo
 * local dentro da pasta de uploads (impede path traversal como
 * `/uploads/../../.env`) ou um objeto do Vercel Blob da própria aplicação.
 */
async function loadTemplateImage(imageUrl: string | null, timeoutMs: number) {
  if (!imageUrl || !isTemplateImageUrl(imageUrl)) return null;

  if (isBlobImageUrl(imageUrl)) {
    const res = await fetchWithTimeout(imageUrl, { timeoutMs });
    if (!res.ok) throw new Error(`Falha ao baixar imagem do template (${res.status})`);
    return {
      filename: path.basename(new URL(imageUrl).pathname),
      content: Buffer.from(await res.arrayBuffer()),
    };
  }

  const resolved = path.resolve(TEMPLATE_UPLOAD_DIR, path.basename(imageUrl));
  if (!resolved.startsWith(TEMPLATE_UPLOAD_DIR + path.sep)) return null;
  return { filename: path.basename(resolved), content: await readFile(resolved) };
}

type SmtpWorkspace = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpFrom: string | null;
  externalApiTimeoutMs?: number | null;
} | null;

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  cid?: string;
  contentType?: string;
}

export interface EmailMessage {
  to: string | string[];
  cc?: string[];
  subject: string;
  text: string;
  html: string | null;
  imageUrl?: string | null;
  attachments?: EmailAttachment[];
}

export function isSmtpConfigured(workspace: SmtpWorkspace): boolean {
  return Boolean(workspace?.smtpHost && workspace.smtpUser && workspace.smtpPassword);
}

/**
 * Transport SMTP com os timeouts do workspace (o padrão do nodemailer chega a
 * 10 minutos por socket). `pool: true` reaproveita a conexão entre envios.
 */
function createTransport(workspace: NonNullable<SmtpWorkspace>, options: { pool?: boolean } = {}) {
  const timeoutMs = resolveTimeoutMs(workspace.externalApiTimeoutMs);
  return nodemailer.createTransport({
    ...(options.pool ? { pool: true, maxConnections: 2 } : {}),
    // Nunca deixar o conteúdo da mensagem ler arquivos locais ou URLs arbitrárias.
    disableFileAccess: true,
    disableUrlAccess: true,
    host: workspace.smtpHost!,
    port: workspace.smtpPort || 587,
    secure: workspace.smtpPort === 465,
    auth: {
      user: workspace.smtpUser!,
      pass: workspace.smtpPassword!,
    },
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  });
}

/**
 * Sends an e-mail and throws on failure (missing SMTP config included) — for
 * callers that must record the outcome, like scheduled report e-mails.
 */
export async function sendEmailOrThrow(
  workspace: SmtpWorkspace,
  message: EmailMessage,
  sharedTransporter?: Transporter,
) {
  if (!workspace || !isSmtpConfigured(workspace)) {
    throw new Error('SMTP não configurado no workspace');
  }

  const transporter = sharedTransporter ?? createTransport(workspace);
  try {
    const image = await loadTemplateImage(
      message.imageUrl ?? null,
      resolveTimeoutMs(workspace.externalApiTimeoutMs),
    );
    const imageAttachments = image ? [{ ...image, cid: 'notification-image' }] : [];

    const htmlWithImage =
      message.html && imageAttachments.length > 0
        ? `${message.html}<p><img src="cid:notification-image" style="max-width:100%;margin-top:12px" alt="" /></p>`
        : message.html;

    await transporter.sendMail({
      from: workspace.smtpFrom || workspace.smtpUser!,
      to: message.to,
      cc: message.cc?.length ? message.cc : undefined,
      subject: message.subject,
      text: message.text,
      html: htmlWithImage || undefined,
      attachments: [...imageAttachments, ...(message.attachments ?? [])],
    });
  } finally {
    if (!sharedTransporter) transporter.close();
  }
}

export async function sendEmail(
  workspace: SmtpWorkspace,
  to: string,
  subject: string,
  text: string,
  html: string | null,
  imageUrl: string | null,
  attachments?: EmailAttachment[],
  sharedTransporter?: Transporter,
) {
  if (!isSmtpConfigured(workspace)) {
    return;
  }

  try {
    await sendEmailOrThrow(
      workspace,
      { to, subject, text, html, imageUrl, attachments },
      sharedTransporter,
    );
  } catch (error) {
    logger.error('notification.email_failed', { error });
  }
}

export async function sendWhatsApp(
  workspace: {
    whatsappApiUrl: string | null;
    whatsappApiToken: string | null;
    externalApiTimeoutMs?: number | null;
  } | null,
  phone: string,
  message: string,
  imageUrl: string | null,
) {
  if (!workspace?.whatsappApiUrl || !workspace.whatsappApiToken) {
    return;
  }

  try {
    const mediaUrl = imageUrl ? absoluteImageUrl(imageUrl) : null;

    const res = await fetchWithTimeout(workspace.whatsappApiUrl, {
      method: 'POST',
      timeoutMs: workspace.externalApiTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workspace.whatsappApiToken}`,
      },
      body: JSON.stringify({ phone, message, ...(mediaUrl ? { mediaUrl } : {}) }),
    });
    if (!res.ok) {
      logger.warn('notification.whatsapp_rejected', { status: res.status });
    }
  } catch (error) {
    logger.error('notification.whatsapp_failed', { error });
  }
}
