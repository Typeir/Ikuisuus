/**
 * @fileoverview Machine text stream resolver for MDX section decorations.
 * @description Resolves a deterministic stream string from content metadata,
 * with the result doubled and separated. Falls back to an FNV-1a32 hash of the
 * raw content when no metadata record exists for the slug path.
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
 * Title-cases a slug-like token, replacing hyphens/underscores with spaces.
 * Example: "dreaded-defender" -> "Dreaded Defender"
 */
function titleCaseToken(token: string): string {
  if (!token) return token;
  return token
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

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
 * Doubles a stream string by appending a normalized copy.
 *
 * @param {string} segment - Single-pass stream string
 * @returns {string} Doubled stream string
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
  const parts: string[] = [titleCaseToken(record.subSlug ?? record.slug)];
  if (record.cr) parts.push(`CR:${record.cr}`);
  if (record.size) parts.push(record.size.toUpperCase());
  if (record.creatureType) parts.push(record.creatureType.toUpperCase());
  if (record.hp?.average) parts.push(`HP:${record.hp.average}`);
  return wrapSegment(parts.join(' · '));
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
  const parts: string[] = [titleCaseToken(record.slug)];
  if (record.level !== undefined) parts.push(`LV:${record.level}`);
  if (record.school) parts.push(record.school.toUpperCase());
  if (record.castingTimeRaw) parts.push(record.castingTimeRaw);
  return wrapSegment(parts.join(' · '));
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
  const parts: string[] = [titleCaseToken(record.slug)];
  if (record.rarity) parts.push(record.rarity.toUpperCase());
  if (record.itemType) parts.push(record.itemType.toUpperCase());
  if (record.weaponType) parts.push(record.weaponType);
  return wrapSegment(parts.join(' · '));
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
  const parts: string[] = [titleCaseToken(record.slug)];
  parts.push(record.itemType.toUpperCase());
  if (record.damage && record.damageType) {
    parts.push(`${record.damage} ${record.damageType}`);
  }
  return wrapSegment(parts.join(' · '));
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
  const parts: string[] = [titleCaseToken(record.slug)];
  if (record.coreFeatures.creatureTypes.length > 0) {
    parts.push(record.coreFeatures.creatureTypes.join('/').toUpperCase());
  }
  if (record.boonBudget !== undefined) parts.push(`BP:${record.boonBudget}`);
  return wrapSegment(parts.join(' · '));
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
  const parts: string[] = [titleCaseToken(record.slug), 'VOCATION'];
  if (record.hitDie) parts.push(`HD:${record.hitDie}`);
  return wrapSegment(parts.join(' · '));
}

/**
 * Produces a fallback stream string from the raw file content hash.
 *
 * @param {string} rawContent - Raw MDX source content
 * @returns {string} Doubled stream string derived from FNV-1a32 hash
 */
function fromFallback(rawContent: string): string {
  const hash = fnv1a32(rawContent);
  return wrapSegment(`SIG:${hash}`);
}

/**
 * Resolves a deterministic single stream segment (NOT doubled) for a given page.
 *
 * @param {string} locale - Content locale (e.g. "en", "es")
 * @param {string[]} slugSegments - Decoded slug path segments
 * @param {string} rawContent - Raw MDX source used as fallback seed
 * @returns {Promise<string>} Single stream segment (wrapped) without doubling
 */
export async function resolveStreamSegment(
  locale: string,
  slugSegments: string[],
  rawContent: string,
): Promise<string> {
  const leafSlug = slugSegments[slugSegments.length - 1];
  const prefix = slugSegments[0];
  const subPrefix = slugSegments[1];

  try {
    switch (prefix) {
      case 'monsters': {
        const record = await monsterRepository.getBySlug(locale, leafSlug);
        if (record) return fromMonster(record);
        break;
      }
      case 'spells': {
        const record = await spellRepository.getBySlug(locale, leafSlug);
        if (record) return fromSpell(record);
        break;
      }
      case 'items': {
        if (subPrefix === 'heirlooms') {
          const record = await heirloomRepository.getBySlug(locale, leafSlug);
          if (record) return fromHeirloom(record);
        } else if (subPrefix === 'trinkets') {
          const record = await trinketRepository.getBySlug(locale, leafSlug);
          if (record) return fromTrinket(record);
        }
        break;
      }
      case 'bloodlines': {
        const record = await bloodlineRepository.getBySlug(locale, leafSlug);
        if (record) return fromBloodline(record);
        break;
      }
      case 'vocations': {
        const record = await vocationRepository.getBySlug(locale, leafSlug);
        if (record) return fromVocation(record);
        break;
      }
      default:
        break;
    }
  } catch (_err) {
    /* Repository errors are non-fatal — fall through to the hash fallback */
  }

  return fromFallback(rawContent);
}

/**
 * Resolves a deterministic stream string for a given page, doubled.
 * Falls back to an FNV-1a32 hash of the raw content.
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
  const segment = await resolveStreamSegment(locale, slugSegments, rawContent);
  return doubleStream(segment);
}
