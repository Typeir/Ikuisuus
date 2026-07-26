import { buildTrinketColumns } from '@/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns';
import { describe, expect, it } from 'vitest';

describe('buildTrinketColumns', () => {
  it('returns expected column keys', () => {
    const columns = buildTrinketColumns((key) => key);
    expect(columns.map((column) => column.key)).toEqual([
      'title',
      'itemType',
      'damage',
      'range',
      'specialEffects',
      'inflictsConditions',
      'weight',
    ]);
  });

  it('strips [% … %] dice-expression markers from the damage cell', () => {
    const damage = buildTrinketColumns((key) => key).find(
      (c) => c.key === 'damage',
    );
    const row = { damage: '[% 1d10 %]', damageType: 'burning' } as never;
    expect(damage?.getValue?.(row)).toBe('1d10');
    expect(damage?.render?.('[% 1d10 %]', row)).toBe('1d10 burning');
  });
});
