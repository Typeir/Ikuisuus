import {
  DEFAULT_SPELL_LEVEL_LABELS,
  RARITY_SORT_ORDER,
  SIZE_SORT_ORDER,
} from '@/modules/metadata-tables/domain/constants';
import { describe, expect, it } from 'vitest';

describe('constants', () => {
  it('contains expected rarity ordering keys', () => {
    expect(RARITY_SORT_ORDER.common).toBeGreaterThanOrEqual(0);
    expect(RARITY_SORT_ORDER.legendary).toBeGreaterThan(RARITY_SORT_ORDER.common);
  });

  it('contains expected size ordering keys', () => {
    expect(SIZE_SORT_ORDER.tiny).toBe(0);
    expect(SIZE_SORT_ORDER.gargantuan).toBeGreaterThan(SIZE_SORT_ORDER.small);
  });

  it('contains spell level labels', () => {
    expect(DEFAULT_SPELL_LEVEL_LABELS[0]).toBe('Cantrip');
    expect(DEFAULT_SPELL_LEVEL_LABELS[12]).toBe('12th Level');
  });
});
