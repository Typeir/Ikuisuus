/**
 * @fileoverview MetadataTable Pure Logic Unit Tests
 * @description Tests cell extraction, column filter matching, row href
 * resolution, and filter option derivation.
 *
 * @module tests/unit/src/lib/components/mdx/metadataTables/metadataTableLogic.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  filterOptionsFor,
  getCellValue,
  resolveRowHref,
  rowMatchesColumnFilters,
} from '@/lib/components/mdx/metadataTables/metadataTableLogic';
import type { ColumnConfig } from '@/lib/components/mdx/metadataTables/metadataTable.types';
import { describe, expect, it } from 'vitest';

const column = (overrides: Partial<ColumnConfig> = {}): ColumnConfig => ({
  key: 'name',
  label: 'Name',
  ...overrides,
});

describe('getCellValue', () => {
  it('reads the row property by column key', () => {
    expect(getCellValue({ name: 'Item' }, column())).toBe('Item');
  });

  it('prefers column.getValue when defined', () => {
    const col = column({
      key: 'ac',
      getValue: (row) => row.stats.ac.value,
    });
    expect(getCellValue({ stats: { ac: { value: 18 } } }, col)).toBe(18);
  });
});

describe('rowMatchesColumnFilters', () => {
  const columns: ColumnConfig[] = [
    column({ key: 'name', filterType: 'text' }),
    column({ key: 'rarity', label: 'Rarity', filterType: 'select' }),
    column({ key: 'level', label: 'Level', filterType: 'range' }),
    column({ key: 'tags', label: 'Tags', filterType: 'multiselect' }),
  ];
  const row = {
    name: 'Sunforged Spear',
    rarity: 'Rare',
    level: 5,
    tags: ['weapon', 'artifact'],
  };

  it('passes when no filters are active', () => {
    expect(rowMatchesColumnFilters(row, {}, columns)).toBe(true);
  });

  it('matches text filters by substring, case-insensitively', () => {
    expect(rowMatchesColumnFilters(row, { name: 'spear' }, columns)).toBe(true);
    expect(rowMatchesColumnFilters(row, { name: 'axe' }, columns)).toBe(false);
  });

  it('matches select filters exactly', () => {
    expect(rowMatchesColumnFilters(row, { rarity: 'rare' }, columns)).toBe(
      true,
    );
    expect(rowMatchesColumnFilters(row, { rarity: 'ra' }, columns)).toBe(false);
  });

  it('bounds range filters by min and max', () => {
    expect(rowMatchesColumnFilters(row, { level: { min: 3 } }, columns)).toBe(
      true,
    );
    expect(rowMatchesColumnFilters(row, { level: { max: 4 } }, columns)).toBe(
      false,
    );
    expect(
      rowMatchesColumnFilters(
        { ...row, level: 'n/a' },
        { level: { min: 1 } },
        columns,
      ),
    ).toBe(false);
  });

  it('intersects multiselect filters with array cells', () => {
    expect(
      rowMatchesColumnFilters(row, { tags: ['artifact'] }, columns),
    ).toBe(true);
    expect(rowMatchesColumnFilters(row, { tags: ['cursed'] }, columns)).toBe(
      false,
    );
  });

  it('skips empty filter values and unknown columns', () => {
    expect(
      rowMatchesColumnFilters(row, { tags: [], unknown: 'x' }, columns),
    ).toBe(true);
  });
});

describe('resolveRowHref', () => {
  const opts = {
    locale: 'en',
    basePath: '/spells',
    getRowSlug: (row: Record<string, unknown>) => String(row.slug),
  };

  it('returns external for http links untouched', () => {
    expect(
      resolveRowHref({ link: 'https://example.com/spell' }, opts),
    ).toEqual({ href: 'https://example.com/spell', external: true });
  });

  it('prefixes locale on library links', () => {
    expect(resolveRowHref({ link: '/library/spells/bane' }, opts)).toEqual({
      href: '/en/library/spells/bane',
      external: false,
    });
  });

  it('prefixes locale and library on bare internal links', () => {
    expect(resolveRowHref({ link: '/spells/bane' }, opts)).toEqual({
      href: '/en/library/spells/bane',
      external: false,
    });
  });

  it('builds from basePath and slug, preserving hashes', () => {
    expect(resolveRowHref({ slug: 'bane#duration' }, opts)).toEqual({
      href: '/en/library/spells/bane#duration',
      external: false,
    });
  });
});

describe('filterOptionsFor', () => {
  const rows = [
    { rarity: 'Rare', tags: ['a', 'b'] },
    { rarity: 'Common', tags: ['b'] },
    { rarity: 'Rare' },
  ];

  it('derives unique sorted values, flattening arrays', () => {
    expect(filterOptionsFor(column({ key: 'rarity' }), rows)).toEqual([
      'Common',
      'Rare',
    ]);
    expect(filterOptionsFor(column({ key: 'tags' }), rows)).toEqual(['a', 'b']);
  });

  it('prefers column.getFilterOptions when defined', () => {
    const col = column({ getFilterOptions: () => ['x', 'y'] });
    expect(filterOptionsFor(col, rows)).toEqual(['x', 'y']);
  });

  it('orders by filterSortOrder when provided', () => {
    const col = column({
      key: 'rarity',
      filterSortOrder: { Rare: 0, Common: 1 },
    });
    expect(filterOptionsFor(col, rows)).toEqual(['Rare', 'Common']);
  });
});
