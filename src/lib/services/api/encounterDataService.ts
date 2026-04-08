/**
 * @fileoverview Encounter Data Service
 * @description API service helpers for encounter planner index/search data.
 *
 * @module lib/services/api/encounterDataService
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { getJson } from './jsonClient';

/**
 * Combobox-compatible monster index entry.
 *
 * @interface MonsterIndexEntry
 * @property {string} slug - Monster slug identifier
 * @property {string} title - Monster display title
 * @property {string} cr - Challenge rating text
 * @property {string} size - Creature size
 * @property {string} creatureType - Creature type
 */
export interface MonsterIndexEntry {
  slug: string;
  title: string;
  cr: string;
  size: string;
  creatureType: string;
}

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
  return getJson<MonsterIndexEntry[]>(`/api/monsters/index?locale=${locale}`);
}

/**
 * Fetches locale-specific spell index.
 *
 * @param {string} locale - Current locale
 * @returns {Promise<SpellIndexEntry[]>} Spell index entries
 */
export function fetchSpellIndex(locale: string): Promise<SpellIndexEntry[]> {
  return getJson<SpellIndexEntry[]>(`/api/spells/index?locale=${locale}`);
}

/**
 * Fetches locale-specific affix index.
 *
 * @param {string} locale - Current locale
 * @returns {Promise<AffixIndexEntry[]>} Affix index entries
 */
export function fetchAffixIndex(locale: string): Promise<AffixIndexEntry[]> {
  return getJson<AffixIndexEntry[]>(`/api/affixes/index?locale=${locale}`);
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
  return getJson<SpellDetail>(`/api/spells/${slug}?locale=${locale}`);
}
