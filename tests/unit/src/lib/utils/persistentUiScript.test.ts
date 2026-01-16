/**
 * PersistentUiScript Unit Tests
 *
 * @fileoverview Tests for the persistent UI initialization script generator.
 */

import {
    getCombinedInitScript,
    getPersistentUiInitScript,
} from '@/lib/utils/persistentUiScript';
import { describe, expect, it } from 'vitest';

describe('persistentUiScript', () => {
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
