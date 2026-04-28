/**
 * @fileoverview OG image metadata resolver.
 *
 * Fetches a single metadata record via the active content repository for a
 * given content type and slug. Delegates to the same adapter (fs or pg) used
 * by all other content API routes — no direct filesystem access.
 *
 * Supported type strings:
 * - `monsters`, `heirlooms`, `spells`, `trinkets`
 * - `bloodlines`, `vocations`, `specializations`
 *
 * @module lib/seo/og/data
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
  bloodlineRepository,
  heirloomRepository,
  monsterRepository,
  specializationRepository,
  spellRepository,
  trinketRepository,
  vocationRepository,
} from '@/lib/db/content/repositories';
import { resolveStreamSegment } from '@/lib/machineText';

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
 * @property {string} [stream] - Canonical single stream segment (wrapped, not doubled)
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
  stream?: string;
}

/** Supported OG content type keys. */
const SUPPORTED_OG_TYPES = [
  'monsters',
  'heirlooms',
  'spells',
  'trinkets',
  'bloodlines',
  'vocations',
  'specializations',
] as const;

/**
 * Returns all supported OG content type keys.
 *
 * @returns {string[]} Array of supported type strings
 */
export function getSupportedOgTypes(): string[] {
  return [...SUPPORTED_OG_TYPES];
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
 * Formats a spell level number into a display string.
 *
 * @param {number | undefined} level - Numeric spell level (0 = cantrip)
 * @returns {string | undefined} Formatted level string or undefined
 */
function formatSpellLevel(level: number | undefined): string | undefined {
  if (level === undefined) return undefined;
  return level === 0 ? 'Cantrip' : `Level ${level}`;
}

/**
 * Fetches the OG card data for a single entity identified by type and slug.
 *
 * Delegates to the active repository adapter (fs or pg) — never reads
 * the filesystem directly. Returns `null` when the type is unsupported
 * or no record exists for the slug.
 *
 * @param {string} type - Content type key (e.g. `"monsters"`, `"heirlooms"`)
 * @param {string} slug - URL-safe entity identifier
 * @returns {Promise<OGCardData | null>} Resolved card data or null when not found
 */
export async function getOgCardData(
  type: string,
  slug: string,
): Promise<OGCardData | null> {
  switch (type) {
    case 'monsters': {
      const m = await monsterRepository.getBySlug('en', slug);
      if (!m) return null;
      return {
        slug,
        title: m.title,
        creatureType: m.creatureType,
        description: m.description,
        stream: await resolveStreamSegment('en', ['monsters', slug], ''),
      };
    }
    case 'heirlooms': {
      const h = await heirloomRepository.getBySlug('en', slug);
      if (!h) return null;
      return {
        slug,
        title: h.title,
        rarity: h.rarity,
        itemType: h.itemType,
        description: h.description,
        stream: await resolveStreamSegment(
          'en',
          ['items', 'heirlooms', slug],
          '',
        ),
      };
    }
    case 'spells': {
      const s = await spellRepository.getBySlug('en', slug);
      if (!s) return null;
      return {
        slug,
        title: s.title,
        school: s.school,
        level: formatSpellLevel(s.level),
        description: s.description,
        stream: await resolveStreamSegment('en', ['spells', slug], ''),
      };
    }
    case 'trinkets': {
      const t = await trinketRepository.getBySlug('en', slug);
      if (!t) return null;
      return {
        slug,
        title: t.title,
        itemType: t.itemType,
        description: t.description,
        stream: await resolveStreamSegment(
          'en',
          ['items', 'trinkets', slug],
          '',
        ),
      };
    }
    case 'bloodlines': {
      const b = await bloodlineRepository.getBySlug('en', slug);
      if (!b) return null;
      return {
        slug,
        title: b.title,
        subLabel: b.coreFeatures?.creatureTypes?.[0],
        description: b.description,
        stream: await resolveStreamSegment('en', ['bloodlines', slug], ''),
      };
    }
    case 'vocations': {
      const v = await vocationRepository.getBySlug('en', slug);
      if (!v) return null;
      return {
        slug,
        title: v.title,
        subLabel: v.archetype,
        description: v.description,
        stream: await resolveStreamSegment('en', ['vocations', slug], ''),
      };
    }
    case 'specializations': {
      const sp = await specializationRepository.getBySlug('en', slug);
      if (!sp) return null;
      return {
        slug,
        title: sp.title,
        subLabel: sp.specializationType,
        description: sp.description,
      };
    }
    default:
      return null;
  }
}
