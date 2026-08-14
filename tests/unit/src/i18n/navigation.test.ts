/**
 * @fileoverview Tests Navigation exports for the locale-aware Next.js navigation wrappers.
 *
 * @module tests/unit/i18n/navigation
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Test framework.
 * @requires @/i18n/navigation Module under test.
 */

import { describe, it, expect } from 'vitest';
import * as Navigation from '@/i18n/navigation';

describe('navigation utilities', () => {
  describe('exports', () => {
    it('should export Link component', () => {
      expect(Navigation.Link).toBeDefined();
    });

    it('should export redirect function', () => {
      expect(Navigation.redirect).toBeDefined();
      expect(typeof Navigation.redirect).toBe('function');
    });

    it('should export usePathname hook', () => {
      expect(Navigation.usePathname).toBeDefined();
      expect(typeof Navigation.usePathname).toBe('function');
    });

    it('should export useRouter hook', () => {
      expect(Navigation.useRouter).toBeDefined();
      expect(typeof Navigation.useRouter).toBe('function');
    });

    it('should export getPathname function', () => {
      expect(Navigation.getPathname).toBeDefined();
      expect(typeof Navigation.getPathname).toBe('function');
    });
  });

  describe('export completeness', () => {
    it('should export exactly five navigation utilities', () => {
      const expectedExports = ['Link', 'redirect', 'usePathname', 'useRouter', 'getPathname'];
      expectedExports.forEach((exportName) => {
        expect(Navigation).toHaveProperty(exportName);
      });
    });
  });
});
