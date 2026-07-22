/**
 * @fileoverview Archivist Pick Hook
 * @description Returns the currently featured page for "The Archivist is
 * reading…" Hardcoded index for now; will be pseudo-random later.
 *
 * @module modules/search/application/useArchivistPick
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useMemo } from 'react';
import { pickFeaturedPage, type FeaturedPage } from '../domain/featuredPages';

/**
 * Returns the currently displayed featured page.
 * Pick changes every hour based on unix hour seed.
 *
 * @returns {FeaturedPage} The selected page
 */
export function useArchivistPick(): FeaturedPage {
  return useMemo(() => pickFeaturedPage(), []);
}
