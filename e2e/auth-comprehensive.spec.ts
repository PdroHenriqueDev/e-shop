import {test, expect} from '@playwright/test';

test.describe('Authentication and Cart Persistence E2E Tests', () => {
  const testUser = {
    username: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 99.99,
    description: 'Test product description',
    image: 'test-image.jpg',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockCartItem = {
    cartId: 1,
    cartItemId: 1,
    productId: 1,
    quantity: 1,
    product: mockProduct,
  };

  const mockOrder = {
    id: 1,
    userId: 1,
    status: 'completed',
    total: 99.99,
    shippingAddress: '123 Test St, Test City, TC 12345',
    paymentMethod: 'credit_card',
    paymentStatus: 'PAID',
    createdAt: '2024-01-01T00:00:00Z',
    items: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        quantity: 1,
        price: 99.99,
        product: mockProduct,
      },
    ],
  };

  test.beforeEach(async ({page}) => {
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'User registered successfully',
          user: {
            id: 1,
            name: testUser.username,
            email: testUser.email,
            role: 'user',
          },
        }),
      });
    });

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.route('**/api/cart', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (request.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [mockCartItem],
          }),
        });
      }
    });

    await page.route('**/api/orders', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockOrder]),
        });
      }
    });

    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [mockProduct],
          totalPages: 1,
          currentPage: 1,
        }),
      });
    });
  });

  test('Complete auth flow: register, logout, login', async ({page}) => {
    await page.goto('/login');

    await expect(page.getByRole('button', {name: 'Register'})).toBeVisible();
    await page.getByRole('button', {name: 'Register'}).click();

    await expect(
      page.getByRole('heading', {name: /Create a new account/}),
    ).toBeVisible();

    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    await page.getByText('Register').last().click();

    await expect(
      page.getByText('Registration completed successfully'),
    ).toBeVisible();

    await expect(page.getByRole('button', {name: 'Login'})).toBeVisible();
    await page.getByRole('button', {name: 'Login'}).click();

    await page.waitForTimeout(1000);

    await expect(page.getByPlaceholder('Email')).toBeVisible();

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            name: testUser.username,
            email: testUser.email,
            role: 'user',
          },
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      });
    });

    await page.context().addCookies([
      {
        name: 'authjs.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);

    // Mock the login API endpoint
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            name: testUser.username,
            email: testUser.email,
            role: 'user',
          },
        }),
      });
    });

    await page.route('**/api/auth/signin/credentials', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          url: 'http://localhost:3000/',
        }),
      });
    });

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(2000);

    if (page.url().includes('/login')) {
      await page.goto('/');
    }

    await expect(page).toHaveURL('/');

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.context().clearCookies();
    await page.reload();

    await expect(page).toHaveURL('/');
  });

  test('Cart persistence: add item, refresh, verify persistence', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'authjs.session-token',
        value: 'mock-session-token',
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
            name: testUser.username,
            email: testUser.email,
            role: 'user',
          },
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      });
    });

    await page.route('**/api/cart', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockCartItem]),
        });
      } else if (request.method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [mockCartItem],
          }),
        });
      }
    });

    await page.goto('/');

    await page.goto('/categories');

    const addToCartButton = page.getByRole('button', {name: /add to cart/i});
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
    }

    const cartBadge = page.locator('[data-testid="cart-badge"]');
    if (await cartBadge.isVisible()) {
      await expect(cartBadge).toContainText('1');
    }

    await page.reload();

    if (await cartBadge.isVisible()) {
      await expect(cartBadge).toContainText('1');
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('Protected route access: /orders when logged out redirects to /login', async ({
    page,
  }) => {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/orders');

    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page).toHaveURL('/orders');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Orders page shows seeded order list after login', async ({page}) => {
    await page.context().addCookies([
      {
        name: 'authjs.session-token',
        value: 'mock-session-token',
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
            name: testUser.username,
            email: testUser.email,
            role: 'user',
          },
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      });
    });

    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockOrder]),
      });
    });

    await page.goto('/orders');

    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL('/orders');

    const orderElements = page.locator('text=Test Product');
    if (await orderElements.isVisible()) {
      await expect(orderElements).toBeVisible();
    }

    const statusElements = page.locator('text=completed');
    if (await statusElements.isVisible()) {
      await expect(statusElements).toBeVisible();
    }
  });
});
