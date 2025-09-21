import {test, expect} from '@playwright/test';

test.describe('Basic Application Flow', () => {
  test.beforeEach(async ({page}) => {
    await page.route('**/api/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'iPhone 15 Pro',
            price: 999.99,
            category: 'Electronics',
            imageUrl: '/images/iphone-15-pro.jpg',
            description: 'Latest iPhone model',
          },
          {
            id: 2,
            name: 'MacBook Pro',
            price: 1999.99,
            category: 'Electronics',
            imageUrl: '/images/macbook-pro.jpg',
            description: 'Powerful laptop',
          },
        ]),
      });
    });

    await page.route('**/api/categories', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {id: 1, name: 'Electronics', slug: 'electronics'},
          {id: 2, name: 'Clothing', slug: 'clothing'},
        ]),
      });
    });

    await page.route('**/api/cart', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Item added to cart',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 1,
                name: 'iPhone 15 Pro',
                price: 999.99,
                quantity: 1,
              },
            ],
          }),
        });
      }
    });

    await page.route('**/analytics/**', route => route.fulfill({status: 200}));
    await page.route('**/ping', route => route.fulfill({status: 200}));
  });

  test('Home page loads and basic navigation works', async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check basic page structure
    await expect(page.locator('body')).toBeVisible();

    // Check for the main heading on home page
    await expect(
      page.getByRole('heading', {name: /welcome to e-shop!/i}),
    ).toBeVisible();

    // Check for the E-shop title in header (be more specific)
    await expect(
      page.getByRole('heading', {name: 'E-shop', exact: true}),
    ).toBeVisible();

    // Check navigation menu items exist (use more specific selectors)
    await expect(page.getByText('Home', {exact: true})).toBeVisible();
    await expect(
      page.locator('.ant-menu-title-content').filter({hasText: 'Products'}),
    ).toBeVisible();
    await expect(page.getByText('Categories', {exact: true})).toBeVisible();
  });

  test('Can navigate to products page', async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to find and click a link to products
    const productsLink = page.locator('a[href*="products"]').first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/products/);
    } else {
      // Fallback: navigate directly
      await page.goto('/products/catalog');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/products/);
    }

    // Check page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('Basic cart functionality', async ({page}) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    // Check cart page loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/cart/);
  });

  test('Basic checkout page loads', async ({page}) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Check checkout page loads
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test('Navigation menu is functional', async ({page}) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check navigation menu items exist and are clickable (use specific selectors)
    await expect(page.getByText('Home', {exact: true})).toBeVisible();
    await expect(
      page.locator('.ant-menu-title-content').filter({hasText: 'Products'}),
    ).toBeVisible();
    await expect(page.getByText('Categories', {exact: true})).toBeVisible();

    await page
      .locator('.ant-menu-title-content')
      .filter({hasText: 'Products'})
      .click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/products/);

    // Navigate back to home
    await page.getByText('Home', {exact: true}).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });
});
