import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { useActiveDraft } from '@/modules/mdx-editor/application/hooks/useActiveDraft';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('swr', () => ({
  default: vi.fn(),
}));

vi.mock(
  '@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient',
  () => ({
    fetchActiveDraft: vi.fn(),
  }),
);

import useSWR from 'swr';

describe('useActiveDraft', () => {
  it('returns default null draft while loading', () => {
    vi.mocked(useSWR).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    const { result } = renderHook(() => useActiveDraft('en', 'world/test'));

    expect(result.current).toEqual({ draft: null, loading: true });
  });

  it('returns fetched draft state', () => {
    const draft = { id: 1 } as DraftMetadata;
    vi.mocked(useSWR).mockReturnValue({
      data: draft,
      isLoading: false,
    } as never);

    const { result } = renderHook(() => useActiveDraft('en', 'world/test'));

    expect(result.current).toEqual({ draft, loading: false });
  });
});
