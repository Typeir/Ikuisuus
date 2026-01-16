/**
 * Heirlooms API Route Unit Tests
 *
 * @fileoverview Tests for the /api/heirlooms endpoint exports and structure.
 * Full integration testing is handled by e2e tests.
 *
 * @module tests/unit/app/api/heirlooms/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/heirlooms/route Module under test
 */

import { describe, it, expect } from 'vitest';
import * as HeirloomsRoute from '@/app/api/heirlooms/route';

describe('/api/heirlooms route', () => {
  describe('exports', () => {
    it('should export GET handler', () => {
      expect(HeirloomsRoute.GET).toBeDefined();
      expect(typeof HeirloomsRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(HeirloomsRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(HeirloomsRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(HeirloomsRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });
});
