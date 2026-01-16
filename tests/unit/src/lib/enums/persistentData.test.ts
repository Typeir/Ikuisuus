/**
 * @fileoverview Persistent Data Enum Unit Tests
 * @description Tests for persistent data keys used in localStorage and DOM data attributes
 * for cross-session state persistence (theme, preferences).
 *
 * @module tests/unit/lib/enums/persistentData
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/enums/persistentData Enum under test
 */

import { describe, it, expect } from 'vitest';
import { PersistentData } from '@/lib/enums/persistentData';

describe('PersistentData', () => {
  describe('exports', () => {
    it('should export PersistentData enum', () => {
      expect(PersistentData).toBeDefined();
    });
  });

  describe('Theme key', () => {
    it('should define Theme key', () => {
      expect(PersistentData.Theme).toBeDefined();
    });

    it('should be data-theme for HTML attribute usage', () => {
      expect(PersistentData.Theme).toBe('data-theme');
    });

    it('should be usable as data attribute key', () => {
      const key = PersistentData.Theme;
      expect(key.startsWith('data-')).toBe(true);
    });
  });

  describe('usage patterns', () => {
    it('should work with localStorage', () => {
      const key = PersistentData.Theme;
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should work with setAttribute', () => {
      const element = document.createElement('html');
      element.setAttribute(PersistentData.Theme, 'dark');
      expect(element.getAttribute(PersistentData.Theme)).toBe('dark');
    });

    it('should work with getAttribute', () => {
      const element = document.createElement('html');
      element.setAttribute(PersistentData.Theme, 'light');
      const value = element.getAttribute(PersistentData.Theme);
      expect(value).toBe('light');
    });

    it('should work with CSS attribute selector', () => {
      const selector = `html[${PersistentData.Theme}="dark"]`;
      expect(selector).toBe('html[data-theme="dark"]');
    });
  });

  describe('enum integrity', () => {
    it('should have consistent key-value format', () => {
      Object.values(PersistentData).forEach((value) => {
        expect(value.startsWith('data-')).toBe(true);
      });
    });

    it('should use lowercase kebab-case values', () => {
      Object.values(PersistentData).forEach((value) => {
        expect(value).toBe(value.toLowerCase());
        expect(value).not.toContain('_');
      });
    });
  });
});
