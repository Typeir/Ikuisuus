/**
 * storePersistentData Utility Unit Tests
 *
 * @fileoverview Tests for multi-layer persistent storage utility.
 * Validates cookie, sessionStorage, and localStorage operations.
 *
 * @module tests/unit/lib/utils/storePersistentData
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/storePersistentData Module under test
 */

import { storePersistentData } from '@/lib/utils/storePersistentData';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('storePersistentData', () => {
  const mockSessionStorage: Record<string, string> = {};
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal('window', {
      sessionStorage: {
        setItem: vi.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        removeItem: vi.fn((key: string) => delete mockSessionStorage[key]),
        clear: vi.fn(() => Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k])),
      },
      localStorage: {
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        removeItem: vi.fn((key: string) => delete mockLocalStorage[key]),
        clear: vi.fn(() => Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k])),
      },
      location: {
        protocol: 'http:',
      },
    });

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]);
  });

  describe('sessionStorage operations', () => {
    it('should store value in sessionStorage', () => {
      storePersistentData('testKey', 'testValue');

      expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
    });
  });

  describe('localStorage operations', () => {
    it('should store value in localStorage', () => {
      storePersistentData('testKey', 'testValue');

      expect((window as any).localStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
    });
  });

  describe('cookie operations', () => {
    it('should set cookie with value', () => {
      storePersistentData('testKey', 'testValue');

      expect(document.cookie).toContain('testKey=testValue');
    });

    it('should set cookie with max-age for persistence', () => {
      storePersistentData('testKey', 'testValue');

      // Note: Max-Age is capitalized in the cookie string
      expect(document.cookie).toContain('Max-Age=31536000');
    });
  });

  describe('multi-storage consistency', () => {
    it('should store same value in all three storage layers', () => {
      const key = 'theme';
      const value = 'dark';

      storePersistentData(key, value);

      expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(key, value);
      expect((window as any).localStorage.setItem).toHaveBeenCalledWith(key, value);
      expect(document.cookie).toContain(`${key}=${value}`);
    });
  });

  describe('server-side rendering safety', () => {
    it('should not throw when window is undefined', () => {
      vi.stubGlobal('window', undefined);

      expect(() => storePersistentData('key', 'value')).not.toThrow();
    });
  });
});
