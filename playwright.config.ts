import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de ponta a ponta em desktop, celular (Android e iPhone) e internet
 * lenta (3G emulado via CDP). Rodam contra o dev server local:
 *
 *   npx playwright install   # uma vez, baixa os navegadores
 *   npm run test:e2e
 *
 * Credenciais: ADMIN_EMAIL / ADMIN_PASSWORD do `.env` (usuário criado pelo seed).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-android', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-iphone', use: { ...devices['iPhone 14'] } },
    {
      // Chromium com rede 3G lenta e CPU 4x mais lenta (ver e2e/fixtures.ts).
      name: 'slow-3g',
      use: { ...devices['Pixel 7'], slowNetwork: true } as never,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 3001',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
