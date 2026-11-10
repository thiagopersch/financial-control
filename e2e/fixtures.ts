import { test as base, expect, type Page } from '@playwright/test';

/** Rede "Slow 3G" do DevTools: ~400 kbps, 400ms de latência. */
const SLOW_3G = {
  offline: false,
  latency: 400,
  downloadThroughput: (400 * 1024) / 8,
  uploadThroughput: (400 * 1024) / 8,
};

export const test = base.extend<{ slowNetwork: boolean }>({
  slowNetwork: [false, { option: true }],
  page: async ({ page, slowNetwork, browserName }, use) => {
    if (slowNetwork && browserName === 'chromium') {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', SLOW_3G);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    await use(page);
  },
});

export { expect };

export async function login(page: Page) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (seed) para os testes e2e.');
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/senha/i).first().fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 45_000 });
}
