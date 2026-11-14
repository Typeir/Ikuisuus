/**
 * @fileoverview fuzzyScore tests.
 *
 * @module tests/unit/src/modules/library/application/use-cases/fuzzyScore.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  FUZZY_SUBSTRING_FLOOR,
  scoreFuzzy,
} from '@/modules/library/application/use-cases/fuzzyScore';
import { describe, expect, it } from 'vitest';

describe('scoreFuzzy', () => {
  it('scores an exact field 1', () => {
    expect(scoreFuzzy('Fireball', ['fireball'])).toBe(1);
  });

  it('floors substring hits', () => {
    expect(scoreFuzzy('fire', ['wall-of-fire'])).toBeGreaterThanOrEqual(
      FUZZY_SUBSTRING_FLOOR,
    );
  });

  it('ranks closer edits higher', () => {
    expect(scoreFuzzy('wizrd', ['wizard'])).toBeGreaterThan(
      scoreFuzzy('wizrd', ['berserker']),
    );
  });

  it('scores an empty query 0', () => {
    expect(scoreFuzzy('  ', ['x'])).toBe(0);
  });
});
