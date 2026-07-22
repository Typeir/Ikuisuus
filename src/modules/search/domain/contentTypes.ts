/**
 * @fileoverview Search content-type taxonomy
 * @module modules/search/domain/contentTypes
 * @description Canonical union of searchable content types and a display-metadata
 * registry (label, icon name, color token key, URL segment). Kept free of React,
 * Lucide, and SCSS coupling: `icon` is a Lucide icon name string and
 * `colorTokenKey` is a CSS custom-property name string. The presentation layer
 * maps these to real icon components and CSS variables.
 *
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

/**
 * Union of all searchable content types (9 groups).
 *
 * @typedef {(
 *   | 'monsters' | 'heirlooms' | 'spells' | 'trinkets' | 'bloodlines'
 *   | 'vocations' | 'specializations' | 'feats' | 'world'
 * )} SearchContentType
 */
export type SearchContentType =
  | 'monsters'
  | 'heirlooms'
  | 'spells'
  | 'trinkets'
  | 'bloodlines'
  | 'vocations'
  | 'specializations'
  | 'feats'
  | 'world';

/**
 * Display metadata for a content type.
 *
 * @interface ContentTypeMeta
 * @property {string} label - Human-readable singular/collection label
 * @property {string} icon - Lucide icon name (resolved to a component in presentation)
 * @property {string} colorTokenKey - CSS custom-property name for the type accent
 *   (e.g. `--search-type-monster`), defined in `globals.scss`
 * @property {string} urlSegment - Library URL segment for links
 *   (e.g. `monsters` → `/{locale}/library/monsters/{slug}`)
 */
export interface ContentTypeMeta {
  label: string;
  icon: string;
  colorTokenKey: string;
  urlSegment: string;
}

/**
 * Registry mapping every {@link SearchContentType} to its display metadata.
 * Exhaustive by construction; enforced by an exhaustiveness unit test.
 *
 * @type {Record<SearchContentType, ContentTypeMeta>}
 */
export const CONTENT_TYPE_META: Record<SearchContentType, ContentTypeMeta> = {
  monsters: {
    label: 'Monsters',
    icon: 'Skull',
    colorTokenKey: '--search-type-monster',
    urlSegment: 'monsters',
  },
  heirlooms: {
    label: 'Heirlooms',
    icon: 'Gem',
    colorTokenKey: '--search-type-heirloom',
    urlSegment: 'items/heirlooms',
  },
  spells: {
    label: 'Spells',
    icon: 'Sparkles',
    colorTokenKey: '--search-type-spell',
    urlSegment: 'spells',
  },
  trinkets: {
    label: 'Trinkets',
    icon: 'FlaskConical',
    colorTokenKey: '--search-type-trinket',
    urlSegment: 'items/trinkets',
  },
  bloodlines: {
    label: 'Bloodlines',
    icon: 'Droplet',
    colorTokenKey: '--search-type-bloodline',
    urlSegment: 'character-creation/bloodlines',
  },
  vocations: {
    label: 'Vocations',
    icon: 'Swords',
    colorTokenKey: '--search-type-vocation',
    urlSegment: 'character-creation/vocations',
  },
  specializations: {
    label: 'Specializations',
    icon: 'Star',
    colorTokenKey: '--search-type-specialization',
    urlSegment: 'character-creation/vocations',
  },
  feats: {
    label: 'Feats',
    icon: 'Medal',
    colorTokenKey: '--search-type-feat',
    urlSegment: 'character-creation/feats',
  },
  world: {
    label: 'World & Lore',
    icon: 'ScrollText',
    colorTokenKey: '--search-type-world',
    urlSegment: 'world',
  },
};

/**
 * Content type → content subdirectory (derived from canonical metadata).
 *
 * @type {Record<SearchContentType, string>}
 */
export const CONTENT_SUBDIR: Record<SearchContentType, string> =
  Object.fromEntries(
    Object.entries(CONTENT_TYPE_META).map(([k, v]) => [k, v.urlSegment]),
  ) as Record<SearchContentType, string>;

/**
 * All content types as an array, useful for iteration and facet construction.
 *
 * @type {SearchContentType[]}
 */
export const SEARCH_CONTENT_TYPES = Object.keys(
  CONTENT_TYPE_META,
) as SearchContentType[];
