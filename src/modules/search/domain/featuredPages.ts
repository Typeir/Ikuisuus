/**
 * @fileoverview Featured Pages for "The Archivist is reading…"
 * @description Hardcoded list of impressive wiki pages to showcase on the
 * home page. One entry picked at a time. Will be replaced with pseudo-random
 * selection once the wiki is more complete.
 *
 * @module modules/search/domain/featuredPages
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { SearchContentType } from './contentTypes';

/**
 * @interface FeaturedPage
 * @property {string} title - Display title
 * @property {string} path - Relative library path (e.g. "world/the-lands-of-damocles/binturia")
 * @property {SearchContentType} kind - Content type for sigil colour
 */
export interface FeaturedPage {
  title: string;
  path: string;
  kind: SearchContentType;
}

/** Authored list of displayable pages. */
export const FEATURED_PAGES: FeaturedPage[] = [
  {
    title: 'Alfanjon of the Crescent Moon',
    path: 'items/heirlooms/alfanjon-of-the-crescent-moon',
    kind: 'heirlooms',
  },
  {
    title: 'Abominable Avian',
    path: 'monsters/abominable-avian',
    kind: 'monsters',
  },
  {
    title: "Bag o' Limbs",
    path: 'items/heirlooms/bag-o-limbs',
    kind: 'heirlooms',
  },
  {
    title: 'Dreaded Defender',
    path: 'items/heirlooms/dreaded-defender',
    kind: 'heirlooms',
  },
  {
    title: 'Heart of the Brume',
    path: 'monsters/heart-of-the-brume',
    kind: 'monsters',
  },
];

/**
 * Seeded pseudo-random pick from the featured pages list.
 * Seed derived from unix hour (ms / 3600000 floored). Changes hourly.
 *
 * @returns {FeaturedPage} The selected page
 */
export function pickFeaturedPage(): FeaturedPage {
  const hour = Math.floor(Date.now() / 3600000);
  const idx = (hour * 2654435761) >>> 0;
  return FEATURED_PAGES[idx % FEATURED_PAGES.length];
}
