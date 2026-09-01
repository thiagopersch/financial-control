import {
  applyConditionals,
  interpolate,
  stripHtml,
} from '@/lib/notification-templates/interpolate';
import { resolveEmailBodyHtml } from '@/lib/notification-templates/render';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import path from 'path';

interface DeliveryTarget {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

function absoluteImageUrl(imageUrl: string) {
  // NEXTAUTH_URL is already required for NextAuth to work, so it's guaranteed
  // to be set per-environment — used as a fallback in case NEXT_PUBLIC_APP_URL
  // (an explicit override) isn't configured.
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  return base ? `${base.replace(/\/$/, '')}${imageUrl}` : null;
}

/**
 * Best-effort delivery: never throws, since a failed WhatsApp/e-mail send
 * must not block the in-app notification that already succeeded.
 */
export async function deliverNotification({
  userId,
  workspaceId,
  type,
  title,
  message,
  metadata,
}: DeliveryTarget) {
  try {
    const [profile, workspace, user, emailTemplate, whatsappTemplate] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.notificationTemplate.findFirst({
        where: { userId, workspaceId, type: type as never, channel: 'EMAIL', isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationTemplate.findFirst({
        where: { userId, workspaceId, type: type as never, channel: 'WHATSAPP', isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!profile || !user) return;

    const vars: Record<string, unknown> = { title, message, ...(metadata || {}) };

    if (profile.notifyEmail && user.email) {
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
        );
      } else {
        await sendEmail(workspace, user.email, title, message, null, null);
      }
    }

    if (profile.notifyWhatsapp && profile.phone) {
      const waMessage = whatsappTemplate
        ? stripHtml(interpolate(whatsappTemplate.bodyWhatsapp, vars))
        : `*${title}*\n${message}`;
      await sendWhatsApp(workspace, profile.phone, waMessage, whatsappTemplate?.imageUrl ?? null);
    }
  } catch (error) {
    console.error('Error delivering notification:', error);
  }
}

export async function sendEmail(
  workspace: {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPassword: string | null;
    smtpFrom: string | null;
  } | null,
  to: string,
  subject: string,
  text: string,
  html: string | null,
  imageUrl: string | null,
) {
  if (!workspace?.smtpHost || !workspace.smtpUser || !workspace.smtpPassword) {
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: workspace.smtpHost,
      port: workspace.smtpPort || 587,
      secure: workspace.smtpPort === 465,
      auth: {
        user: workspace.smtpUser,
        pass: workspace.smtpPassword,
      },
    });

    const attachments =
      imageUrl && imageUrl.startsWith('/uploads/')
        ? [
            {
              filename: path.basename(imageUrl),
              path: path.join(process.cwd(), 'public', imageUrl),
              cid: 'notification-image',
            },
          ]
        : [];

    const htmlWithImage =
      html && attachments.length > 0
        ? `${html}<p><img src="cid:notification-image" style="max-width:100%;margin-top:12px" alt="" /></p>`
        : html;

    await transporter.sendMail({
      from: workspace.smtpFrom || workspace.smtpUser,
      to,
      subject,
      text,
      html: htmlWithImage || undefined,
      attachments,
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

export async function sendWhatsApp(
  workspace: { whatsappApiUrl: string | null; whatsappApiToken: string | null } | null,
  phone: string,
  message: string,
  imageUrl: string | null,
) {
  if (!workspace?.whatsappApiUrl || !workspace.whatsappApiToken) {
    return;
  }

  try {
    const mediaUrl = imageUrl ? absoluteImageUrl(imageUrl) : null;

    await fetch(workspace.whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workspace.whatsappApiToken}`,
      },
      body: JSON.stringify({ phone, message, ...(mediaUrl ? { mediaUrl } : {}) }),
    });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}
