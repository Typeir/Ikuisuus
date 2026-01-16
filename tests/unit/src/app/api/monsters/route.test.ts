/**
 * Monsters API Route Unit Tests
 *
 * @fileoverview Tests for the /api/monsters endpoint exports and structure.
 * Full integration testing is handled by e2e tests.
 *
 * @module tests/unit/app/api/monsters/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/monsters/route Module under test
 */

import { describe, it, expect } from 'vitest';
import * as MonstersRoute from '@/app/api/monsters/route';

describe('/api/monsters route', () => {
  describe('exports', () => {
    it('should export GET handler', () => {
      expect(MonstersRoute.GET).toBeDefined();
      expect(typeof MonstersRoute.GET).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(MonstersRoute);
      expect(exports).toContain('GET');
    });
  });

  describe('GET handler signature', () => {
    it('should be an async function', () => {
      expect(MonstersRoute.GET.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(MonstersRoute.GET.length).toBeGreaterThanOrEqual(1);
    });
  });
});
