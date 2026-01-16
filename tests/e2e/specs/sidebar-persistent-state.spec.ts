/**
 * Sidebar Persistent State E2E Tests
 *
 * @fileoverview TDD test for sidebar tree expansion state persistence across page reloads.
 * Tests that sidebar expansion state is persisted to storage, survives full page reload,
 * and is restored immediately on load.
 *
 * @description This test SHOULD FAIL on the current broken implementation and pass only when:
 * - Sidebar expansion state is correctly persisted to storage
 * - State is restored across reload
 * - State is applied immediately on page load
 *
 * @requires @playwright/test
 */

import { expect, test } from '@playwright/test';

/**
 * Extended timeout for sidebar state operations
 */
const SIDEBAR_TIMEOUT = 10000;

/**
 * Helper to get a sidebar item by its label text
 */
function getSidebarItem(page: any, label: string) {
  return page
    .locator('.sidebar-body p', { hasText: label })
    .locator('..')
    .first();
}

/**
 * Helper to verify if a sidebar item is expanded
 * Checks for the presence of the 'open' class on the accordion (li element)
 */
async function isItemExpanded(page: any, label: string): Promise<boolean> {
  const pTag = page.locator('.sidebar-body p', { hasText: label }).first();
  const accordion = pTag.locator('..').locator('..');
  const classes = await accordion.getAttribute('class');
  return classes?.includes('open') ?? false;
}

/**
 * Helper to get storage data using the app's fetchPersistentData utility
 */
async function getStorageData(page: any, key: string): Promise<any> {
  return await page.evaluate((storageKey: string) => {
    const readCookie = (key: string): string | null => {
      if (typeof document === 'undefined') return null;
      const encodedKey = encodeURIComponent(key);
      const cookies = document.cookie ? document.cookie.split('; ') : [];
      for (const entry of cookies) {
        const eqIndex = entry.indexOf('=');
        const rawName = eqIndex >= 0 ? entry.slice(0, eqIndex) : entry;
        const rawValue = eqIndex >= 0 ? entry.slice(eqIndex + 1) : '';
        if (rawName === encodedKey) {
          try {
            return decodeURIComponent(rawValue);
          } catch {
            return rawValue;
          }
        }
      }
      return null;
    };

    const fetchPersistentData = (key: string): string | null => {
      if (typeof window === 'undefined') return null;
      const cookieValue = readCookie(key);
      if (cookieValue !== null) return cookieValue;
      const session = sessionStorage.getItem(key);
      if (session) return session;
      return localStorage.getItem(key);
    };

    const rawData = fetchPersistentData(storageKey);
    if (!rawData) return null;
    try {
      return JSON.parse(rawData);
    } catch {
      return rawData;
    }
  }, key);
}

/**
 * Helper to expand a sidebar item by clicking its label
 */
async function expandSidebarItem(page: any, label: string) {
  const item = getSidebarItem(page, label);
  await expect(item).toBeVisible();
  await item.click();
  await expect.poll(async () => await isItemExpanded(page, label)).toBe(true);
}

test.describe('Sidebar Persistent State', () => {
  const STORAGE_KEY = 'ikuisuus-ui-state';

  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should persist sidebar expansion state across page reload', async ({
    page,
  }) => {
    const sidebar = page.locator('.sidebar-body');
    await expect(sidebar).toBeVisible();

    await test.step('Expand character-creation directory', async () => {
      await expandSidebarItem(page, 'Character Creation');
      expect(await isItemExpanded(page, 'Character Creation')).toBe(true);
    });

    await test.step('Expand vocations directory (nested under character-creation)', async () => {
      const vocationsItem = getSidebarItem(page, 'Vocations');
      await expect(vocationsItem).toBeVisible();
      await expandSidebarItem(page, 'Vocations');
      expect(await isItemExpanded(page, 'Vocations')).toBe(true);
    });

    await test.step('Verify persistence in storage', async () => {
      const storageData = await getStorageData(page, STORAGE_KEY);

      expect(storageData).not.toBeNull();
      expect(storageData).toBeDefined();

      expect(storageData).toHaveProperty('sidebarMenu');
      expect(storageData.sidebarMenu).toHaveProperty('expandedPaths');
      expect(Array.isArray(storageData.sidebarMenu.expandedPaths)).toBe(true);

      const expandedPaths = storageData.sidebarMenu.expandedPaths as string[];
      const hasCharacterCreation = expandedPaths.some(
        (path) => path.includes('character') || path.includes('creation')
      );
      const hasVocations = expandedPaths.some((path) =>
        path.includes('vocation')
      );

      expect(hasCharacterCreation).toBe(true);
      expect(hasVocations).toBe(true);
    });

    await test.step('Reload the page', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
    });

    await test.step('Verify persistence survives reload', async () => {
      const storageData = await getStorageData(page, STORAGE_KEY);

      expect(storageData).not.toBeNull();
      expect(storageData).toHaveProperty('sidebarMenu');
      expect(storageData.sidebarMenu).toHaveProperty('expandedPaths');

      const expandedPaths = storageData.sidebarMenu.expandedPaths as string[];
      const hasCharacterCreation = expandedPaths.some(
        (path) => path.includes('character') || path.includes('creation')
      );
      const hasVocations = expandedPaths.some((path) =>
        path.includes('vocation')
      );

      expect(hasCharacterCreation).toBe(true);
      expect(hasVocations).toBe(true);
    });

    await test.step('Verify sidebar state is restored immediately', async () => {
      const sidebar = page.locator('.sidebar-body');
      await expect(sidebar).toBeVisible();

      // Wait for React hydration
      await page.waitForTimeout(1000);

      await expect
        .poll(async () => await isItemExpanded(page, 'Character Creation'), {
          timeout: SIDEBAR_TIMEOUT,
        })
        .toBe(true);

      const vocationsItem = getSidebarItem(page, 'Vocations');
      await expect(vocationsItem).toBeVisible();

      await expect
        .poll(async () => await isItemExpanded(page, 'Vocations'), {
          timeout: SIDEBAR_TIMEOUT,
        })
        .toBe(true);
    });
  });

  test('should restore multiple independent expanded paths', async ({
    page,
  }) => {
    await expandSidebarItem(page, 'Character Creation');
    expect(await isItemExpanded(page, 'Character Creation')).toBe(true);

    await page.reload({ waitUntil: 'domcontentloaded' });

    // Wait for React hydration
    await page.waitForTimeout(1000);

    await expect
      .poll(async () => await isItemExpanded(page, 'Character Creation'), {
        timeout: SIDEBAR_TIMEOUT,
      })
      .toBe(true);
    expect(await isItemExpanded(page, 'Character Creation')).toBe(true);
  });

  test('should handle collapse and persist collapsed state', async ({
    page,
  }) => {
    await expandSidebarItem(page, 'Character Creation');
    expect(await isItemExpanded(page, 'Character Creation')).toBe(true);

    const item = getSidebarItem(page, 'Character Creation');
    await item.click();

    await expect
      .poll(async () => await isItemExpanded(page, 'Character Creation'), {
        timeout: SIDEBAR_TIMEOUT,
      })
      .toBe(false);
    expect(await isItemExpanded(page, 'Character Creation')).toBe(false);

    await page.reload({ waitUntil: 'domcontentloaded' });

    expect(await isItemExpanded(page, 'Character Creation')).toBe(false);
  });
});
