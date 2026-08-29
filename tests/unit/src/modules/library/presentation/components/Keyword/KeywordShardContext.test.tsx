/**
 * @fileoverview KeywordShardContext Tests
 * @description Covers publishing a page's shards to the keywords inside it, and
 * the empty behaviour outside a provider.
 *
 * @module tests/unit/src/modules/library/presentation/components/Keyword/KeywordShardContext
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react renderHook
 * @requires @/modules/library/presentation/components/Keyword/KeywordShardContext Module under test
 */

import type { KeywordShard } from '@/lib/md/bakeKeywordShards';
import {
  KeywordShardProvider,
  useKeywordShard,
} from '@/modules/library/presentation/components/Keyword/KeywordShardContext';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

const SHARDS: KeywordShard[] = [
  { id: 'kw-condition-prone', heading: 'Prone', source: 'Prone prose.' },
  { id: 'kw--accuracy', heading: 'Accuracy', source: 'Accuracy prose.' },
];

/**
 * Wraps children in a provider carrying the fixture shards.
 *
 * @param {{ children: ReactNode }} props - Wrapper props
 * @returns {React.ReactElement} The wrapped subtree
 */
function wrapper({ children }: { children: ReactNode }) {
  return (
    <KeywordShardProvider shards={SHARDS}>{children}</KeywordShardProvider>
  );
}

describe('useKeywordShard', () => {
  it('returns the shard matching an id', () => {
    const { result } = renderHook(() => useKeywordShard('kw-condition-prone'), {
      wrapper,
    });

    expect(result.current).toEqual(SHARDS[0]);
  });

  it('returns null for an id the page does not carry', () => {
    const { result } = renderHook(() => useKeywordShard('kw--missing'), {
      wrapper,
    });

    expect(result.current).toBeNull();
  });

  it('returns null without an id', () => {
    const { result } = renderHook(() => useKeywordShard(undefined), {
      wrapper,
    });

    expect(result.current).toBeNull();
  });

  it('returns null outside a provider', () => {
    const { result } = renderHook(() => useKeywordShard('kw-condition-prone'));

    expect(result.current).toBeNull();
  });

  it('carries every shard the page references', () => {
    const { result } = renderHook(() => useKeywordShard('kw--accuracy'), {
      wrapper,
    });

    expect(result.current?.heading).toBe('Accuracy');
    expect(result.current?.source).toBe('Accuracy prose.');
  });
});
