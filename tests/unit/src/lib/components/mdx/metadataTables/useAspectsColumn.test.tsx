/**
 * @fileoverview useAspectsColumn Tests
 * @description Appends the Aspects column only when rows carry tags and the
 * caller has not defined one.
 *
 * @module tests/unit/src/lib/components/mdx/metadataTables/useAspectsColumn
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { ColumnConfig } from '@/lib/components/mdx/metadataTables/metadataTable.types';
import { useAspectsColumn } from '@/lib/components/mdx/metadataTables/useAspectsColumn';
import { render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

const base: ColumnConfig[] = [{ key: 'title', label: 'Name' }];

describe('useAspectsColumn', () => {
  it('should leave columns alone when no row carries tags', () => {
    const { result } = renderHook(() =>
      useAspectsColumn(base, [{ slug: 'a', title: 'A' }], 'md'),
    );
    expect(result.current).toBe(base);
  });

  it('should append an Aspects column when rows carry tags', () => {
    const { result } = renderHook(() =>
      useAspectsColumn(base, [{ slug: 'a', tags: ['damage:fire'] }], 's'),
    );
    expect(result.current.map((c) => c.key)).toEqual(['title', 'tags']);
    const col = result.current[1];
    expect(col.getValue?.({ slug: 'a', tags: ['damage:fire', 'x:y'] })).toBe(
      'damage:fire x:y',
    );
    const { container } = render(
      <>{col.render?.(undefined, { slug: 'a', tags: ['damage:fire'] })}</>,
    );
    expect(container.querySelectorAll('span[title="damage: fire"]')).toHaveLength(1);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('should not duplicate a caller-defined tags column', () => {
    const own: ColumnConfig[] = [...base, { key: 'tags', label: 'Mine' }];
    const { result } = renderHook(() =>
      useAspectsColumn(own, [{ slug: 'a', tags: ['damage:fire'] }], 'md'),
    );
    expect(result.current).toBe(own);
  });
});
