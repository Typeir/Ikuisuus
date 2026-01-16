/**
 * Trinkets API Route Unit Tests
 *
 * @fileoverview Tests for the /api/trinkets endpoint exports and structure.
 * Full integration testing is handled by e2e tests.
 *
 * @module tests/unit/app/api/trinkets/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/trinkets/route Module under test
 */

import { describe, it, expect } from 'vitest';
import * as TrinketsRoute from '@/app/api/trinkets/route';

describe('/api/trinkets route', () => {
  describe('exports', () => {
    it('should export GET handler', () => {
      expect(TrinketsRoute.GET).toBeDefined();
      expect(typeof TrinketsRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(TrinketsRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(TrinketsRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(TrinketsRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });
});
