import { formatModifier } from '@/lib/utils/formatModifier';
import { describe, expect, it } from 'vitest';

describe('formatModifier', () => {
  it('prefixes non-negative modifiers with a plus', () => {
    expect(formatModifier(2)).toBe('+2');
    expect(formatModifier(0)).toBe('+0');
  });

  it('keeps the minus on negative modifiers', () => {
    expect(formatModifier(-1)).toBe('-1');
  });
});
