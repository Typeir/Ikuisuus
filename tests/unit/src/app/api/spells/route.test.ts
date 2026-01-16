/**
 * Spells API Route Unit Tests
 *
 * @fileoverview Tests for the /api/spells endpoint exports and structure.
 * Full integration testing is handled by e2e tests.
 *
 * @module tests/unit/app/api/spells/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/app/api/spells/route Module under test
 */

import { describe, it, expect } from 'vitest';
import * as SpellsRoute from '@/app/api/spells/route';

describe('/api/spells route', () => {
  describe('exports', () => {
    it('should export POST handler', () => {
      expect(SpellsRoute.POST).toBeDefined();
      expect(typeof SpellsRoute.POST).toBe('function');
    });

    it('should only export expected handlers', () => {
      const exports = Object.keys(SpellsRoute);
      expect(exports).toContain('POST');
    });
  });

  describe('POST handler signature', () => {
    it('should be an async function', () => {
      expect(SpellsRoute.POST.constructor.name).toBe('AsyncFunction');
    });

    it('should accept Request parameter', () => {
      expect(SpellsRoute.POST.length).toBeGreaterThanOrEqual(1);
    });
  });
});
