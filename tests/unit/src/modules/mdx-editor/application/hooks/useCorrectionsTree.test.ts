import { useCorrectionsTree } from '@/modules/mdx-editor/application/hooks/useCorrectionsTree';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('swr', () => ({
  default: vi.fn(),
}));

vi.mock(
  '@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient',
  () => ({
    fetchCorrectionsTree: vi.fn(),
  }),
);

import useSWR from 'swr';

describe('useCorrectionsTree', () => {
  it('returns fallback state while loading', () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    const { result } = renderHook(() => useCorrectionsTree('en'));

    expect(result.current).toEqual({ tree: [], loading: true });
  });

  it('returns loaded tree data', () => {
    const tree = [{ name: 'world', path: 'en/world' }];
    vi.mocked(useSWR).mockReturnValue({
      data: tree,
      isLoading: false,
    } as never);

    const { result } = renderHook(() => useCorrectionsTree('en'));

    expect(result.current).toEqual({ tree, loading: false });
  });
});
