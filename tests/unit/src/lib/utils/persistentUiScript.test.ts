/**
 * PersistentUiScript Unit Tests
 *
 * @fileoverview Tests for the persistent UI initialization script generator.
 */

import {
    getCombinedInitScript,
    getPersistentUiInitScript,
} from '@/lib/utils/persistentUiScript';
import { beforeEach, describe, expect, it } from 'vitest';

const STORAGE_KEY = 'ikuisuus-ui-state';
const ROOT_ATTRIBUTES = [
  'data-theme',
  'data-aspect-display',
  'data-aspect-expanded',
  'data-stream-text',
  'data-section-decor',
  'data-constrained-hue',
];

/**
 * Executes the generated IIFE against the jsdom document, as the browser
 * would from `<head>`.
 */
function runInitScript(): void {
  new Function(getPersistentUiInitScript())();
}

/**
 * Clears every store the script reads and every root hook it writes.
 */
function resetRoot(): void {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = `${STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = 'theme=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  const root = document.documentElement;
  ROOT_ATTRIBUTES.forEach((name) => root.removeAttribute(name));
  root.style.removeProperty('--text-scale-user');
  root.style.removeProperty('--prose-measure');
}

describe('persistentUiScript', () => {
  describe('root hooks before first paint', () => {
    beforeEach(resetRoot);

    it('stamps stored text scale, prose measure and constrained hue ahead of data-theme', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme: 'light',
          textScale: 1.25,
          proseMeasure: 72,
          constrainedHue: true,
        }),
      );

      runInitScript();

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--text-scale-user')).toBe('1.25');
      expect(root.style.getPropertyValue('--prose-measure')).toBe('72ch');
      expect(root.getAttribute('data-constrained-hue')).toBe('true');
      expect(root.getAttribute('data-theme')).toBe('light');
    });

    it('falls back to the shipped defaults with no store', () => {
      runInitScript();

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--text-scale-user')).toBe('1');
      expect(root.style.getPropertyValue('--prose-measure')).toBe('100ch');
      expect(root.getAttribute('data-constrained-hue')).toBe('false');
      expect(root.getAttribute('data-theme')).toBe('dark');
    });

    it('rejects non-positive, non-finite and non-numeric values like readPositiveNumber', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          textScale: -2,
          proseMeasure: 'wide',
          constrainedHue: 'yes',
        }),
      );

      runInitScript();

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--text-scale-user')).toBe('1');
      expect(root.style.getPropertyValue('--prose-measure')).toBe('100ch');
      expect(root.getAttribute('data-constrained-hue')).toBe('false');
    });

    it('survives a corrupt store and still lifts the body', () => {
      localStorage.setItem(STORAGE_KEY, '{not json');

      runInitScript();

      const root = document.documentElement;
      expect(root.getAttribute('data-theme')).toBe('dark');
      expect(root.style.getPropertyValue('--text-scale-user')).toBe('1');
    });
  });

  describe('getPersistentUiInitScript', () => {
    it('should return a string', () => {
      const script = getPersistentUiInitScript();
      expect(typeof script).toBe('string');
    });

    it('should contain an IIFE pattern', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain('(function()');
      expect(script).toContain('})();');
    });

    it('should reference the storage key', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain('ikuisuus-ui-state');
    });

    it('should reference the legacy theme key', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain('data-theme');
    });

    it('should set data-theme attribute on documentElement', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain('document.documentElement.setAttribute');
    });

    it('should default to dark theme', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain("'dark'");
    });

    it('should stamp both decorator flags before first paint', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain('data-stream-text');
      expect(script).toContain('data-section-decor');
    });

    it('should read the stored decorator flags', () => {
      const script = getPersistentUiInitScript();
      expect(script).toContain("typeof state.streamText === 'boolean'");
      expect(script).toContain("typeof state.sectionDecor === 'boolean'");
    });
  });

  describe('getCombinedInitScript', () => {
    it('should return a string', () => {
      const script = getCombinedInitScript();
      expect(typeof script).toBe('string');
    });

    it('should include the storage key', () => {
      const script = getCombinedInitScript();
      expect(script).toContain('ikuisuus-ui-state');
    });

    it('should contain an IIFE pattern', () => {
      const script = getCombinedInitScript();
      expect(script).toContain('(function()');
      expect(script).toContain('})();');
    });
  });
});
