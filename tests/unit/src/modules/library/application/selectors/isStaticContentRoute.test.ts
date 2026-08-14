/**
 * Unit tests for isStaticContentRoute and allowsSidebarPersistence.
 *
 * @fileoverview Tests static-content route detection for isStaticContentRoute
 * and its inverse allowsSidebarPersistence.
 */

import {
    allowsSidebarPersistence,
    isStaticContentRoute,
} from '@/modules/library/application/selectors/isStaticContentRoute';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('isStaticContentRoute', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  describe('with explicit pathname parameter', () => {
    it('should return true for /en/library/ routes', () => {
      expect(isStaticContentRoute('/en/library/monsters')).toBe(true);
      expect(isStaticContentRoute('/en/library/monsters/albedo')).toBe(true);
      expect(isStaticContentRoute('/en/library/items/heirlooms/sunblade')).toBe(
        true
      );
    });

    it('should return true for other locale library routes', () => {
      expect(isStaticContentRoute('/es/library/monsters')).toBe(true);
      expect(isStaticContentRoute('/fi/library/items')).toBe(true);
    });

    it('should return false for /utils/ routes', () => {
      expect(isStaticContentRoute('/en/utils/encounter-planner')).toBe(false);
      expect(isStaticContentRoute('/es/utils/encounter-planner')).toBe(false);
    });

    it('should return false for home page', () => {
      expect(isStaticContentRoute('/en')).toBe(false);
      expect(isStaticContentRoute('/es')).toBe(false);
    });

    it('should return false for root path', () => {
      expect(isStaticContentRoute('/')).toBe(false);
    });
  });

  describe('with window.location.pathname', () => {
    it('should use window.location.pathname when no parameter provided', () => {
      vi.stubGlobal('window', {
        location: { pathname: '/en/library/monsters/ancient-dragon' },
      });

      expect(isStaticContentRoute()).toBe(true);
    });

    it('should return false for dynamic routes from window.location', () => {
      vi.stubGlobal('window', {
        location: { pathname: '/en/utils/encounter-planner' },
      });

      expect(isStaticContentRoute()).toBe(false);
    });
  });

  describe('SSR context (no window)', () => {
    it('should return false when window is undefined and no pathname provided', () => {
      vi.stubGlobal('window', undefined);

      expect(isStaticContentRoute()).toBe(false);
    });

    it('should work with explicit pathname even when window is undefined', () => {
      vi.stubGlobal('window', undefined);

      expect(isStaticContentRoute('/en/library/monsters')).toBe(true);
      expect(isStaticContentRoute('/en/utils/encounter-planner')).toBe(false);
    });
  });
});

describe('allowsSidebarPersistence', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        pathname: '/',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return false for library routes (no persistence)', () => {
    expect(allowsSidebarPersistence('/en/library/monsters')).toBe(false);
    expect(allowsSidebarPersistence('/en/library/items/heirlooms')).toBe(false);
  });

  it('should return true for utils routes (persistence allowed)', () => {
    expect(allowsSidebarPersistence('/en/utils/encounter-planner')).toBe(true);
  });

  it('should return true for home page (persistence allowed)', () => {
    expect(allowsSidebarPersistence('/en')).toBe(true);
  });

  it('should be inverse of isStaticContentRoute', () => {
    const testPaths = [
      '/en/library/monsters',
      '/en/utils/encounter-planner',
      '/es/library/items',
      '/fi',
      '/',
    ];

    for (const path of testPaths) {
      expect(allowsSidebarPersistence(path)).toBe(!isStaticContentRoute(path));
    }
  });
});
