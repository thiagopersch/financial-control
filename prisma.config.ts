import { defineConfig } from '@prisma/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually — Prisma CLI doesn't auto-load it when reading this file
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env not found — rely on shell environment
  }
}

loadEnv();

export default defineConfig({
  migrations: {
    seed: 'npx ts-node -P tsconfig.seed.json prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
