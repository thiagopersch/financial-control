import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

interface DeliveryTarget {
  userId: string;
  workspaceId: string;
  title: string;
  message: string;
}

/**
 * Best-effort delivery: never throws, since a failed WhatsApp/e-mail send
 * must not block the in-app notification that already succeeded.
 */
export async function deliverNotification({ userId, workspaceId, title, message }: DeliveryTarget) {
  try {
    const [profile, workspace] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
    ]);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!profile || !user) return;

    if (profile.notifyEmail && user.email) {
      await sendEmail(workspace, user.email, title, message);
    }

    if (profile.notifyWhatsapp && profile.phone) {
      await sendWhatsApp(workspace, profile.phone, `*${title}*\n${message}`);
    }
  } catch (error) {
    console.error('Error delivering notification:', error);
  }
}

async function sendEmail(
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

    await transporter.sendMail({
      from: workspace.smtpFrom || workspace.smtpUser,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

async function sendWhatsApp(
  workspace: { whatsappApiUrl: string | null; whatsappApiToken: string | null } | null,
  phone: string,
  message: string,
) {
  if (!workspace?.whatsappApiUrl || !workspace.whatsappApiToken) {
    return;
  }

  try {
    await fetch(workspace.whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workspace.whatsappApiToken}`,
      },
      body: JSON.stringify({ phone, message }),
    });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}
