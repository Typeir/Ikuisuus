/**
 * @fileoverview Unit tests for useSpellTableFilters hook
 * @module tests/unit/src/lib/hooks/data/useSpellTableFilters.test
 * @version 1.0.0
 * @author Typeir
 * @since 7.2.0
 */

import { useSpellTableFilters } from '@/modules/metadata-tables/application/hooks/useSpellTableFilters';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useSpellTableFilters', () => {
  it('starts with empty state and an empty expressions array', () => {
    const { result } = renderHook(() => useSpellTableFilters());

    expect(result.current.state).toEqual({
      damoclesOnly: false,
      concentrationFilter: '',
    });
    expect(result.current.expressions).toEqual([]);
  });

  it('emits a source neq basic expression when Damocles-only is enabled', () => {
    const { result } = renderHook(() => useSpellTableFilters());

    act(() => {
      result.current.setters.setDamoclesOnly(true);
    });

    expect(result.current.expressions).toEqual([
      { field: 'source', operator: 'neq', value: 'basic' },
    ]);
  });

  it('emits a concentration eq true expression when concentration is yes', () => {
    const { result } = renderHook(() => useSpellTableFilters());

    act(() => {
      result.current.setters.setConcentrationFilter('yes');
    });

    expect(result.current.expressions).toEqual([
      { field: 'concentration', operator: 'eq', value: true },
    ]);
  });

  it('emits a concentration eq false expression when concentration is no', () => {
    const { result } = renderHook(() => useSpellTableFilters());

    act(() => {
      result.current.setters.setConcentrationFilter('no');
    });

    expect(result.current.expressions).toEqual([
      { field: 'concentration', operator: 'eq', value: false },
    ]);
  });

  it('combines multiple filters into a single expressions array', () => {
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
