import { useSpellTableFilters } from '@/modules/metadata-tables/application/hooks/useSpellTableFilters';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useSpellTableFilters', () => {
  it('starts with empty expression set', () => {
    const { result } = renderHook(() => useSpellTableFilters());

    expect(result.current.state).toEqual({
      damoclesOnly: false,
      concentrationFilter: '',
    });
    expect(result.current.expressions).toEqual([]);
  });

  it('builds expressions from selected filters', () => {
    const { result } = renderHook(() => useSpellTableFilters());

    act(() => {
      result.current.setters.setDamoclesOnly(true);
      result.current.setters.setConcentrationFilter('yes');
    });

    expect(result.current.expressions).toEqual([
      { field: 'source', operator: 'neq', value: 'basic' },
      { field: 'concentration', operator: 'eq', value: true },
    ]);
  });
});
