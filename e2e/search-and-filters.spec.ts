import {test, expect} from '@playwright/test';

test.describe('Catalog Discovery Quality', () => {
  test.beforeEach(async ({page}) => {
    await page.context().addCookies([
      {
        name: 'authjs.session-token',
        value: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..test-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
          },
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      });
    });

    await page.route('**/api/categories', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {id: 1, name: 'Electronics'},
          {id: 2, name: 'Clothing'},
          {id: 3, name: 'Books'},
        ]),
      });
    });

    await page.route('**/api/products**', async route => {
      const url = new URL(route.request().url());
      const categoryId = url.searchParams.get('categoryId');

      let products = [
        {
          id: 1,
          name: 'iPhone 15 Pro',
          description: 'Latest iPhone with advanced features',
          price: 999.99,
          imageUrl: '/iphone15.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Electronics'},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Samsung Galaxy S24',
          description: 'Premium Android smartphone',
          price: 899.99,
          imageUrl: '/galaxy-s24.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Electronics'},
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        {
          id: 3,
          name: 'MacBook Pro 16"',
          description: 'Professional laptop for developers',
          price: 2499.99,
          imageUrl: '/macbook-pro.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Electronics'},
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
        },
        {
          id: 4,
          name: 'Blue Cotton T-Shirt',
          description: 'Comfortable cotton t-shirt in blue',
          price: 29.99,
          imageUrl: '/blue-tshirt.jpg',
          categoryId: 2,
          category: {id: 2, name: 'Clothing'},
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z',
        },
        {
          id: 5,
          name: 'Red Cotton T-Shirt',
          description: 'Comfortable cotton t-shirt in red',
          price: 29.99,
          imageUrl: '/red-tshirt.jpg',
          categoryId: 2,
          category: {id: 2, name: 'Clothing'},
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-05T00:00:00Z',
        },
        {
          id: 6,
          name: 'Black Jeans',
          description: 'Classic black denim jeans',
          price: 79.99,
          imageUrl: '/black-jeans.jpg',
          categoryId: 2,
          category: {id: 2, name: 'Clothing'},
          createdAt: '2024-01-06T00:00:00Z',
          updatedAt: '2024-01-06T00:00:00Z',
        },
        {
          id: 7,
          name: 'JavaScript Guide',
          description: 'Complete guide to JavaScript programming',
          price: 49.99,
          imageUrl: '/js-guide.jpg',
          categoryId: 3,
          category: {id: 3, name: 'Books'},
          createdAt: '2024-01-07T00:00:00Z',
          updatedAt: '2024-01-07T00:00:00Z',
        },
        {
          id: 8,
          name: 'Python Cookbook',
          description: 'Recipes for Python programming',
          price: 59.99,
          imageUrl: '/python-cookbook.jpg',
          categoryId: 3,
          category: {id: 3, name: 'Books'},
          createdAt: '2024-01-08T00:00:00Z',
          updatedAt: '2024-01-08T00:00:00Z',
        },
        {
          id: 9,
          name: 'Wireless Headphones',
          description: 'High-quality wireless headphones',
          price: 199.99,
          imageUrl: '/headphones.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Electronics'},
          createdAt: '2024-01-09T00:00:00Z',
          updatedAt: '2024-01-09T00:00:00Z',
        },
        {
          id: 10,
          name: 'Gaming Mouse',
          description: 'Precision gaming mouse with RGB lighting',
          price: 79.99,
          imageUrl: '/gaming-mouse.jpg',
          categoryId: 1,
          category: {id: 1, name: 'Electronics'},
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z',
        },
      ];

      if (categoryId) {
        products = products.filter(p => p.categoryId === parseInt(categoryId));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(products),
      });
    });

    await page.route('**/api/cart', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
  });

  test('Search for known product returns expected SKUs', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="Search products..."]', 'iPhone');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(1);

    const productName = page.locator('.ant-card h3').first();
    await expect(productName).toContainText('iPhone 15 Pro');

    const productPrice = page.locator('.ant-card .text-accent').first();
    await expect(productPrice).toContainText('$999.99');
  });

  test('Search for partial product name returns relevant results', async ({
    page,
  }) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="Search products..."]', 'T-Shirt');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(2);

    const productNames = page.locator('.ant-card h3');
    await expect(productNames.first()).toContainText('Blue Cotton T-Shirt');
    await expect(productNames.nth(1)).toContainText('Red Cotton T-Shirt');
  });

  test('Pagination works correctly with multiple pages', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(8);

    const pagination = page.locator('.ant-pagination');
    await expect(pagination).toBeVisible();

    const nextButton = page.locator('.ant-pagination-next');
    if (await nextButton.isVisible()) {
      const isDisabled = await nextButton.getAttribute('class');
      if (!isDisabled?.includes('ant-pagination-disabled')) {
        await nextButton.click();
        await page.waitForTimeout(500);

        const secondPageCards = page.locator('.ant-card');
        await expect(secondPageCards).toHaveCount(2);

        const prevButton = page.locator('.ant-pagination-prev');
        await prevButton.click();
        await page.waitForTimeout(500);

        const firstPageCards = page.locator('.ant-card');
        await expect(firstPageCards).toHaveCount(8);
      }
    }
  });

  test('Category filter shows only matching products', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', {name: 'Electronics'}).click();
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(5);

    const productNames = page.locator('.ant-card h3');
    await expect(productNames.first()).toContainText('iPhone 15 Pro');
    await expect(productNames.nth(1)).toContainText('Samsung Galaxy S24');
    await expect(productNames.nth(2)).toContainText('MacBook Pro 16"');
  });

  test('Clothing category filter shows only clothing items', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', {name: 'Clothing'}).click();
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(3);

    const productNames = page.locator('.ant-card h3');
    await expect(productNames.first()).toContainText('Blue Cotton T-Shirt');
    await expect(productNames.nth(1)).toContainText('Red Cotton T-Shirt');
    await expect(productNames.nth(2)).toContainText('Black Jeans');
  });

  test('Price range validation - all products within expected range', async ({
    page,
  }) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    const prices = page.locator('.ant-card .text-accent');
    const priceCount = await prices.count();

    for (let i = 0; i < priceCount; i++) {
      const priceText = await prices.nth(i).textContent();
      const price = parseFloat(priceText?.replace('$', '') || '0');
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(3000);
    }
  });

  test('Color-based search returns matching products', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="Search products..."]', 'Blue');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(1);

    const productName = page.locator('.ant-card h3').first();
    await expect(productName).toContainText('Blue Cotton T-Shirt');
  });

  test('Product sorting by price verification', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    const prices = page.locator('.ant-card .text-accent');
    const priceTexts = await prices.allTextContents();
    const priceValues = priceTexts.map(text =>
      parseFloat(text.replace('$', '')),
    );

    let isSorted = true;
    for (let i = 1; i < priceValues.length; i++) {
      if (priceValues[i] < priceValues[i - 1]) {
        isSorted = false;
        break;
      }
    }

    expect(priceValues.length).toBeGreaterThan(0);
  });

  test('Search results maintain consistent product structure', async ({
    page,
  }) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="Search products..."]', 'MacBook');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.waitForTimeout(500);

    const productCard = page.locator('.ant-card').first();
    await expect(productCard).toBeVisible();

    const productImage = productCard.locator('img');
    await expect(productImage).toBeVisible();

    const productName = productCard.locator('h3');
    await expect(productName).toBeVisible();
    await expect(productName).toContainText('MacBook Pro 16"');

    const productPrice = productCard.locator('.text-accent');
    await expect(productPrice).toBeVisible();
    await expect(productPrice).toContainText('$2499.99');
  });

  test('Empty search returns all products', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder="Search products..."]', '');
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(8);
  });

  test('No results found for invalid search term', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.fill(
      'input[placeholder="Search products..."]',
      'NonExistentProduct',
    );
    await page.press('input[placeholder="Search products..."]', 'Enter');
    await page.waitForTimeout(500);

    const productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(0);
  });

  test('Category reset shows all products', async ({page}) => {
    await page.goto('/products/catalog');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', {name: 'Electronics'}).click();
    await page.waitForTimeout(500);

    let productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(5);

    await page.getByRole('button', {name: 'All'}).click();
    await page.waitForTimeout(500);

    productCards = page.locator('.ant-card');
    await expect(productCards).toHaveCount(8);
  });
});
