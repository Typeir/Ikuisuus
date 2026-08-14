/**
 * @fileoverview E2E tests for sidebar layout and locale switching. Verifies the
 * 3-region layout and tools menu navigation.
 */

import { expect, test } from '@playwright/test';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should display 3-region layout with pinned header and footer', async ({
    page,
  }) => {
    const header = page.locator('.sidebar-header');
    const body = page.locator('.sidebar-body');
    const footer = page.locator('.sidebar-footer');

    await expect(header).toBeVisible();
    await expect(body).toBeVisible();
    await expect(footer).toBeVisible();
  });

  test('should toggle theme when theme button is clicked', async ({ page }) => {
    const themeButton = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeButton).toBeVisible();

    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme');

    await themeButton.click();

    const newTheme = await htmlElement.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should open tools menu and navigate to encounter planner', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    const encounterLink = page.locator('text=Encounter Creator').first();
    await expect(encounterLink).toBeVisible({ timeout: 5000 });

    await encounterLink.click();

    // Wait for navigation to start
    await page.waitForTimeout(500);

    // Wait for URL to change with extended timeout
    await expect(page).toHaveURL(/\/utils\/encounter-planner/, {
      timeout: 30000,
    });
  });

  // test('should collapse sidebar on mobile when navigation item clicked', async ({ page }) => {
  //   await page.setViewportSize({ width: 375, height: 667 });

  //   const hamburger = page.locator('.hamburger');
  //   await hamburger.click();

  //   const navLink = page.locator('aside a').first();
  //   await navLink.click();

  //   const sidebar = page.locator('aside');
  //   const isHidden = await sidebar.evaluate((el) => {
  //     return !el.classList.contains('isOpen');
  //   });

  //   expect(isHidden).toBe(true);
  // });
});

test.describe('Sidebar Locale Switching', () => {
  test('should maintain sidebar state when switching locales', async ({
    page,
  }) => {
    await page.goto('/en');

    const currentUrl = page.url();
    const spanishUrl = currentUrl.replace('/en', '/es');

    await page.goto(spanishUrl);

    const header = page.locator('.sidebar-header');
    const footer = page.locator('.sidebar-footer');

    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();
  });
});
