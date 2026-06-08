import { buildHeirloomColumns } from '@/modules/metadata-tables/presentation/HeirloomTable/HeirloomTable.columns';
import { describe, expect, it } from 'vitest';

describe('buildHeirloomColumns', () => {
  it('returns expected column keys', () => {
    const columns = buildHeirloomColumns(
      (key) => key,
      (key) => key,
    );
    expect(columns.map((column) => column.key)).toEqual([
      'title',
      'rarity',
      'itemType',
      'weaponType',
      'requiresAttunement',
    ]);
  });
});
