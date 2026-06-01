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
});
