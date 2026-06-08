/**
 * @fileoverview Unit tests for nearest-route Levenshtein helpers.
 * @module tests/unit/src/modules/library/application/use-cases/findNearestRoute.levenshtein
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import {
    calculateSimilarity,
    levenshteinDistance,
} from '@/modules/library/application/use-cases/findNearestRoute.levenshtein';
import { describe, expect, it } from 'vitest';

describe('findNearestRoute.levenshtein', () => {
  it('calculates edit distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('spell', 'spell')).toBe(0);
  });

  it('calculates normalized similarity', () => {
    expect(calculateSimilarity('fireball', 'fireball')).toBe(1);
    expect(calculateSimilarity('fireball', 'firebll')).toBeGreaterThan(0.8);
    expect(calculateSimilarity('', '')).toBe(1);
  });
});
