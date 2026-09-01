/**
 * @fileoverview Encounter Data Service
 * @description API service helpers for encounter planner index/search data.
 *
 * @module modules/encounter-planner/infrastructure/services/encounterDataService
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { fetcher } from '@/lib/fetch/fetcher';
import type { MonsterIndexEntry } from '@/lib/db/content/schemas/monsterMetadata';

export type { MonsterIndexEntry };

/**
 * Combobox-compatible spell index entry.
 *
 * @interface SpellIndexEntry
 * @property {string} slug - Spell slug identifier
 * @property {string} title - Spell display title
 * @property {number} level - Spell level
 * @property {string} school - Spell school
 */
export interface SpellIndexEntry {
  slug: string;
  title: string;
  level: number;
  school: string;
}

/**
 * Combobox-compatible affix index entry.
 *
 * @interface AffixIndexEntry
 * @property {string} slug - Affix slug identifier
 * @property {string} title - Affix display title
 * @property {string} link - Affix source link
 */
export interface AffixIndexEntry {
  slug: string;
  title: string;
  link: string;
}

/**
 * Minimal spell detail payload used for spell link rendering.
 *
 * @interface SpellDetail
 * @property {string} [link] - Optional wiki link for the spell
 */
export interface SpellDetail {
  link?: string;
}

/**
 * Fetches locale-specific monster index.
 *
 * @param {string} locale - Current locale
 * @returns {Promise<MonsterIndexEntry[]>} Monster index entries
 */
export function fetchMonsterIndex(
  locale: string,
): Promise<MonsterIndexEntry[]> {
  return fetcher<MonsterIndexEntry[]>(`/api/monsters/index?locale=${locale}`);
}

/**
 * Fetches locale-specific spell index.
 *
 * @param {string} locale - Current locale
 * @returns {Promise<SpellIndexEntry[]>} Spell index entries
 */
export function fetchSpellIndex(locale: string): Promise<SpellIndexEntry[]> {
  return fetcher<SpellIndexEntry[]>(`/api/spells/index?locale=${locale}`);
}

/**
 * Fetches locale-specific affix index.
 *
 * @param {string} locale - Current locale
 * @returns {Promise<AffixIndexEntry[]>} Affix index entries
 */
export function fetchAffixIndex(locale: string): Promise<AffixIndexEntry[]> {
  return fetcher<AffixIndexEntry[]>(`/api/affixes/index?locale=${locale}`);
}

/**
 * Fetches spell details for a single spell slug.
 *
 * @param {string} locale - Current locale
 * @param {string} slug - Spell slug
 * @returns {Promise<SpellDetail>} Spell detail payload
 */
export function fetchSpellBySlug(
  locale: string,
  slug: string,
): Promise<SpellDetail> {
  return fetcher<SpellDetail>(`/api/spells/${slug}?locale=${locale}`);
}
