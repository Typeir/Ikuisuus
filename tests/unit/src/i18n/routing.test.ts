/**
 * i18n Routing Configuration Unit Tests
 *
 * @fileoverview Tests for the next-intl routing configuration that defines
 * supported locales and default locale for the application.
 *
 * @module tests/unit/src/i18n/routing.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/i18n/routing Module under test
 */

import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES } from '@/lib/constants/locales';
import { routing } from '@/i18n/routing';

describe('routing configuration', () => {
  describe('exports', () => {
    it('should export routing object', () => {
      expect(routing).toBeDefined();
      expect(typeof routing).toBe('object');
    });
  });

  describe('locales configuration', () => {
    it('should define locales array', () => {
      expect(routing.locales).toBeDefined();
      expect(Array.isArray(routing.locales)).toBe(true);
    });

    it('should include English locale', () => {
      expect(routing.locales).toContain('en');
    });

    it('should mirror the supported locale constant exactly', () => {
      expect(routing.locales).toEqual([...SUPPORTED_LOCALES]);
    });
  });

  describe('default locale configuration', () => {
    it('should define default locale', () => {
      expect(routing.defaultLocale).toBeDefined();
    });

    it('should use English as default locale', () => {
      expect(routing.defaultLocale).toBe('en');
    });

    it('should have default locale included in locales array', () => {
      expect(routing.locales).toContain(routing.defaultLocale);
    });
  });

  describe('locale format validation', () => {
    it('should use lowercase ISO 639-1 codes', () => {
      routing.locales.forEach((locale) => {
        expect(locale).toMatch(/^[a-z]{2}$/);
      });
    });

    it('should have unique locale values', () => {
      const uniqueLocales = new Set(routing.locales);
      expect(uniqueLocales.size).toBe(routing.locales.length);
    });
  });
});
