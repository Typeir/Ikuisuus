/**
 * @fileoverview MetadataTable types smoke test
 * @description The module is type-only; this verifies the exported types are
 * importable and that conforming objects satisfy their shapes.
 *
 * @module tests/unit/src/lib/components/mdx/metadataTables/metadataTable.types.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type {
  ColumnConfig,
  MetadataRow,
  MetadataTableProps,
  SortDirection,
} from '@/lib/components/mdx/metadataTables/metadataTable.types';
import { describe, expect, it } from 'vitest';

describe('metadataTable.types', () => {
  it('accepts conforming column, row, sort, and props shapes', () => {
    const column: ColumnConfig = { key: 'title', label: 'Title', sortable: true };
    const row: MetadataRow = { title: 'x', slug: 'x' };
    const direction: SortDirection = 'asc';
    const props: Partial<MetadataTableProps> = {
      data: [row],
      columns: [column],
      defaultSort: { key: 'title', direction },
      size: 's',
    };
    expect(column.key).toBe('title');
    expect(row.slug).toBe('x');
    expect(props.columns?.[0]?.label).toBe('Title');
    expect(props.size).toBe('s');
  });
});
