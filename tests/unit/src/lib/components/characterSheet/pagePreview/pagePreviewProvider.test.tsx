/**
 * @fileoverview Page Preview Provider Tests
 * @description Unit tests for the open/close/isOpen API exposed by
 * `<PagePreviewProvider>`.
 *
 * @module tests/unit/src/lib/components/characterSheet/pagePreviewProvider.test
 */

import {
    PagePreviewProvider,
    usePagePreview,
} from '@/lib/components/characterSheet/pagePreview/pagePreviewProvider';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

/**
 * Wrap the hook in the provider for testing.
 *
 * @function wrapper
 * @param {{ children: ReactNode }} props - React children
 * @returns {JSX.Element} Provider wrapper
 */
const wrapper = ({ children }: { children: ReactNode }) => (
  <PagePreviewProvider>{children}</PagePreviewProvider>
);

describe('PagePreviewProvider', () => {
  it('opens, queries, and closes preview entries', () => {
    const { result } = renderHook(() => usePagePreview(), { wrapper });
    expect(result.current.previews).toHaveLength(0);
    expect(result.current.isOpen('bloodlines', 'bilupine')).toBe(false);

    act(() => {
      result.current.open({
        kind: 'bloodlines',
        slug: 'bilupine',
        title: 'Bilupine',
      });
    });
    expect(result.current.isOpen('bloodlines', 'bilupine')).toBe(true);
    expect(result.current.previews).toHaveLength(1);

    act(() => {
      result.current.open({
        kind: 'bloodlines',
        slug: 'bilupine',
        title: 'Bilupine',
      });
    });
    expect(result.current.previews).toHaveLength(1);

    act(() => {
      result.current.close('bloodlines', 'bilupine');
    });
    expect(result.current.isOpen('bloodlines', 'bilupine')).toBe(false);
  });

  it('falls back to no-op stub outside a provider', () => {
    const { result } = renderHook(() => usePagePreview());
    expect(result.current.previews).toEqual([]);
    expect(() =>
      result.current.open({ kind: 'feats', slug: 'tough', title: 'Tough' }),
    ).not.toThrow();
    expect(result.current.isOpen('feats', 'tough')).toBe(false);
  });
});
