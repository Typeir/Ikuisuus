import { buildMonsterColumns } from '@/modules/metadata-tables/presentation/MonsterTable/MonsterTable.columns';
import { describe, expect, it } from 'vitest';

describe('buildMonsterColumns', () => {
  it('returns expected column keys', () => {
    const columns = buildMonsterColumns((key) => key);
    expect(columns.map((column) => column.key)).toEqual([
      'title',
      'size',
      'creatureType',
      'cr',
      'ac',
      'hp',
      'alignment',
    ]);
  });
});
