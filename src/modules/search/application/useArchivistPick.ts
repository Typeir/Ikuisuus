/**
 * @fileoverview Archivist Pick Hook
 * @description Returns the currently featured page for "The Archivist is
 * reading…".
 *
 * @module modules/search/application/useArchivistPick
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect, useState } from 'react';
import { pickFeaturedPage, type FeaturedPage } from '../domain/featuredPages';

/**
 * Returns the currently displayed featured page.
 *
 * @returns {FeaturedPage | null} The selected page, or null before mount
 */
export function useArchivistPick(): FeaturedPage | null {
  const [pick, setPick] = useState<FeaturedPage | null>(null);

  useEffect(() => {
    setPick(pickFeaturedPage());
  }, []);

  return pick;
}
