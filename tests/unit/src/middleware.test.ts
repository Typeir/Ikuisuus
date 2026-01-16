/**
 * Middleware Unit Tests
 *
 * @fileoverview Tests for the locale-enforcing middleware configuration and
 * the replaceFirstSegment helper function logic.
 *
 * @module tests/unit/middleware
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/middleware Module under test
 */

import { describe, it, expect } from 'vitest';
import middleware, { config } from '@/middleware';

describe('middleware', () => {
  describe('exports', () => {
    it('should export default middleware function', () => {
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('should export config object', () => {
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should export config with matcher property', () => {
      expect(config.matcher).toBeDefined();
      expect(typeof config.matcher).toBe('string');
    });
  });

  describe('config.matcher', () => {
    it('should exclude API routes from matching', () => {
      expect(config.matcher).toContain('(?!api');
    });

    it('should exclude _next directory from matching', () => {
      expect(config.matcher).toContain('_next');
    });

    it('should exclude _vercel directory from matching', () => {
      expect(config.matcher).toContain('_vercel');
    });

    it('should exclude static file extensions', () => {
      expect(config.matcher).toContain('.*\\..*)');
    });

    it('should exclude trpc routes from matching', () => {
      expect(config.matcher).toContain('trpc');
    });
  });
});

describe('replaceFirstSegment helper logic', () => {
  const replaceFirstSegment = (parts: string[], replacement: string): string => {
    if (parts.length === 0) return `/${replacement}`;
    const rest = parts.slice(1).join('/');
    return rest ? `/${replacement}/${rest}` : `/${replacement}`;
  };

  describe('path segment replacement', () => {
    it('should replace first segment with replacement value', () => {
      const parts = ['fr', 'library', 'monsters'];
      const result = replaceFirstSegment(parts, 'en');
      expect(result).toBe('/en/library/monsters');
    });

    it('should handle empty parts array', () => {
      const parts: string[] = [];
      const result = replaceFirstSegment(parts, 'en');
      expect(result).toBe('/en');
    });

    it('should handle single segment paths', () => {
      const parts = ['library'];
      const result = replaceFirstSegment(parts, 'en');
      expect(result).toBe('/en');
    });

    it('should preserve rest of path after replacement', () => {
      const parts = ['de', 'library', 'monsters', 'dragon'];
      const result = replaceFirstSegment(parts, 'en');
      expect(result).toBe('/en/library/monsters/dragon');
    });

    it('should handle deeply nested paths', () => {
      const parts = ['fr', 'a', 'b', 'c', 'd', 'e'];
      const result = replaceFirstSegment(parts, 'es');
      expect(result).toBe('/es/a/b/c/d/e');
    });

    it('should produce canonical paths starting with /', () => {
      const parts = ['foo', 'bar'];
      const result = replaceFirstSegment(parts, 'en');
      expect(result.startsWith('/')).toBe(true);
    });
  });

  describe('locale replacement scenarios', () => {
    it('should replace unsupported locale with default', () => {
      const parts = ['pt-BR', 'content'];
      const result = replaceFirstSegment(parts, 'en');
      expect(result).toBe('/en/content');
    });

    it('should handle path without locale prefix', () => {
      const parts = ['library', 'items'];
      const result = replaceFirstSegment(parts, 'en');
      expect(result).toBe('/en/items');
    });
  });
});
