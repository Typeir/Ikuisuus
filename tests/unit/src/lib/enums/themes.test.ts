/**
 * @fileoverview Theme Enum Unit Tests
 * @description Tests for the Theme enum that defines available UI color themes.
 * Used by ThemeSelector component, themeScript, and CSS custom properties.
 *
 * @module tests/unit/lib/enums/themes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/enums/themes Enum under test
 */

import { describe, it, expect } from 'vitest';
import { Theme } from '@/lib/enums/themes';

describe('Theme', () => {
  describe('exports', () => {
    it('should export Theme enum', () => {
      expect(Theme).toBeDefined();
    });
  });

  describe('theme values', () => {
    it('should define Dark theme', () => {
      expect(Theme.Dark).toBeDefined();
      expect(Theme.Dark).toBe('dark');
    });

    it('should define Light theme', () => {
      expect(Theme.Light).toBeDefined();
      expect(Theme.Light).toBe('light');
    });

    it('should have exactly two themes', () => {
      const themes = Object.values(Theme);
      expect(themes.length).toBe(2);
    });
  });

  describe('value format', () => {
    it('should use lowercase strings', () => {
      Object.values(Theme).forEach((theme) => {
        expect(theme).toBe(theme.toLowerCase());
      });
    });

    it('should be valid CSS data attribute values', () => {
      Object.values(Theme).forEach((theme) => {
        expect(theme).toMatch(/^[a-z]+$/);
      });
    });
  });

  describe('usage patterns', () => {
    it('should work with data-theme attribute', () => {
      const element = document.createElement('html');
      element.setAttribute('data-theme', Theme.Dark);
      expect(element.getAttribute('data-theme')).toBe('dark');
    });

    it('should work with CSS selector', () => {
      const selector = `html[data-theme="${Theme.Light}"]`;
      expect(selector).toBe('html[data-theme="light"]');
    });

    it('should be type-safe for ThemeSelector', () => {
      const currentTheme: Theme = Theme.Dark;
      expect(currentTheme).toBe('dark');
    });

    it('should be iterable for theme cycling', () => {
      const themes = Object.values(Theme);
      expect(themes).toContain('dark');
      expect(themes).toContain('light');
    });
  });

  describe('enum integrity', () => {
    it('should have unique values', () => {
      const values = Object.values(Theme);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should be consistent between key and value', () => {
      expect(Theme.Dark.includes('dark')).toBe(true);
      expect(Theme.Light.includes('light')).toBe(true);
    });
  });
});
