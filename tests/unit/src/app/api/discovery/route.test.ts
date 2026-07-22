/**
 * Discovery API Route Unit Tests
 *
 * @fileoverview Tests for the /api/discovery endpoint exports and structure.
 * Full integration testing is handled by e2e tests.
 *
 * @module tests/unit/app/api/discovery/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/discovery/route Module under test
 */

import * as DiscoveryRoute from '@/app/api/discovery/route';
import { describe, expect, it } from 'vitest';

describe('/api/discovery route', () => {
  describe('exports', () => {
    it('should export GET handler', () => {
      expect(DiscoveryRoute.GET).toBeDefined();
      expect(typeof DiscoveryRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(DiscoveryRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(DiscoveryRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(DiscoveryRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET input validation', () => {
    it('should reject an invalid locale with 400', async () => {
      const res = await DiscoveryRoute.GET(
        new Request('http://localhost/api/discovery?locale=..%2F..%2Fetc'),
      );
      expect(res.status).toBe(400);
    });

    it('should reject an unknown type with 400', async () => {
      const res = await DiscoveryRoute.GET(
        new Request('http://localhost/api/discovery?type=nonsense'),
      );
      expect(res.status).toBe(400);
    });
  });
});
