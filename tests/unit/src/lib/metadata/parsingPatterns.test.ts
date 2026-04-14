/**
 * @fileoverview Tests for parsing pattern dictionaries
 * @module tests/unit/src/lib/metadata/parsingPatterns.test
 */

import {
  CHARGES,
  HEADING,
  PROPERTIES,
} from '@scripts/metadata/parsingPatterns';
import { describe, expect, it } from 'vitest';

describe('HEADING patterns', () => {
  it('matches H1 headings', () => {
    expect(HEADING.h1.test('# Title')).toBe(true);
    expect(HEADING.h1.test('## Not H1')).toBe(false);
  });
});

describe('PROPERTIES patterns', () => {
  it('extracts weight value', () => {
    const match = '2.5 lbs'.match(PROPERTIES.weight);
    expect(match?.[1]).toBe('2.5');
  });

  it('matches properties section', () => {
    const text = '## Properties\n- **Weight**: 3 lbs\n\n## Next';
    expect(PROPERTIES.section.test(text)).toBe(true);
  });
});

describe('CHARGES patterns', () => {
  it('matches initial charges', () => {
    expect(CHARGES.initial.test('holds 10 charges')).toBe(true);
    expect(CHARGES.initial.test('holds up to 3d6 charges')).toBe(true);
  });

  it('matches charge recovery', () => {
    expect(CHARGES.recovery.test('recovers 1d6 charges at dawn')).toBe(true);
  });

  it('matches depletion', () => {
    expect(CHARGES.depletion.test('becomes inert')).toBe(true);
    expect(CHARGES.depletion.test('burns away')).toBe(true);
  });
});
