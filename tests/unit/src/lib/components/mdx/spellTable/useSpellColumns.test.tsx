/**
 * @fileoverview Unit tests for useSpellColumns hook
 * @module tests/unit/src/lib/components/mdx/spellTable/useSpellColumns.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    createUseTranslationsMock,
    loadMessageFile,
} from '../../../testUtils/translationMockUtils';

vi.mock('next-intl', () => ({
  useTranslations: createUseTranslationsMock({
    tables: loadMessageFile('messages/en/tables.json'),
  }),
}));

import { useSpellColumns } from '@/modules/metadata-tables/presentation/useSpellColumns/useSpellColumns';

describe('useSpellColumns', () => {
  it('returns the five standard spell columns', () => {
    const { result } = renderHook(() => useSpellColumns());

    expect(result.current).toHaveLength(5);
    expect(result.current.map((column) => column.key)).toEqual([
      'title',
      'castingTime',
      'range',
      'duration',
      'components',
    ]);
  });

  it('formats casting time and ritual marker', () => {
    const { result } = renderHook(() => useSpellColumns());
    const castingTime = result.current.find(
      (column) => column.key === 'castingTime',
    );

    expect(castingTime).toBeDefined();
    expect(castingTime?.render?.(['bonus-action', 'ritual'] as never)).toBe(
      'Bonus Action (R)',
    );
  });

  it('builds duration and component values from row fields', () => {
    const { result } = renderHook(() => useSpellColumns());

    const duration = result.current.find((column) => column.key === 'duration');
    const components = result.current.find(
      (column) => column.key === 'components',
    );

    expect(
      duration?.getValue?.({
        duration: '1 minute',
        concentration: true,
      } as never),
    ).toBe('Concentration, 1 minute');

    expect(
      components?.getValue?.({
        components: { verbal: true, somatic: true, material: true },
      } as never),
    ).toBe('V, S, M');

    expect(
      components?.getValue?.({
        components: { verbal: false, somatic: false, material: false },
      } as never),
    ).toBe('—');
  });
});
