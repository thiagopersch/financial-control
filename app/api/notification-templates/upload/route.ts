import { getSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
/** Nome do arquivo é um UUID novo a cada upload: pode ficar em cache "para sempre". */
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

/**
 * Upload de imagem dos templates de notificação.
 *
 * Produção (Vercel): vai para o Vercel Blob, servido pela CDN da Vercel com
 * cache de 1 ano — o filesystem da função é somente leitura e não é
 * compartilhado entre instâncias. Dev sem `BLOB_READ_WRITE_TOKEN`: grava em
 * `public/uploads`. O original é mantido (PNG/JPG funcionam em todo cliente
 * de e-mail); dentro do app a imagem é servida em AVIF/WebP pelo `next/image`.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de imagem inválido. Use PNG, JPEG, WEBP ou GIF.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Imagem deve ter no máximo 2MB.' }, { status: 400 });
    }

    const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const fileName = `${randomUUID()}.${extension}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`notification-templates/${fileName}`, file, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.type,
        cacheControlMaxAge: ONE_YEAR_SEC,
      });
      return NextResponse.json({ url: blob.url });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'notification-templates');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/notification-templates/${fileName}` });
  } catch (error) {
    logger.error('upload.notification_template_failed', { error });
    return NextResponse.json({ error: 'Erro ao enviar imagem' }, { status: 500 });
  }
}
