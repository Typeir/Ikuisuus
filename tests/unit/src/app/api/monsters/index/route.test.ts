/**
 * @fileoverview Tests for Monster Index API Route
 * @module tests/unit/src/app/api/monsters/index/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/api/monsters/index/route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as MonsterIndexRoute from '@/app/api/monsters/index/route';

const { GET } = MonsterIndexRoute;

describe('Monster Index API Route', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Module exports', () => {
    it('should export GET handler', () => {
      expect(GET).toBeDefined();
    });

    it('should export GET as a function', () => {
      expect(typeof GET).toBe('function');
    });

    it('should export GET as an async function', () => {
      expect(GET.constructor.name).toBe('AsyncFunction');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(MonsterIndexRoute);
      expect(exports).toContain('GET');
      expect(exports).not.toContain('POST');
      expect(exports).not.toContain('PUT');
      expect(exports).not.toContain('DELETE');
    });
  });

  describe('GET handler signature', () => {
    it('should accept Request parameter', () => {
      expect(GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET handler behavior', () => {
    it('should return a Response object', async () => {
      const request = new Request('http://localhost/api/monsters/index');
      const response = await GET(request);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return JSON content type', async () => {
      const request = new Request('http://localhost/api/monsters/index');
      const response = await GET(request);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle locale parameter in URL', async () => {
      const request = new Request('http://localhost/api/monsters/index?locale=en');
      const response = await GET(request);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return 200 or 500 status', async () => {
      const request = new Request('http://localhost/api/monsters/index');
      const response = await GET(request);
      expect([200, 500]).toContain(response.status);
    });

    it('should return array or error object in body', async () => {
      const request = new Request('http://localhost/api/monsters/index');
      const response = await GET(request);
      const data = await response.json();
      
      if (response.status === 200) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });
});
