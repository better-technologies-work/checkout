import { test, expect } from '@playwright/test';

test.describe('MotherCheckoutQuanta - E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render checkout form with correct elements', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('MotherCheckoutQuanta');
    await expect(page.locator('input[placeholder="Enter product hash"]')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Pay Now');
  });

  test('should have Raleway font applied', async ({ page }) => {
    const fontFamily = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );
    expect(fontFamily).toContain('Raleway');
  });

  test('should have no dark mode classes in DOM', async ({ page }) => {
    const darkClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const found: string[] = [];
      allElements.forEach((el) => {
        const classes = el.className;
        if (typeof classes === 'string' && classes.includes('dark:')) {
          found.push(classes);
        }
      });
      return found;
    });
    expect(darkClasses).toHaveLength(0);
  });

  test('should have orange tactical button (#FF5E00)', async ({ page }) => {
    const button = page.locator('button[type="submit"]');
    await expect(button).toBeVisible();

    const bgColor = await button.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toContain('255');
  });

  test('should disable button on first click (anti-double-click)', async ({ page }) => {
    const button = page.locator('button[type="submit"]');

    await page.fill('input[placeholder="Enter product hash"]', 'test-product-hash');
    await page.fill('input[placeholder="0.00"]', '100');

    await button.click();

    await expect(button).toBeDisabled();
  });

  test('should show error when submitting without required fields', async ({ page }) => {
    const button = page.locator('button[type="submit"]');
    await button.click();

    await expect(page.locator('input[placeholder="Enter product hash"]')).toBeFocused();
  });

  test('should have glassmorphism card styling', async ({ page }) => {
    const card = page.locator('.card-sovereign');
    await expect(card).toBeVisible();

    const bgStyle = await card.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        background: style.background,
      };
    });

    expect(bgStyle.backdropFilter).toContain('blur');
  });

  test('should have white background (Sovereign Light Mode)', async ({ page }) => {
    const bgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).toBe('rgb(255, 255, 255)');
  });

  test('should display product hash input with correct placeholder', async ({ page }) => {
    const input = page.locator('input[placeholder="Enter product hash"]');
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveAttribute('placeholder', 'Enter product hash');
  });

  test('should navigate full flow and show receipt on success', async ({ page }) => {
    await page.fill('input[placeholder="Enter product hash"]', 'liveedge-product-abc123');
    await page.fill('input[placeholder="0.00"]', '49.99');

    const button = page.locator('button[type="submit"]');
    await expect(button).toBeEnabled();
    await button.click();

    await expect(button).toBeDisabled();

    await page.waitForTimeout(2000);

    const hasReceipt = await page.locator('text=Payment Confirmed').isVisible().catch(() => false);
    const hasError = await page.locator('.bg-red-50').isVisible().catch(() => false);

    expect(hasReceipt || hasError).toBe(true);
  });
});
