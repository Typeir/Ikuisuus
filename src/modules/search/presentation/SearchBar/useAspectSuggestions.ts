/**
 * @fileoverview Aspect autocomplete state for the search bar.
 * @description Watches the token under the caret; once it reads
 * `group:` (a group from the vocabulary, optionally with a value prefix),
 * the vocabulary is fetched lazily and the matching `group:value` tokens are
 * offered. Selecting one strips the token from the query and yields the
 * aspect and the remaining text, so the caller can navigate to the search
 * page with it as a filter.
 *
 * @module modules/search/presentation/SearchBar/useAspectSuggestions
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { AspectVocabularyGroup } from '@/lib/metadata/aspectVocabulary';
import { fetchAspectVocabulary } from '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient';
import { useEffect, useMemo, useState } from 'react';

/** Longest suggestion list offered at once. */
export const MAX_ASPECT_SUGGESTIONS = 12;

/** The token under the caret when it is a `group:` or `group:val` prefix. */
const TOKEN = /(^|\s)([a-z][a-z0-9-]*(?::[a-z0-9-]+)*):([a-z0-9-]*)$/i;

/**
 * Result of `useAspectSuggestions`.
 *
 * @property {string[]} suggestions - Matching `group:value` tokens
 * @property {(index: number) => { aspect: string; rest: string } | null} pick - Resolves a suggestion into the aspect and the query without its token
 */
export interface AspectSuggestionsResult {
  suggestions: string[];
  pick: (index: number) => { aspect: string; rest: string } | null;
}

/**
 * Splits `query` (up to `caret`) into the aspect token being typed and the
 * text before it.
 *
 * @param {string} query - Full input text
 * @param {number} caret - Caret position
 * @returns {{ group: string; prefix: string; start: number; end: number } | null} Token parts, or null
 */
export function aspectTokenAt(
  query: string,
  caret: number,
): { group: string; prefix: string; start: number; end: number } | null {
  const head = query.slice(0, caret);
  const m = TOKEN.exec(head);
  if (!m) return null;
  const start = head.length - m[2].length - 1 - m[3].length;
  const tail = query.slice(caret);
  const tailEnd = /^[a-z0-9-]*/i.exec(tail)?.[0].length ?? 0;
  return {
    group: m[2].toLowerCase(),
    prefix: (m[3] + tail.slice(0, tailEnd)).toLowerCase(),
    start,
    end: caret + tailEnd,
  };
}

/**
 * Aspect suggestions for the token under the caret.
 *
 * @param {string} query - Full input text
 * @param {number} caret - Caret position
 * @returns {AspectSuggestionsResult} Suggestions and the pick resolver
 */
export function useAspectSuggestions(
  query: string,
  caret: number,
): AspectSuggestionsResult {
  const [vocab, setVocab] = useState<AspectVocabularyGroup[] | null>(null);
  const token = useMemo(() => aspectTokenAt(query, caret), [query, caret]);

  useEffect(() => {
    if (!token || vocab !== null) return;
    let live = true;
    void fetchAspectVocabulary().then((groups) => {
      if (live) setVocab(groups ?? []);
    });
    return () => {
      live = false;
    };
  }, [token, vocab]);

  const suggestions = useMemo(() => {
    if (!token || !vocab) return [];
    const group = vocab.find((g) => g.group === token.group);
    if (!group) return [];
    return group.values
      .filter((v) => v.startsWith(token.prefix))
      .slice(0, MAX_ASPECT_SUGGESTIONS)
      .map((v) => `${token.group}:${v}`);
  }, [token, vocab]);

  const pick = (index: number) => {
    const aspect = suggestions[index];
    if (!aspect || !token) return null;
    const rest = `${query.slice(0, token.start)} ${query.slice(token.end)}`
      .replace(/\s+/g, ' ')
      .trim();
    return { aspect, rest };
  };

  return { suggestions, pick };
}
