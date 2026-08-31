/**
 * Normaliza texto para busca: minúsculas, sem acentuação e sem caracteres
 * especiais (mantém apenas letras, números e espaços).
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}
