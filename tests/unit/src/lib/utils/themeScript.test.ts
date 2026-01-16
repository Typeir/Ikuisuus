/**
 * themeScript Utility Unit Tests
 *
 * @fileoverview Tests for theme initialization script generator used for FOUC prevention.
 * Validates script output structure and theme enumeration handling.
 *
 * @module tests/unit/lib/utils/themeScript
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/themeScript Module under test
 */

import { describe, it, expect } from 'vitest';
import { getThemeInitScript } from '@/lib/utils/themeScript';
import { Theme } from '@/lib/enums/themes';
import { PersistentData } from '@/lib/enums/persistentData';

describe('getThemeInitScript', () => {
  describe('script generation', () => {
    it('should return a string', () => {
      const script = getThemeInitScript();
      expect(typeof script).toBe('string');
    });

    it('should return non-empty script', () => {
      const script = getThemeInitScript();
      expect(script.length).toBeGreaterThan(0);
    });

    it('should be an IIFE (Immediately Invoked Function Expression)', () => {
      const script = getThemeInitScript();
      expect(script).toContain('(function()');
      expect(script).toContain('})();');
    });
  });

  describe('localStorage key reference', () => {
    it('should reference the correct localStorage key', () => {
      const script = getThemeInitScript();
      expect(script).toContain(PersistentData.Theme);
    });

    it('should use localStorage.getItem', () => {
      const script = getThemeInitScript();
      expect(script).toContain('localStorage.getItem');
    });
  });

  describe('theme values', () => {
    it('should include dark theme value', () => {
      const script = getThemeInitScript();
      expect(script).toContain(`'${Theme.Dark}'`);
    });

    it('should include light theme value', () => {
      const script = getThemeInitScript();
      expect(script).toContain(`'${Theme.Light}'`);
    });

    it('should include all Theme enum values', () => {
      const script = getThemeInitScript();
      const themeValues = Object.values(Theme);

      for (const theme of themeValues) {
        expect(script).toContain(`'${theme}'`);
      }
    });
  });

  describe('DOM manipulation', () => {
    it('should set data-theme attribute on document element', () => {
      const script = getThemeInitScript();
      expect(script).toContain("document.documentElement.setAttribute('data-theme'");
    });

    it('should include default dark theme fallback', () => {
      const script = getThemeInitScript();
      expect(script).toContain("'dark'");
    });
  });

  describe('error handling', () => {
    it('should include try-catch for localStorage access', () => {
      const script = getThemeInitScript();
      expect(script).toContain('try');
      expect(script).toContain('catch');
    });
  });

  describe('allowed themes validation', () => {
    it('should create allowed themes array', () => {
      const script = getThemeInitScript();
      expect(script).toContain('var allowed');
    });

    it('should check if theme is in allowed list', () => {
      const script = getThemeInitScript();
      expect(script).toContain('allowed.includes');
    });
  });
});
