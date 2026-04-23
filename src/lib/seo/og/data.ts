/**
 * @fileoverview OG image metadata resolver.
 *
 * Fetches a single metadata record from the filesystem for a given content
 * type and slug. Used by the OG image API route to gather the title, rarity,
 * type, and image path needed to render the card.
 *
 * Only the filesystem backend is supported here — OG images are always
 * resolved at request time against local `.metadata.json` sidecar files.
 *
 * Supported type strings and their subdirectory mappings:
 * - `monsters`         → `monsters/`
 * - `heirlooms`        → `items/heirlooms/`
 * - `spells`           → `spells/`
 * - `trinkets`         → `items/trinkets/`
 * - `bloodlines`       → `bloodlines/`
 * - `vocations`        → `vocations/`
 * - `specializations`  → `specializations/`
 *
 * @module lib/seo/og/data
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { readMetadataFiles } from '@/lib/db/content/adapters/fs/readMetadataFiles';

/**
 * Minimal metadata shape required for OG card rendering.
 *
 * @interface OGCardData
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} [rarity] - Rarity tier (heirlooms / trinkets)
 * @property {string} [itemType] - Item category (heirlooms)
 * @property {string} [creatureType] - Creature type (monsters)
 * @property {string} [school] - Spell school (spells)
 * @property {string} [level] - Spell level as formatted string (spells)
 * @property {string} [subLabel] - Generic secondary label for other types
 * @property {string} [description] - Short flavour / lore text for the card watermark
 */
export interface OGCardData {
  slug: string;
  title: string;
  rarity?: string;
  itemType?: string;
  creatureType?: string;
  school?: string;
  level?: string;
  subLabel?: string;
  description?: string;
}

/** Maps URL-facing type slugs to their content subdirectory paths. */
const TYPE_SUBDIR_MAP: Record<string, string> = {
  monsters: 'monsters',
  heirlooms: 'items/heirlooms',
  spells: 'spells',
  trinkets: 'items/trinkets',
  bloodlines: 'bloodlines',
  vocations: 'vocations',
  specializations: 'specializations',
};

/**
 * Returns all supported OG content type keys.
 *
 * @returns {string[]} Array of supported type strings
 */
export function getSupportedOgTypes(): string[] {
  return Object.keys(TYPE_SUBDIR_MAP);
}

/**
 * Resolves and returns the root-relative public image path for a content
 * entity, following the same convention used by `resolvePageImage`.
 *
 * Pattern: `/library/images/{type}/{slug}.webp` — falls back gracefully
 * to an empty string if no known subfolder exists for the type.
 *
 * @param {string} type - Content type key (e.g. `"monsters"`)
 * @param {string} slug - Entity slug (e.g. `"abominable-avian"`)
 * @returns {string} Root-relative image path or empty string
 */
export function resolveOgImagePath(type: string, slug: string): string {
  const imageDir =
    type === 'heirlooms' || type === 'trinkets'
      ? type
      : type === 'monsters'
        ? 'monsters'
        : '';
  if (!imageDir) return '';
  return `/library/images/${imageDir}/${slug}.webp`;
}

/**
 * Resolves the root-relative path for a background sidecar image.
 *
 * Background images follow the naming convention `{slug}-background.webp`
 * and exist alongside the primary entity image in the same directory. Not
 * every entity has a background image — callers must check file existence
 * before using this path.
 *
 * @param {string} type - Content type key (e.g. `"heirlooms"`)
 * @param {string} slug - Entity slug (e.g. `"dreaded-defender"`)
 * @returns {string} Root-relative background image path or empty string
 */
export function resolveOgBackgroundImagePath(
  type: string,
  slug: string,
): string {
  const imageDir =
    type === 'heirlooms' || type === 'trinkets'
      ? type
      : type === 'monsters'
        ? 'monsters'
        : '';
  if (!imageDir) return '';
  return `/library/images/${imageDir}/${slug}-background.webp`;
}

/**
 * Fetches the OG card data for a single entity identified by type and slug.
 *
 * Returns `null` when:
 * - The type is not in the supported map
 * - No metadata file for the slug exists
 *
 * @param {string} type - Content type key (e.g. `"monsters"`, `"heirlooms"`)
 * @param {string} slug - URL-safe entity identifier
 * @returns {OGCardData | null} Resolved card data or null when not found
 */
export function getOgCardData(type: string, slug: string): OGCardData | null {
  const subdir = TYPE_SUBDIR_MAP[type];
  if (!subdir) return null;

  const records = readMetadataFiles<Record<string, unknown>>('en', subdir);
  const record = records.find(
    (r) => r['slug'] === slug || r['subSlug'] === slug,
  );
  if (!record) return null;

  const title = typeof record['title'] === 'string' ? record['title'] : slug;
  const rarity =
    typeof record['rarity'] === 'string' ? record['rarity'] : undefined;
  const itemType =
    typeof record['itemType'] === 'string' ? record['itemType'] : undefined;
  const creatureType =
    typeof record['creatureType'] === 'string'
      ? record['creatureType']
      : undefined;
  const school =
    typeof record['school'] === 'string' ? record['school'] : undefined;
  const levelRaw = record['level'];
  const level =
    typeof levelRaw === 'number'
      ? levelRaw === 0
        ? 'Cantrip'
        : `Level ${levelRaw}`
      : undefined;
  const description =
    typeof record['description'] === 'string'
      ? record['description']
      : undefined;

  return {
    slug,
    title,
    rarity,
    itemType,
    creatureType,
    school,
    level,
    description,
  };
}
