import { ENCOUNTER_SAVE_INDICATOR_MS } from '@/lib/constants/delays';
import { describe, expect, it } from 'vitest';

describe('delays constants', () => {
  it('exports ENCOUNTER_SAVE_INDICATOR_MS as a number', () => {
    expect(typeof ENCOUNTER_SAVE_INDICATOR_MS).toBe('number');
    expect(ENCOUNTER_SAVE_INDICATOR_MS).toBeGreaterThanOrEqual(0);
  });
});
