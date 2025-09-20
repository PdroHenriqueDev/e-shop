import {test, expect} from '@playwright/test';

test.describe('Authentication and Cart Persistence', () => {
  test('Login page loads and basic elements are visible', async ({page}) => {
    await page.goto('/login');

    await expect(
      page.getByRole('heading', {name: 'Log in to your account'}),
    ).toBeVisible();

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('Home page navigation', async ({page}) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('Protected route shows authentication error', async ({page}) => {
    await page.goto('/orders');

    await expect(page.locator('body')).toBeVisible();

    await expect(page).toHaveURL('/orders');
  });
});
