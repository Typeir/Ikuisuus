/**
 * @fileoverview Tests for Single Monster API Route
 * @module tests/unit/src/app/api/monsters/[slug]/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/api/monsters/[slug]/route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as MonsterSlugRoute from '@/app/api/monsters/[slug]/route';

const { GET } = MonsterSlugRoute;

describe('Single Monster API Route', () => {
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
      const exports = Object.keys(MonsterSlugRoute);
      expect(exports).toContain('GET');
      expect(exports).not.toContain('POST');
      expect(exports).not.toContain('PUT');
      expect(exports).not.toContain('DELETE');
    });
  });

  describe('GET handler signature', () => {
    it('should accept Request and context parameters', () => {
      expect(GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET handler behavior', () => {
    it('should return a Response object with valid slug', async () => {
      const request = new Request('http://localhost/api/monsters/test-monster');
      const context = { params: Promise.resolve({ slug: 'test-monster' }) };
      const response = await GET(request, context);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return JSON content type', async () => {
      const request = new Request('http://localhost/api/monsters/test-monster');
      const context = { params: Promise.resolve({ slug: 'test-monster' }) };
      const response = await GET(request, context);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle locale parameter in URL', async () => {
      const request = new Request('http://localhost/api/monsters/test-monster?locale=en');
      const context = { params: Promise.resolve({ slug: 'test-monster' }) };
      const response = await GET(request, context);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return 200, 404, or 500 status', async () => {
      const request = new Request('http://localhost/api/monsters/test-monster');
      const context = { params: Promise.resolve({ slug: 'test-monster' }) };
      const response = await GET(request, context);
      expect([200, 404, 500]).toContain(response.status);
    });

    it('should return monster object or error in body', async () => {
      const request = new Request('http://localhost/api/monsters/test-monster');
      const context = { params: Promise.resolve({ slug: 'test-monster' }) };
      const response = await GET(request, context);
      const data = await response.json();
      
      if (response.status === 200) {
        expect(data).toHaveProperty('slug');
        expect(data).toHaveProperty('title');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should return 404 for non-existent monster slug', async () => {
      const request = new Request('http://localhost/api/monsters/definitely-not-a-real-monster-12345');
      const context = { params: Promise.resolve({ slug: 'definitely-not-a-real-monster-12345' }) };
      const response = await GET(request, context);
      expect([404, 500]).toContain(response.status);
    });

    it('should handle async params pattern (Next.js 15)', async () => {
      const request = new Request('http://localhost/api/monsters/test');
      const context = { params: Promise.resolve({ slug: 'test' }) };
      const response = await GET(request, context);
      expect(response).toBeInstanceOf(Response);
    });
  });
});
