/**
 * fetchPersistentData Utility Unit Tests
 *
 * @fileoverview Tests for multi-layer persistent data retrieval utility.
 * Validates priority ordering: cookies > sessionStorage > localStorage.
 *
 * @module tests/unit/src/lib/utils/fetchPersistentData.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/fetchPersistentData Module under test
 */

import { fetchPersistentData } from '@/lib/utils/fetchPersistentData';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('fetchPersistentData', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });

    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('cookie retrieval', () => {
    it('should return value from cookie when present', () => {
      document.cookie = 'theme=dark';

      const result = fetchPersistentData('theme');

      expect(result).toBe('dark');
    });

    it('should prioritize cookie over sessionStorage', () => {
      document.cookie = 'theme=dark';
      vi.mocked(sessionStorage.getItem).mockReturnValue('light');

      const result = fetchPersistentData('theme');

      expect(result).toBe('dark');
    });

    it('should handle multiple cookies correctly', () => {
      document.cookie = 'foo=bar; theme=dark; other=value';

      const result = fetchPersistentData('theme');

      expect(result).toBe('dark');
    });
  });

  describe('sessionStorage retrieval', () => {
    it('should return value from sessionStorage when cookie not present', () => {
      document.cookie = '';
      vi.mocked(sessionStorage.getItem).mockReturnValue('light');

      const result = fetchPersistentData('theme');

      expect(result).toBe('light');
    });

    it('should prioritize sessionStorage over localStorage', () => {
      document.cookie = '';
      vi.mocked(sessionStorage.getItem).mockReturnValue('light');
      vi.mocked(localStorage.getItem).mockReturnValue('dark');

      const result = fetchPersistentData('theme');

      expect(result).toBe('light');
    });
  });

  describe('localStorage retrieval', () => {
    it('should return value from localStorage as fallback', () => {
      document.cookie = '';
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      vi.mocked(localStorage.getItem).mockReturnValue('dark');

      const result = fetchPersistentData('theme');

      expect(result).toBe('dark');
    });
  });

  describe('missing values', () => {
    it('should return null when value not in any storage', () => {
      document.cookie = '';
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const result = fetchPersistentData('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('server-side rendering safety', () => {
    it('should return null when window is undefined', () => {
      vi.stubGlobal('window', undefined);

      const result = fetchPersistentData('theme');

      expect(result).toBeNull();
    });
  });
});
