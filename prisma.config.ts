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
    // The Prisma CLI (migrate/db push/introspect) needs a direct (non-pooled)
    // connection: it relies on Postgres advisory locks, which aren't reliably
    // preserved across statements through a transaction-mode pooler like
    // Neon's `-pooler` endpoint — using it here causes `migrate deploy` to
    // hang and fail with P1002. DIRECT_URL is optional and falls back to
    // DATABASE_URL for setups without a separate pooled/direct split (e.g.
    // local Postgres). The app itself (lib/prisma.ts) always uses the pooled
    // DATABASE_URL directly and is unaffected by this.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
