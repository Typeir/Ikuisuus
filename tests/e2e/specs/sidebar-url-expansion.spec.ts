/**
 * Sidebar URL-Based Expansion E2E Tests
 *
 * @fileoverview Tests that sidebar automatically expands to show the current page's
 * location in the navigation tree based on URL pathname.
 */

import { expect, test } from '@playwright/test';

test.describe('Sidebar URL-Based Expansion', () => {
  test('should expand sidebar for /en/library/character-creation/bloodlines/bilupine', async ({
    page,
  }) => {
    // Navigate directly to deep URL
    await page.goto('/en/library/character-creation/bloodlines/bilupine');

    // Wait for navigation to complete
    await page.waitForLoadState('domcontentloaded');

    // Check that all ancestor folders are expanded
    // The sidebar should show:
    // - character-creation (expanded)
    //   - bloodlines (expanded)
    //     - bilupine (current page)

    // Find the character-creation folder (folders are divs with class sidebar_label___NQM_, not links)
    const characterCreationFolder = page
      .locator('div.sidebar_label___NQM_ p', { hasText: 'Character Creation' })
      .first();
    await expect(characterCreationFolder).toBeVisible();

    // Check if character-creation is expanded by looking for bloodlines subfolder
    const bloodlinesFolder = page
      .locator('div.sidebar_label___NQM_ p', { hasText: 'Bloodlines' })
      .first();
    await expect(bloodlinesFolder).toBeVisible();

    // Check if bloodlines is expanded by looking for bilupine link
    const bilupineLink = page.locator('a', { hasText: 'Bilupine' }).first();
    await expect(bilupineLink).toBeVisible();

    // Verify the active link styling (current page)
    const currentUrl = page.url();
    expect(currentUrl).toContain('bilupine');
  });

  test('should expand sidebar for /en/library/monsters/albedo', async ({
    page,
  }) => {
    await page.goto('/en/library/monsters/albedo');
    await page.waitForLoadState('domcontentloaded');

    // Check that monsters folder is visible and albedo link is present
    const monstersFolder = page.locator('a', { hasText: 'Monsters' }).first();
    await expect(monstersFolder).toBeVisible();

    // Look for Albedo link (should be visible if monsters is expanded)
    const albedoLink = page.locator('a[href*="albedo"]').first();
    await expect(albedoLink).toBeVisible({ timeout: 5000 });
  });

  test('should expand sidebar for nested items path', async ({ page }) => {
    await page.goto('/en/library/items/heirlooms/blackbone-crusher');
    await page.waitForLoadState('domcontentloaded');

    // Check items -> heirlooms -> blackbone-crusher expansion (folders are divs, not links)
    const itemsFolder = page
      .locator('div.sidebar_label___NQM_ p', { hasText: 'Items' })
      .first();
    await expect(itemsFolder).toBeVisible();

    const heirloomsFolder = page.locator('a', { hasText: 'Heirlooms' }).first();
    await expect(heirloomsFolder).toBeVisible();
  });

  test('should preserve expansion when navigating between sibling pages', async ({
    page,
  }) => {
    // Increase timeout for multiple navigations
    test.setTimeout(60000);

    // Navigate to first bloodline page
    await page.goto('/en/library/character-creation/bloodlines/bilupine');

    // Wait for React hydration
    await page.waitForTimeout(1000);

    // Verify character-creation and bloodlines folders are expanded
    const characterCreationFolder = page
      .locator('div.sidebar_label___NQM_ p', { hasText: 'Character Creation' })
      .first();
    await expect(characterCreationFolder).toBeVisible({ timeout: 10000 });

    const bloodlinesFolder = page
      .locator('div.sidebar_label___NQM_ p', { hasText: 'Bloodlines' })
      .first();
    await expect(bloodlinesFolder).toBeVisible({ timeout: 10000 });

    // Navigate to sibling page (empyrean - same parent folder bloodlines)
    await page.goto('/en/library/character-creation/bloodlines/empyrean');

    // Wait for React hydration
    await page.waitForTimeout(1000);

    // Both folders should remain expanded after navigating to sibling
    await expect(characterCreationFolder).toBeVisible({ timeout: 10000 });
    await expect(bloodlinesFolder).toBeVisible({ timeout: 10000 });
  });

  test('should expand from URL even with no localStorage data', async ({
    page,
    context,
  }) => {
    // Use a fresh context with storage cleared
    await context.clearCookies();

    await page.goto('/en/library/character-creation/bloodlines/bilupine');
    await page.waitForLoadState('domcontentloaded');

    // Even without any persisted state, URL should drive expansion
    const bloodlinesFolder = page
      .locator('a', { hasText: 'Bloodlines' })
      .first();
    await expect(bloodlinesFolder).toBeVisible({ timeout: 10000 });
  });
});
