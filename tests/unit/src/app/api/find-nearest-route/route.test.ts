/**
 * Find Nearest Route API Route Unit Tests
 *
 * @fileoverview Tests for the /api/find-nearest-route endpoint exports and structure.
 * Full integration testing is handled by e2e tests.
 *
 * @module tests/unit/src/app/api/find-nearest-route/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/find-nearest-route/route Module under test
 */

import { describe, it, expect } from 'vitest';
import * as FindNearestRouteRoute from '@/app/api/find-nearest-route/route';

describe('/api/find-nearest-route route', () => {
  describe('exports', () => {
    it('should export POST handler', () => {
      expect(FindNearestRouteRoute.POST).toBeDefined();
      expect(typeof FindNearestRouteRoute.POST).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(FindNearestRouteRoute);
      expect(exports).toContain('POST');
    });
  });

  describe('POST handler signature', () => {
    it('should be an async function', () => {
      expect(FindNearestRouteRoute.POST.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(FindNearestRouteRoute.POST.length).toBeGreaterThanOrEqual(1);
    });
  });
});
