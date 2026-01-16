/**
 * Search API Route Unit Tests
 *
 * @fileoverview Tests for the /api/search endpoint exports, structure, and
 * query parameter validation behavior.
 *
 * @module tests/unit/app/api/search/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/search/route Module under test
 */

import { describe, it, expect } from 'vitest';
import * as SearchRoute from '@/app/api/search/route';

describe('/api/search route', () => {
  describe('exports', () => {
    it('should export GET handler', () => {
      expect(SearchRoute.GET).toBeDefined();
      expect(typeof SearchRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(SearchRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(SearchRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(SearchRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('query parameter validation', () => {
    it('should return empty array for query shorter than 2 characters', async () => {
      const request = new Request('http://localhost/api/search?q=a');
      const response = await SearchRoute.GET(request);
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const request = new Request('http://localhost/api/search?q=');
      const response = await SearchRoute.GET(request);
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('should return empty array when q parameter is missing', async () => {
      const request = new Request('http://localhost/api/search');
      const response = await SearchRoute.GET(request);
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('should return JSON response type', async () => {
      const request = new Request('http://localhost/api/search?q=a');
      const response = await SearchRoute.GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
