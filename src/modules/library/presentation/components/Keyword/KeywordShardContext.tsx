/**
 * @fileoverview Keyword Shard Context
 * @description Carries the shard source a page references down to its keyword
 * cards. Source rather than rendered HTML, so the card compiles it and the
 * project's own syntax stays live.
 *
 * @module modules/library/presentation/components/Keyword/KeywordShardContext
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { KeywordShard } from '@/lib/md/bakeKeywordShards';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** Shards keyed by id, empty outside a provider. */
const KeywordShardContext = createContext<Record<string, KeywordShard>>({});

/**
 * Props for {@link KeywordShardProvider}.
 *
 * @interface KeywordShardProviderProps
 * @property {KeywordShard[]} shards - Shards the document references
 * @property {ReactNode} children - Content that may contain keywords
 */
export interface KeywordShardProviderProps {
  shards: KeywordShard[];
  children: ReactNode;
}

/**
 * Publishes a page's shards to the keywords inside it.
 *
 * @param {KeywordShardProviderProps} props - Component props
 * @returns {React.ReactElement} The wrapped subtree
 */
export function KeywordShardProvider({
  shards,
  children,
}: KeywordShardProviderProps): React.ReactElement {
  const value = useMemo(
    () => Object.fromEntries(shards.map((shard) => [shard.id, shard])),
    [shards],
  );

  return (
    <KeywordShardContext.Provider value={value}>
      {children}
    </KeywordShardContext.Provider>
  );
}

/**
 * Reads one shard by id.
 *
 * @param {string} [id] - Shard id from the keyword's compile-time props
 * @returns {KeywordShard | null} The shard, or null when the page carries none
 */
export function useKeywordShard(id?: string): KeywordShard | null {
  const shards = useContext(KeywordShardContext);
  return id ? (shards[id] ?? null) : null;
}

export default KeywordShardProvider;
