/**
 * @fileoverview Machine text stream resolver for MDX section decorations.
 * @description Composes a deterministic stream string from real content metadata
 * fields via the repository adapter layer. The composed string is doubled so
 * that a CSS `translateY(0 → -50%)` animation creates a seamless infinite scroll
 * without repeating gaps. Falls back to an FNV-1a32 hash of the raw content
 * when no typed metadata record is available for the current slug path.
 *
 * @module lib/machineText
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { heirloomRepository } from '@/lib/db/content/repositories/heirloomRepository';
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { trinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { fnv1a32 } from '@/lib/metadata';

/** @property {string} STREAM_SEPARATOR - Visual separator used between stream entries. */
const STREAM_SEPARATOR = ' // ';

/**
 * Surrounds a stream body with the standard separator prefix and suffix.
 *
 * @param {string} body - Inner content of the stream string
 * @returns {string} Formatted stream segment
 */
function wrapSegment(body: string): string {
  return `${STREAM_SEPARATOR}${body}${STREAM_SEPARATOR}`;
}

/**
 * Doubles a stream string so the CSS infinite-scroll animation loops seamlessly.
 * The animation moves from `translateY(0)` to `translateY(-50%)`, landing at
 * the same visual position because the second half is identical to the first.
 *
 * @param {string} segment - Single-pass stream string
 * @returns {string} Doubled string for seamless looping
 */
function doubleStream(segment: string): string {
  const normalized = segment.replace(/\s+/g, ' ').trim();
  return `${normalized} ${normalized}`;
}

/**
 * Composes a stream string from a monster metadata record.
 *
 * @param {import('@/lib/db/content/schemas/monsterMetadata').MonsterMetadata} record - Monster metadata
 * @returns {string} Doubled stream string
 */
function fromMonster(
  record: import('@/lib/db/content/schemas/monsterMetadata').MonsterMetadata,
): string {
  const parts: string[] = [record.subSlug ?? record.slug];
  if (record.cr) parts.push(`CR:${record.cr}`);
  if (record.size) parts.push(record.size.toUpperCase());
  if (record.creatureType) parts.push(record.creatureType.toUpperCase());
  if (record.hp?.average) parts.push(`HP:${record.hp.average}`);
  return doubleStream(wrapSegment(parts.join(' · ')));
}

/**
 * Composes a stream string from a spell metadata record.
 *
 * @param {import('@/lib/db/content/schemas/spellMetadata').SpellMetadata} record - Spell metadata
 * @returns {string} Doubled stream string
 */
function fromSpell(
  record: import('@/lib/db/content/schemas/spellMetadata').SpellMetadata,
): string {
  const parts: string[] = [record.slug];
  if (record.level !== undefined) parts.push(`LV:${record.level}`);
  if (record.school) parts.push(record.school.toUpperCase());
  if (record.castingTimeRaw) parts.push(record.castingTimeRaw);
  return doubleStream(wrapSegment(parts.join(' · ')));
}

/**
 * Composes a stream string from a heirloom metadata record.
 *
 * @param {import('@/lib/db/content/schemas/heirloomMetadata').HeirloomMetadata} record - Heirloom metadata
 * @returns {string} Doubled stream string
 */
function fromHeirloom(
  record: import('@/lib/db/content/schemas/heirloomMetadata').HeirloomMetadata,
): string {
  const parts: string[] = [record.slug];
  if (record.rarity) parts.push(record.rarity.toUpperCase());
  if (record.itemType) parts.push(record.itemType.toUpperCase());
  if (record.weaponType) parts.push(record.weaponType);
  return doubleStream(wrapSegment(parts.join(' · ')));
}

/**
 * Composes a stream string from a trinket metadata record.
 *
 * @param {import('@/lib/db/content/schemas/trinketMetadata').TrinketMetadata} record - Trinket metadata
 * @returns {string} Doubled stream string
 */
function fromTrinket(
  record: import('@/lib/db/content/schemas/trinketMetadata').TrinketMetadata,
): string {
  const parts: string[] = [record.slug];
  parts.push(record.itemType.toUpperCase());
  if (record.damage && record.damageType) {
    parts.push(`${record.damage} ${record.damageType}`);
  }
  return doubleStream(wrapSegment(parts.join(' · ')));
}

/**
 * Composes a stream string from a bloodline metadata record.
 *
 * @param {import('@/lib/db/content/schemas/bloodlineMetadata').BloodlineMetadata} record - Bloodline metadata
 * @returns {string} Doubled stream string
 */
function fromBloodline(
  record: import('@/lib/db/content/schemas/bloodlineMetadata').BloodlineMetadata,
): string {
  const parts: string[] = [record.slug];
  if (record.coreFeatures.creatureTypes.length > 0) {
    parts.push(record.coreFeatures.creatureTypes.join('/').toUpperCase());
  }
  if (record.boonBudget !== undefined) parts.push(`BP:${record.boonBudget}`);
  return doubleStream(wrapSegment(parts.join(' · ')));
}

/**
 * Composes a stream string from a vocation metadata record.
 *
 * @param {import('@/lib/db/content/schemas/vocationMetadata').VocationMetadata} record - Vocation metadata
 * @returns {string} Doubled stream string
 */
function fromVocation(
  record: import('@/lib/db/content/schemas/vocationMetadata').VocationMetadata,
): string {
  const parts: string[] = [record.slug, 'VOCATION'];
  if (record.hitDie) parts.push(`HD:${record.hitDie}`);
  return doubleStream(wrapSegment(parts.join(' · ')));
}

/**
 * Produces a fallback stream string from the raw file content hash.
 *
 * @param {string} rawContent - Raw MDX source content
 * @returns {string} Doubled stream string derived from FNV-1a32 hash
 */
function fromFallback(rawContent: string): string {
  const hash = fnv1a32(rawContent);
  return doubleStream(wrapSegment(`SIG:${hash}`));
}

/**
 * Resolves a deterministic machine-text stream string for a given page.
 *
 * Dispatches to the correct repository based on the leading slug segment.
 * Falls back to an FNV-1a32 hash of the raw content for pages without
 * structured metadata (e.g., world lore, rules pages).
 *
 * @param {string} locale - Content locale (e.g. "en", "es")
 * @param {string[]} slugSegments - Decoded slug path segments (e.g. ["monsters", "albedo"])
 * @param {string} rawContent - Raw MDX source used as fallback seed
 * @returns {Promise<string>} Doubled stream string for CSS `content: attr(data-stream)`
 */
export async function resolveStreamText(
  locale: string,
  slugSegments: string[],
  rawContent: string,
): Promise<string> {
  const leafSlug = slugSegments[slugSegments.length - 1];
  const prefix = slugSegments[0];
  const subPrefix = slugSegments[1];

  try {
    if (prefix === 'monsters') {
      const record = await monsterRepository.getBySlug(locale, leafSlug);
      if (record) return fromMonster(record);
    }

    if (prefix === 'spells') {
      const record = await spellRepository.getBySlug(locale, leafSlug);
      if (record) return fromSpell(record);
    }

    if (prefix === 'items' && subPrefix === 'heirlooms') {
      const record = await heirloomRepository.getBySlug(locale, leafSlug);
      if (record) return fromHeirloom(record);
    }

    if (prefix === 'items' && subPrefix === 'trinkets') {
      const record = await trinketRepository.getBySlug(locale, leafSlug);
      if (record) return fromTrinket(record);
    }

    if (prefix === 'bloodlines') {
      const record = await bloodlineRepository.getBySlug(locale, leafSlug);
      if (record) return fromBloodline(record);
    }

    if (prefix === 'vocations') {
      const record = await vocationRepository.getBySlug(locale, leafSlug);
      if (record) return fromVocation(record);
    }
  } catch (_err) {
    /* Repository errors are non-fatal — fall through to the hash fallback */
  }

  return fromFallback(rawContent);
}
