/**
 * @fileoverview Tests for the card hosts' casing and flag helpers.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/text.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import {
  capitalize,
  flagOf,
  lowerFirst,
} from '@/modules/library/presentation/components/slots/text';

describe('capitalize', () => {
  it('upper-cases the first character only', () => {
    expect(capitalize('adventuring gear')).toBe('Adventuring gear');
    expect(capitalize('Already')).toBe('Already');
    expect(capitalize('')).toBe('');
  });
});

describe('lowerFirst', () => {
  it('lower-cases the first character only', () => {
    expect(lowerFirst('Longsword')).toBe('longsword');
    expect(lowerFirst('')).toBe('');
  });
});

describe('flagOf', () => {
  it('reads the bare attribute MDX compiles to true', () => {
    expect(flagOf(true)).toBe(true);
    expect(flagOf(null)).toBe(true);
  });

  it('reads the words for yes and no, in any casing', () => {
    expect(flagOf('true')).toBe(true);
    expect(flagOf('Yes')).toBe(true);
    expect(flagOf('')).toBe(true);
    expect(flagOf('false')).toBe(false);
    expect(flagOf('NO')).toBe(false);
  });

  it('treats an absent or negated flag as off', () => {
    expect(flagOf(undefined)).toBe(false);
    expect(flagOf(false)).toBe(false);
  });

  it('hands back a detail as given, trimmed', () => {
    expect(flagOf(' once per tier ')).toBe('once per tier');
    const node = { type: 'span' };
    expect(flagOf(node)).toBe(node);
  });
});
