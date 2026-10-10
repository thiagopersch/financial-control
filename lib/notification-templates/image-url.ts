/** URL pública de uma imagem enviada por `/api/notification-templates/upload`. */
export const TEMPLATE_IMAGE_URL_REGEX =
  /^\/uploads\/notification-templates\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif)$/;

export function isTemplateImageUrl(value: string) {
  return TEMPLATE_IMAGE_URL_REGEX.test(value);
}
