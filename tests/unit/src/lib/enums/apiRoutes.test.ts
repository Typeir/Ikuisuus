/**
 * @fileoverview API Routes Enum Unit Tests
 * @description Tests for centralized API endpoint constants ensuring type safety
 * and correct route path definitions.
 *
 * @module tests/unit/lib/enums/apiRoutes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/enums/apiRoutes Enum under test
 */

import { ApiRoutes } from '@/lib/enums/apiRoutes';
import { describe, expect, it } from 'vitest';

describe('ApiRoutes', () => {
  describe('exports', () => {
    it('should export ApiRoutes enum', () => {
      expect(ApiRoutes).toBeDefined();
    });

    it('should have correct number of routes', () => {
      const routeCount = Object.keys(ApiRoutes).length;
      expect(routeCount).toBe(6);
    });
  });

  describe('route values', () => {
    it('should define Monsters route', () => {
      expect(ApiRoutes.Monsters).toBe('/api/monsters');
    });

    it('should define Heirlooms route', () => {
      expect(ApiRoutes.Heirlooms).toBe('/api/heirlooms');
    });

    it('should define Spells route', () => {
      expect(ApiRoutes.Spells).toBe('/api/spells');
    });

    it('should define Trinkets route', () => {
      expect(ApiRoutes.Trinkets).toBe('/api/trinkets');
    });

    it('should define FindNearestRoute route', () => {
      expect(ApiRoutes.FindNearestRoute).toBe('/api/find-nearest-route');
    });

    it('should define Discovery route', () => {
      expect(ApiRoutes.Discovery).toBe('/api/discovery');
    });
  });

  describe('route format', () => {
    it('should all start with /api/', () => {
      Object.values(ApiRoutes).forEach((route) => {
        expect(route).toMatch(/^\/api\//);
      });
    });

    it('should all be lowercase paths', () => {
      Object.values(ApiRoutes).forEach((route) => {
        expect(route).toBe(route.toLowerCase());
      });
    });

    it('should not have trailing slashes', () => {
      Object.values(ApiRoutes).forEach((route) => {
        expect(route).not.toMatch(/\/$/);
      });
    });

    it('should be valid URL paths', () => {
      Object.values(ApiRoutes).forEach((route) => {
        expect(route).toMatch(/^\/[a-z0-9\-\/]+$/);
      });
    });
  });

  describe('enum usage', () => {
    it('should be usable as string', () => {
      const route: string = ApiRoutes.Monsters;
      expect(typeof route).toBe('string');
    });

    it('should work with string concatenation', () => {
      const url = `http://localhost:3000${ApiRoutes.Monsters}`;
      expect(url).toBe('http://localhost:3000/api/monsters');
    });

    it('should work with template literals', () => {
      const query = 'locale=en';
      const fullUrl = `${ApiRoutes.Spells}?${query}`;
      expect(fullUrl).toBe('/api/spells?locale=en');
    });
  });
});
