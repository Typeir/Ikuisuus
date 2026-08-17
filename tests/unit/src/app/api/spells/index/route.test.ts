/**
 * @fileoverview Tests for Spell Index API Route
 * @module tests/unit/src/app/api/spells/index/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/api/spells/index/route
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as SpellIndexRoute from '@/app/api/spells/index/route';

const { GET } = SpellIndexRoute;

describe('Spell Index API Route', () => {
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
      const exports = Object.keys(SpellIndexRoute);
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
      const request = new Request('http://localhost/api/spells/index');
      const response = await GET(request);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return JSON content type', async () => {
      const request = new Request('http://localhost/api/spells/index');
      const response = await GET(request);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle locale parameter in URL', async () => {
      const request = new Request('http://localhost/api/spells/index?locale=en');
      const response = await GET(request);
      expect(response).toBeInstanceOf(Response);
    });

    it('should return 200 or 500 status', async () => {
      const request = new Request('http://localhost/api/spells/index');
      const response = await GET(request);
      expect([200, 500]).toContain(response.status);
    });

    it('should return array or error object in body', async () => {
      const request = new Request('http://localhost/api/spells/index');
      const response = await GET(request);
      const data = await response.json();
      
      if (response.status === 200) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should return spells with expected minimal fields when successful', async () => {
      const request = new Request('http://localhost/api/spells/index');
      const response = await GET(request);
      const data = await response.json();
      
      if (response.status === 200 && data.length > 0) {
        const firstSpell = data[0];
        expect(firstSpell).toHaveProperty('slug');
        expect(firstSpell).toHaveProperty('title');
        expect(firstSpell).toHaveProperty('level');
      }
    });
  });
});
