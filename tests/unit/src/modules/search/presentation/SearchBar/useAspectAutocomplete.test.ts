/**
 * @fileoverview useAspectAutocomplete Tests
 * @description Caret tracking, keyboard navigation and pick hand-off shared by
 * every search input.
 *
 * @module tests/unit/src/modules/search/presentation/SearchBar/useAspectAutocomplete.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useAspectAutocomplete } from '@/modules/search/presentation/SearchBar/useAspectAutocomplete';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient',
  () => ({
    fetchAspectVocabulary: vi.fn(async () => [
      {
        group: 'condition',
        values: ['bleeding', 'blinded', 'burning'],
        scope: '*',
      },
    ]),
  }),
);

/**
 * A keyboard event stub carrying only what the hook reads.
 *
 * @param {string} key - Key name
 * @returns {{ key: string; preventDefault: () => void }} The stub
 */
function keyEvent(key: string) {
  return { key, preventDefault: vi.fn() };
}

/**
 * A caret-bearing input event stub.
 *
 * @param {string} value - Input value
 * @param {number} caret - Caret position
 * @returns {object} The stub
 */
function inputEvent(value: string, caret: number) {
  return {
    target: { value, selectionStart: caret },
    currentTarget: { value, selectionStart: caret },
  };
}

describe('useAspectAutocomplete', () => {
  it('should offer nothing and consume nothing before a token is typed', () => {
    const onPick = vi.fn();
    const { result } = renderHook(() => useAspectAutocomplete('fire', onPick));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.suggesting).toBe(false);
    expect(result.current.handleKeyDown(keyEvent('Enter') as never)).toBe(false);
  });

  it('should suggest the vocabulary values once the caret sits in a token', async () => {
    const onPick = vi.fn();
    const { result, rerender } = renderHook(
      ({ query }: { query: string }) => useAspectAutocomplete(query, onPick),
      { initialProps: { query: 'fire condition:b' } },
    );

    act(() => result.current.handleChange(inputEvent('fire condition:b', 16) as never));
    rerender({ query: 'fire condition:b' });

    await waitFor(() =>
      expect(result.current.suggestions).toEqual([
        'condition:bleeding',
        'condition:blinded',
        'condition:burning',
      ]),
    );
    expect(result.current.suggesting).toBe(true);
  });

  it('should cycle the highlight and hand the picked aspect back with the rest of the query', async () => {
    const onPick = vi.fn();
    const { result } = renderHook(() =>
      useAspectAutocomplete('fire condition:b', onPick),
    );

    act(() => result.current.trackCaret(inputEvent('fire condition:b', 16) as never));
    await waitFor(() => expect(result.current.suggestions).toHaveLength(3));

    act(() => {
      result.current.handleKeyDown(keyEvent('ArrowDown') as never);
    });
    expect(result.current.activeIndex).toBe(0);

    act(() => {
      result.current.handleKeyDown(keyEvent('ArrowUp') as never);
    });
    expect(result.current.activeIndex).toBe(2);

    act(() => {
      result.current.handleKeyDown(keyEvent('Enter') as never);
    });
    expect(onPick).toHaveBeenCalledWith({
      aspect: 'condition:burning',
      rest: 'fire',
    });
  });

  it('should pick the first suggestion on Enter without a highlight', async () => {
    const onPick = vi.fn();
    const { result } = renderHook(() =>
      useAspectAutocomplete('condition:b', onPick),
    );

    act(() => result.current.trackCaret(inputEvent('condition:b', 11) as never));
    await waitFor(() => expect(result.current.suggesting).toBe(true));

    act(() => {
      expect(result.current.handleKeyDown(keyEvent('Enter') as never)).toBe(true);
    });
    expect(onPick).toHaveBeenCalledWith({
      aspect: 'condition:bleeding',
      rest: '',
    });
  });

  it('should leave Tab and Escape to the host input', async () => {
    const onPick = vi.fn();
    const { result } = renderHook(() =>
      useAspectAutocomplete('condition:b', onPick),
    );

    act(() => result.current.trackCaret(inputEvent('condition:b', 11) as never));
    await waitFor(() => expect(result.current.suggesting).toBe(true));

    act(() => {
      expect(result.current.handleKeyDown(keyEvent('Tab') as never)).toBe(false);
      expect(result.current.handleKeyDown(keyEvent('Escape') as never)).toBe(
        false,
      );
    });
    expect(onPick).not.toHaveBeenCalled();

    act(() => {
      result.current.handleKeyDown(keyEvent('ArrowDown') as never);
    });
    act(() => {
      expect(result.current.handleKeyDown(keyEvent('Tab') as never)).toBe(true);
    });
    expect(onPick).toHaveBeenCalledWith({
      aspect: 'condition:bleeding',
      rest: '',
    });
  });
});
