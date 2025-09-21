import {test, expect, Page} from '@playwright/test';

async function captureConsoleErrors(page: Page): Promise<string[]> {
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  return consoleErrors;
}

async function stubExternalCalls(page: Page): Promise<void> {
  await page.route('**/analytics/**', route => route.fulfill({status: 200}));
  await page.route('**/ping', route => route.fulfill({status: 200}));
}

test.describe('E-Commerce Smoke Tests', () => {
  test.beforeEach(async ({page}) => {
    await stubExternalCalls(page);
  });

  test('Home page renders with header, footer, and main content', async ({
    page,
  }) => {
    const consoleErrors = await captureConsoleErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(
      page.locator('header').getByRole('heading', {name: 'E-shop'}),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', {name: /home/i})).toBeVisible();
    await expect(
      page.getByRole('menuitem', {name: /categories/i}),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', {name: /products/i})).toBeVisible();
    await expect(
      page.getByRole('heading', {name: /welcome to e-shop/i}),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {name: /featured products/i}),
    ).toBeVisible();
    await expect(page.getByRole('link', {name: /shop now/i})).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(
      page.getByText(/© \d{4} E-Shop\. All rights reserved\./),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {name: /terms of service/i}),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {name: /privacy policy/i}),
    ).toBeVisible();

    const filteredErrors = consoleErrors.filter(
      error =>
        !error.includes('React 19') &&
        !error.includes('500') &&
        error !== 'Error',
    );
    expect(filteredErrors).toHaveLength(0);
  });

  test('Navigate via Shop Now button to product catalog', async ({page}) => {
    const consoleErrors = await captureConsoleErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', {name: /shop now/i}).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/products/catalog');
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();

    const filteredErrors = consoleErrors.filter(
      error =>
        !error.includes('React 19') &&
        !error.includes('500') &&
        error !== 'Error',
    );
    expect(filteredErrors).toHaveLength(0);
  });

  test('Basic accessibility check on home page', async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for main structural elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    await expect(page.locator('.ant-menu')).toBeVisible();

    const h1Elements = page.getByRole('heading', {level: 1});
    await expect(h1Elements.first()).toBeVisible();

    const shopNowButton = page.getByRole('link', {name: /shop now/i});
    await shopNowButton.focus();
    await expect(shopNowButton).toBeFocused();

    const homeMenuItem = page
      .locator('.ant-menu-item')
      .filter({hasText: 'Home'});
    await homeMenuItem.focus();
    await expect(homeMenuItem).toBeFocused();

    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const altText = await firstImage.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });
});
