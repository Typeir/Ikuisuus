/**
 * @fileoverview Custom hook for fetching and managing stub sidebar children
 * @module lib/components/sidebar/useFetchStubChildren
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import { useEffect, useState } from 'react';
import { calculateHeights } from './calculateHeights';
import { BASE_HEIGHT } from './constants';
import type { Item } from './types';

/**
 * Return type for useFetchStubChildren hook
 *
 * @interface UseFetchStubChildrenReturn
 * @property {Item[] | null} stubChildren - Fetched children (null = not fetched, [] = empty)
 * @property {boolean} isFetchingChildren - Whether fetch is in progress
 * @property {number | null} localExpandedHeight - Real height after fetch completes
 */
interface UseFetchStubChildrenReturn {
  stubChildren: Item[] | null;
  isFetchingChildren: boolean;
  localExpandedHeight: number | null;
}

/**
 * Custom hook that manages lazy fetching of stub folder children
 * Fetches from /api/content/walk when stub folder is first opened
 *
 * @param {boolean} shouldFetch - Whether to trigger fetch (typically when open=true)
 * @param {boolean} isStub - Whether this is a stub node
 * @param {string} itemPath - Path of the item to fetch children for
 * @param {string} locale - Locale code for API call
 * @returns {UseFetchStubChildrenReturn} Fetch state and results
 */
export function useFetchStubChildren(
  shouldFetch: boolean,
  isStub: boolean,
  itemPath: string,
  locale: string,
): UseFetchStubChildrenReturn {
  const [stubChildren, setStubChildren] = useState<Item[] | null>(null);
  const [isFetchingChildren, setIsFetchingChildren] = useState(false);
  const [localExpandedHeight, setLocalExpandedHeight] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (
      !shouldFetch ||
      !isStub ||
      stubChildren !== null ||
      isFetchingChildren
    ) {
      return;
    }

    setIsFetchingChildren(true);
    fetch(
      `/api/content/walk?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(itemPath)}`,
    )
      .then((r) => r.json())
      .then((nodes: Item[]) => {
        const layoutNodes = calculateHeights(nodes);
        const real =
          BASE_HEIGHT + layoutNodes.reduce((s, n) => s + n.expandedHeight, 0);
        setLocalExpandedHeight(real);
        setStubChildren(nodes);
      })
      .catch(() => setStubChildren([]))
      .finally(() => setIsFetchingChildren(false));
  }, [shouldFetch, isStub, itemPath, locale, stubChildren, isFetchingChildren]);

  return {
    stubChildren,
    isFetchingChildren,
    localExpandedHeight,
  };
}
