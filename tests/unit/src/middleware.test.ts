/**
 * Middleware Unit Tests
 *
 * @fileoverview Tests for the locale-enforcing middleware configuration and
 * the replaceFirstSegment helper function logic.
 *
 * @module tests/unit/src/middleware.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/middleware Module under test
 */

import middleware, { config } from '@/middleware';
import { describe, expect, it } from 'vitest';

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
  const replaceFirstSegment = (
    parts: string[],
    replacement: string,
  ): string => {
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

describe('middleware function behavior', () => {
  /**
   * Creates a mock NextRequest for middleware testing.
   */
  function createMockRequest(pathname: string): any {
    const url = new URL(`http://localhost:3000${pathname}`);
    return {
      nextUrl: {
        pathname: url.pathname,
        clone: () => {
          const cloned = new URL(url.toString());
          return {
            pathname: cloned.pathname,
            toString: () => cloned.toString(),
            set pathname(val: string) {
              cloned.pathname = val;
            },
            get pathname() {
              return cloned.pathname;
            },
          };
        },
      },
    };
  }

  it('should redirect root path to default locale', () => {
    const req = createMockRequest('/');
    const response = middleware(req);

    expect(response).toBeDefined();
    expect(response.status).toBe(308);
  });

  it('should redirect unsupported locale to default locale', () => {
    const req = createMockRequest('/fr/library/monsters');
    const response = middleware(req);

    expect(response).toBeDefined();
    expect(response.status).toBe(308);
  });

  it('should redirect path without locale prefix', () => {
    const req = createMockRequest('/library/monsters');
    const response = middleware(req);

    expect(response).toBeDefined();
    expect(response.status).toBe(308);
  });


  describe('index canonicalisation', () => {
    it('should redirect a library main index to its folder', () => {
      const res = middleware(
        createMockRequest('/en/library/rules/arcana-and-the-fold/main'),
      );
      expect(res.status).toBe(308);
      expect(res.headers.get('location')).toContain(
        '/en/library/rules/arcana-and-the-fold',
      );
      expect(res.headers.get('location')).not.toContain('/main');
    });

    it('should redirect a top-level library folder index', () => {
      const res = middleware(createMockRequest('/en/library/spells/main'));
      expect(res.status).toBe(308);
      expect(res.headers.get('location')).toContain('/en/library/spells');
    });

    it('should redirect a vocations folder index', () => {
      const res = middleware(
        createMockRequest('/en/library/character-creation/vocations/main'),
      );
      expect(res.status).toBe(308);
      expect(res.headers.get('location')).toContain(
        '/en/library/character-creation/vocations',
      );
    });

    it('should not redirect a main segment outside the library', () => {
      const res = middleware(createMockRequest('/en/something/main'));
      expect(res?.headers?.get('location') ?? '').not.toContain(
        '/en/something',
      );
    });

    it('should redirect a folder-named index to its folder', () => {
      const res = middleware(
        createMockRequest(
          '/en/library/character-creation/vocations/paladin/paladin',
        ),
      );
      expect(res.status).toBe(308);
      expect(res.headers.get('location')).toContain(
        '/en/library/character-creation/vocations/paladin',
      );
      expect(res.headers.get('location')).not.toContain('/paladin/paladin');
    });

    it('should leave an ordinary leaf alone', () => {
      const res = middleware(
        createMockRequest(
          '/en/library/character-creation/vocations/paladin/spells',
        ),
      );
      expect(res?.headers?.get('location') ?? '').toBe('');
    });
  });
});
