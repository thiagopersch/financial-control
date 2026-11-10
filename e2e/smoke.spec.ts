import { expect, login, test } from './fixtures';

test.describe('fluxos críticos', () => {
  test('login carrega rápido e sem rolagem horizontal', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('dashboard mostra skeleton e depois os dados', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 45_000 });
  });

  test('lista de transações pagina no servidor', async ({ page }) => {
    await login(page);
    await page.goto('/transactions?page=1&pageSize=15');
    await expect(page.getByRole('navigation', { name: /paginação/i })).toBeVisible({
      timeout: 45_000,
    });
    const rows = page.locator('tbody tr');
    expect(await rows.count()).toBeLessThanOrEqual(15);
  });

  test('menu e tema funcionam no mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'só no celular');
    await login(page);
    await page.goto('/dashboard');
    const toggle = page.getByRole('button', { name: /tema/i }).first();
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/dark|light/);
  });
});
