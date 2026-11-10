const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const EXT = '(png|jpg|webp|gif)';

/** Upload legado gravado em `public/uploads` (dev local sem Blob). */
const LOCAL_IMAGE_URL = `/uploads/notification-templates/${UUID}\\.${EXT}`;

/** Upload no Vercel Blob (servido pela CDN da Vercel). */
const BLOB_IMAGE_URL = `https://[a-z0-9]+\\.public\\.blob\\.vercel-storage\\.com/notification-templates/${UUID}\\.${EXT}`;

/** URL de uma imagem enviada por `/api/notification-templates/upload`. */
export const TEMPLATE_IMAGE_URL_REGEX = new RegExp(`^(?:${LOCAL_IMAGE_URL}|${BLOB_IMAGE_URL})$`);

export function isTemplateImageUrl(value: string) {
  return TEMPLATE_IMAGE_URL_REGEX.test(value);
}

export function isBlobImageUrl(value: string) {
  return new RegExp(`^${BLOB_IMAGE_URL}$`).test(value);
}
