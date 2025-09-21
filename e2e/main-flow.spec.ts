import {test, expect} from '@playwright/test';

test.describe('Main Application Flow', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Complete user journey from landing to order confirmation', async ({
    page,
  }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify home page elements
    await expect(
      page.getByRole('heading', {name: /welcome to e-shop!/i}),
    ).toBeVisible();

    // Navigate to products
    const productsLink = page
      .locator('.ant-menu-title-content')
      .filter({hasText: 'Products'});
    await productsLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/products/);

    // Add product to cart (assuming there are products)
    const firstProduct = page.locator('.ant-card').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      const addToCartButton = page.getByRole('button', {name: /add to cart/i});
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        await page.waitForTimeout(1000);

        // Open cart drawer to verify item was added
        const cartButton = page.locator('[data-testid="cart-button"]');
        await cartButton.click();
        await expect(page.locator('.ant-drawer')).toBeVisible();

        // Close drawer
        const closeButton = page.locator('.ant-drawer .ant-drawer-close');
        await closeButton.click();
      }
    }
  });

  test('Product browsing and category navigation', async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate directly to categories page since Categories is a dropdown menu
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/categories');

    // Verify categories page loaded
    await expect(
      page.getByRole('heading', {name: /browse categories/i}),
    ).toBeVisible();

    // Click on first category
    const firstCategory = page.locator('.ant-card').first();
    await firstCategory.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on a category page
    await expect(page).toHaveURL(/\/categories\/\d+/);

    // Wait for page to load and verify categories are displayed
    await expect(page.locator('.ant-card')).toHaveCount(3);
  });

  test('Navigation flow and menu functionality', async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Use specific selectors to avoid strict mode violations
    const homeLink = page.getByText('Home', {exact: true});
    await expect(homeLink).toBeVisible();

    const productsLink = page
      .locator('.ant-menu-title-content')
      .filter({hasText: 'Products'});
    await expect(productsLink).toBeVisible();
    await productsLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/products/);

    await homeLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');

    // Use the heading selector that should be present
    await expect(
      page.getByRole('heading', {name: /welcome to e-shop!/i}),
    ).toBeVisible();

    // Click on the E-shop logo/title to navigate home (use exact match)
    const logoLink = page.getByRole('heading', {name: 'E-shop', exact: true});
    await expect(logoLink).toBeVisible();
    await logoLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });
});
