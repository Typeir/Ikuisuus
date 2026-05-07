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
    fetchPersistentDataRef,
    readCookie,
    readPersistentDataCookieFirst,
    removePersistentData,
    storePersistentData,
    storePersistentDataCookieFirst,
    storePersistentDataFallbackOnly,
    storePersistentDataRef,
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

describe('storePersistentDataRef / fetchPersistentDataRef', () => {
  const mockSessionStorage: Record<string, string> = {};
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal('window', {
      sessionStorage: {
        setItem: vi.fn((k: string, v: string) => {
          mockSessionStorage[k] = v;
        }),
        getItem: vi.fn((k: string) => mockSessionStorage[k] ?? null),
      },
      localStorage: {
        setItem: vi.fn((k: string, v: string) => {
          mockLocalStorage[k] = v;
        }),
        getItem: vi.fn((k: string) => mockLocalStorage[k] ?? null),
      },
      location: { protocol: 'http:' },
    });
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    Object.keys(mockSessionStorage).forEach(
      (k) => delete mockSessionStorage[k],
    );
    Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
  });

  it('should write data to sessionStorage and localStorage', () => {
    storePersistentDataRef('chars', '{"a":1}');

    expect((window as any).sessionStorage.setItem).toHaveBeenCalledWith(
      'chars',
      '{"a":1}',
    );
    expect((window as any).localStorage.setItem).toHaveBeenCalledWith(
      'chars',
      '{"a":1}',
    );
  });

  it('should write a ref: pointer to the cookie, not the raw data', () => {
    storePersistentDataRef('chars', '{"a":1}');

    const cookie = document.cookie;
    expect(cookie).toContain('chars=ref%3A');
    expect(cookie).not.toContain('%7B%22a%22%3A1%7D');
  });

  it('should round-trip: fetchPersistentDataRef returns original value after storePersistentDataRef', () => {
    const value = JSON.stringify({
      characters: [{ id: 'abc', name: 'Elara' }],
    });
    storePersistentDataRef('chars', value);
    expect(fetchPersistentDataRef('chars')).toBe(value);
  });

  it('should return null when the cookie pointer is missing', () => {
    mockLocalStorage['chars'] = '{"a":1}';
    expect(fetchPersistentDataRef('chars')).toBeNull();
  });

  it('should return null when storage data is missing despite valid cookie pointer', () => {
    storePersistentDataRef('chars', '{"a":1}');
    delete mockSessionStorage['chars'];
    delete mockLocalStorage['chars'];
    expect(fetchPersistentDataRef('chars')).toBeNull();
  });

  it('should return null when stored data hash does not match cookie pointer', () => {
    storePersistentDataRef('chars', '{"a":1}');
    mockLocalStorage['chars'] = '{"tampered":true}';
    mockSessionStorage['chars'] = '{"tampered":true}';
    expect(fetchPersistentDataRef('chars')).toBeNull();
  });

  it('should fall back to localStorage when sessionStorage is empty', () => {
    const value = '{"x":42}';
    storePersistentDataRef('chars', value);
    delete mockSessionStorage['chars'];
    expect(fetchPersistentDataRef('chars')).toBe(value);
  });

  it('should be SSR-safe: storePersistentDataRef does not throw when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(() => storePersistentDataRef('chars', 'data')).not.toThrow();
  });

  it('should be SSR-safe: fetchPersistentDataRef returns null when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(fetchPersistentDataRef('chars')).toBeNull();
  });
});

describe('removePersistentData', () => {
  const mockSessionStorage: Record<string, string> = {};
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal('window', {
      sessionStorage: {
        setItem: vi.fn((key: string, value: string) => {
          mockSessionStorage[key] = value;
        }),
        getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
        removeItem: vi.fn((key: string) => {
          delete mockSessionStorage[key];
        }),
      },
      localStorage: {
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
      },
      location: { protocol: 'http:' },
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

  it('should remove value from localStorage', () => {
    mockLocalStorage['myKey'] = 'myValue';
    removePersistentData('myKey');
    expect(mockLocalStorage['myKey']).toBeUndefined();
  });

  it('should remove value from sessionStorage', () => {
    mockSessionStorage['myKey'] = 'myValue';
    removePersistentData('myKey');
    expect(mockSessionStorage['myKey']).toBeUndefined();
  });

  it('should expire the cookie for the key', () => {
    removePersistentData('myKey');
    expect(document.cookie).toContain('Max-Age=0');
  });

  it('should be SSR-safe: does not throw when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(() => removePersistentData('myKey')).not.toThrow();
  });
});
