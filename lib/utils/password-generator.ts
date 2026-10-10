import { PASSWORD_RULES } from '@/lib/validations/password';

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar a digitação da senha temporária.
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%&*+-?';
const ALL = UPPERCASE + LOWERCASE + DIGITS + SPECIAL;

/** Inteiro uniforme em [0, max) via CSPRNG — funciona no server (Node) e no browser. */
function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

const randomChar = (charset: string) => charset[randomInt(charset.length)];

/** Gera uma senha aleatória que sempre satisfaz `passwordSchema()`. */
export function generateTemporaryPassword(length = 12): string {
  const size = Math.min(Math.max(length, PASSWORD_RULES.minLength), PASSWORD_RULES.maxLength);
  const chars = [
    randomChar(UPPERCASE),
    randomChar(LOWERCASE),
    randomChar(DIGITS),
    randomChar(SPECIAL),
    ...Array.from({ length: size - 4 }, () => randomChar(ALL)),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
