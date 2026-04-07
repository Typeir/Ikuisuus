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

import {
    readCookie,
    readPersistentDataCookieFirst,
    storePersistentData,
    storePersistentDataCookieFirst,
    storePersistentDataFallbackOnly,
    writeCookie,
} from '@/lib/utils/storePersistentData';
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
        clear: vi.fn(() =>
          Object.keys(mockSessionStorage).forEach(
            (k) => delete mockSessionStorage[k],
          ),
        ),
      },
      localStorage: {
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        removeItem: vi.fn((key: string) => delete mockLocalStorage[key]),
        clear: vi.fn(() =>
          Object.keys(mockLocalStorage).forEach(
            (k) => delete mockLocalStorage[k],
          ),
        ),
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
    Object.keys(mockSessionStorage).forEach(
      (k) => delete mockSessionStorage[k],
    );
    Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
  });

  describe('sessionStorage operations', () => {
    it('should store value in sessionStorage', () => {
      storePersistentData('testKey', 'testValue');

      expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        'testValue',
      );
    });
  });

  describe('localStorage operations', () => {
    it('should store value in localStorage', () => {
      storePersistentData('testKey', 'testValue');

      expect((window as any).localStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        'testValue',
      );
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

      expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(
        key,
        value,
      );
      expect((window as any).localStorage.setItem).toHaveBeenCalledWith(
        key,
        value,
      );
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

describe('readCookie', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when document is undefined', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
    });

    expect(readCookie('key')).toBeNull();

    if (original) {
      Object.defineProperty(globalThis, 'document', original);
    }
  });

  it('should return cookie value by name', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'theme=dark; lang=en',
    });

    expect(readCookie('theme')).toBe('dark');
  });

  it('should return null when cookie is not found', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'theme=dark',
    });

    expect(readCookie('nonexistent')).toBeNull();
  });

  it('should decode URL-encoded cookie values', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'data=hello%20world',
    });

    expect(readCookie('data')).toBe('hello world');
  });

  it('should return raw value when decoding fails', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'data=%E0%A4%A',
    });

    expect(readCookie('data')).toBe('%E0%A4%A');
  });

  it('should return null when document.cookie is empty', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    expect(readCookie('key')).toBeNull();
  });
});

describe('writeCookie', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { protocol: 'http:' },
    });
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should set cookie with default options', () => {
    writeCookie('theme', 'dark');

    expect(document.cookie).toContain('theme=dark');
    expect(document.cookie).toContain('Max-Age=31536000');
    expect(document.cookie).toContain('Path=/');
    expect(document.cookie).toContain('SameSite=Lax');
  });

  it('should set cookie with custom options', () => {
    writeCookie('session', 'abc', {
      maxAgeSeconds: 3600,
      path: '/app',
      sameSite: 'Strict',
    });

    expect(document.cookie).toContain('Max-Age=3600');
    expect(document.cookie).toContain('Path=/app');
    expect(document.cookie).toContain('SameSite=Strict');
  });

  it('should add Secure flag on HTTPS', () => {
    vi.stubGlobal('window', {
      location: { protocol: 'https:' },
    });

    writeCookie('token', 'secret');

    expect(document.cookie).toContain('Secure');
  });

  it('should not add Secure flag on HTTP', () => {
    writeCookie('token', 'secret');

    expect(document.cookie).not.toContain('Secure');
  });
});

describe('storePersistentDataCookieFirst', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      sessionStorage: { setItem: vi.fn(), getItem: vi.fn() },
      localStorage: { setItem: vi.fn(), getItem: vi.fn() },
      location: { protocol: 'http:' },
    });
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should write to cookie, sessionStorage, and localStorage', () => {
    storePersistentDataCookieFirst('key', 'val');

    expect(document.cookie).toContain('key=val');
    expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(
      'key',
      'val',
    );
    expect((window as any).localStorage.setItem).toHaveBeenCalledWith(
      'key',
      'val',
    );
  });

  it('should be safe when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(() => storePersistentDataCookieFirst('k', 'v')).not.toThrow();
  });
});

describe('storePersistentDataFallbackOnly', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      sessionStorage: { setItem: vi.fn() },
      localStorage: { setItem: vi.fn() },
    });
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should write to sessionStorage and localStorage but not cookie', () => {
    storePersistentDataFallbackOnly('key', 'val');

    expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(
      'key',
      'val',
    );
    expect((window as any).localStorage.setItem).toHaveBeenCalledWith(
      'key',
      'val',
    );
    expect(document.cookie).toBe('');
  });

  it('should be safe when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(() => storePersistentDataFallbackOnly('k', 'v')).not.toThrow();
  });
});

describe('readPersistentDataCookieFirst', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should return cookie value when present', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'theme=light',
    });
    vi.stubGlobal('window', {
      sessionStorage: { getItem: vi.fn(() => 'dark') },
      localStorage: { getItem: vi.fn(() => 'dark') },
    });

    expect(readPersistentDataCookieFirst('theme')).toBe('light');
  });

  it('should fall back to sessionStorage when cookie missing', () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: vi.fn((k: string) => (k === 'theme' ? 'session-val' : null)),
      },
      localStorage: { getItem: vi.fn(() => null) },
    });

    expect(readPersistentDataCookieFirst('theme')).toBe('session-val');
  });

  it('should fall back to localStorage when cookie and session missing', () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    vi.stubGlobal('window', {
      sessionStorage: { getItem: vi.fn(() => null) },
      localStorage: {
        getItem: vi.fn((k: string) => (k === 'theme' ? 'local-val' : null)),
      },
    });

    expect(readPersistentDataCookieFirst('theme')).toBe('local-val');
  });

  it('should return null when all layers empty', () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    vi.stubGlobal('window', {
      sessionStorage: { getItem: vi.fn(() => null) },
      localStorage: { getItem: vi.fn(() => null) },
    });

    expect(readPersistentDataCookieFirst('theme')).toBeNull();
  });

  it('should return null when window is undefined and cookie missing', () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
    vi.stubGlobal('window', undefined);

    expect(readPersistentDataCookieFirst('theme')).toBeNull();
  });
});
