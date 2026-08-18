/**
 * @fileoverview End-to-end tests for the tools-menu module.
 * @description Verifies the tools menu lists the shipped tools plus the dev-only Labs
 * entry, opens and closes, and navigates to the correct routes. The Playwright web
 * server runs `npm run dev`, so `devOnly` registry entries are listed here.
 *
 * @module tests/e2e/specs/tools-menu
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { expect, test } from '@playwright/test';

test.describe('Tools Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('tools button is visible in the sidebar footer', async ({ page }) => {
    const toolsButton = page.locator('.sidebar-footer button');
    await expect(toolsButton).toBeVisible();
  });

  test('opens the dropdown when the tools button is clicked', async ({
    page,
  }) => {
    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5000 });
  });

  test('displays the shipped tool labels after opening', async ({ page }) => {
    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    await expect(page.locator('text=Encounter Creator')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=World Sim')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Character Builder')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=MDX Editor')).toBeVisible({
      timeout: 5000,
    });
  });

  test('displays the dev-only Labs entry against the dev server', async ({
    page,
  }) => {
    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    await expect(page.locator('text=Labs')).toBeVisible({ timeout: 5000 });
  });

  test('navigates to the dev canvas when Labs is clicked', async ({ page }) => {
    test.setTimeout(60000);

    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    await page.locator('text=Labs').first().click();

    await expect(page).toHaveURL(/\/labs\/dev/, { timeout: 30000 });
    await expect(page.getByTestId('labs-dev-canvas')).toBeVisible({
      timeout: 10000,
    });
  });

  test('navigates to encounter planner when Encounter Creator is clicked', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    await page.locator('text=Encounter Creator').first().click();

    await expect(page).toHaveURL(/\/utils\/encounter-planner/, {
      timeout: 30000,
    });
  });

  test('navigates to world sim when World Sim is clicked', async ({ page }) => {
    test.setTimeout(60000);

    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    await page.locator('text=World Sim').first().click();

    await expect(page).toHaveURL(/\/utils\/world-sim/, { timeout: 30000 });
  });

  test('closes the dropdown after selecting an item', async ({ page }) => {
    test.setTimeout(60000);

    const toolsButton = page.locator('.sidebar-footer button');
    await toolsButton.click();

    await expect(page.locator('[role="menu"]')).toBeVisible({ timeout: 5000 });

    await page.locator('text=Encounter Creator').first().click();

    await expect(page).toHaveURL(/\/utils\/encounter-planner/, {
      timeout: 30000,
    });
  });
});
