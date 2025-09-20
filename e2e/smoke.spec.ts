import {test, expect} from '@playwright/test';

test('homepage loads successfully', async ({page}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {name: 'Welcome to E-Shop!'}),
  ).toBeVisible();

  await expect(page.getByText('Check out our exclusive offers!')).toBeVisible();

  await expect(page.getByRole('link', {name: 'Shop Now'})).toBeVisible();
});
