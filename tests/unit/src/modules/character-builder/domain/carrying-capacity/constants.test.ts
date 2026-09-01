/**
 * @fileoverview carryingCapacity Re-export Tests (backward compatibility)
 * @description Validates that lib/data/carryingCapacity re-exports work correctly.
 *
 * @module tests/unit/src/modules/character-builder/domain/carrying-capacity/constants.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { computeCapacity } from '@/lib/data/carryingCapacity';
import { describe, expect, it } from 'vitest';

describe('carryingCapacity re-exports', () => {
  it('computeCapacity re-export works for STR 10 medium biped', () => {
    expect(computeCapacity(10, 'medium', false)).toEqual({
      light: 33,
      medium: 66,
      heavy: 100,
    });
  });
});
