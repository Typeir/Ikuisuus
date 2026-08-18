/**
 * @fileoverview useAspectSuggestions Tests
 * @description Token detection under the caret, lazy vocabulary, and pick
 * resolution.
 *
 * @module tests/unit/src/modules/search/presentation/SearchBar/useAspectSuggestions
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  aspectTokenAt,
  useAspectSuggestions,
} from '@/modules/search/presentation/SearchBar/useAspectSuggestions';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient', () => ({
  fetchAspectVocabulary: vi.fn(async () => [
    { group: 'condition', values: ['frightened', 'terrified', 'prone'], scope: '*' },
    { group: 'form', values: ['blade', 'bone'], scope: ['spells'] },
  ]),
}));

describe('aspectTokenAt', () => {
  it('should find a group: token under the caret', () => {
    expect(aspectTokenAt('fire condition:fr', 17)).toEqual({ group: 'condition', prefix: 'fr', start: 5, end: 17 });
    expect(aspectTokenAt('condition:', 10)).toEqual({ group: 'condition', prefix: '', start: 0, end: 10 });
  });

  it('should ignore plain words and text after the caret token', () => {
    expect(aspectTokenAt('fire bolt', 9)).toBeNull();
    expect(aspectTokenAt('condition:fr more', 12)?.prefix).toBe('fr');
  });
});

describe('useAspectSuggestions', () => {
  it('should offer matching values once the vocabulary loads and resolve a pick', async () => {
    const { result } = renderHook(() => useAspectSuggestions('fire condition:t', 16));
    await waitFor(() => expect(result.current.suggestions).toEqual(['condition:terrified']));
    expect(result.current.pick(0)).toEqual({ aspect: 'condition:terrified', rest: 'fire' });
  });

  it('should offer nothing for an unknown group or plain text', async () => {
    const { result } = renderHook(() => useAspectSuggestions('nonsense:x', 10));
    await waitFor(() => expect(result.current.suggestions).toEqual([]));
    expect(result.current.pick(0)).toBeNull();
  });
});
