/**
 * @fileoverview Encounter Data Hooks
 * @description Client hooks for encounter planner combobox indexes and
 * spell link hydration. Index hooks use SWR; spell link accumulation
 * uses useEffect.
 *
 * @module lib/hooks/data/useEncounterData
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

import {
    affixesIndexKey,
    monstersIndexKey,
    spellsIndexKey,
} from '@/lib/fetch/swrKeys';
import { logger } from '@/lib/logging/logger';
import {
    fetchAffixIndex,
    fetchMonsterIndex,
    fetchSpellBySlug,
    fetchSpellIndex,
    type AffixIndexEntry,
    type MonsterIndexEntry,
    type SpellIndexEntry,
} from '@/modules/encounter-planner/infrastructure/services/encounterDataService';
import type { ComboboxItem } from '@/modules/encounter-planner/presentation/comboboxes/genericCombobox';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

const log = logger.child({ module: 'useEncounterData' });

/**
 * Encounter data hook state wrapper.
 *
 * @template T
 * @interface EncounterDataState
 * @property {T[]} items - Loaded items
 * @property {boolean} isLoading - Loading state
 */
export interface EncounterDataState<T> {
  items: T[];
  isLoading: boolean;
}

/**
 * Creature combobox item shape.
 *
 * @interface CreatureComboboxItem
 */
export interface CreatureComboboxItem extends MonsterIndexEntry, ComboboxItem {}

/**
 * Spell combobox item shape.
 *
 * @interface SpellComboboxItem
 */
export interface SpellComboboxItem extends SpellIndexEntry, ComboboxItem {}

/**
 * Affix combobox item shape.
 *
 * @interface AffixComboboxItem
 */
export interface AffixComboboxItem extends AffixIndexEntry, ComboboxItem {}

/**
 * Loads monster index entries and maps them for GenericCombobox.
 *
 * @param {string} locale - Current locale
 * @returns {EncounterDataState<CreatureComboboxItem>} Creature index state
 */
export function useCreatureIndex(
  locale: string,
): EncounterDataState<CreatureComboboxItem> {
  const { data, isLoading } = useSWR<CreatureComboboxItem[]>(
    monstersIndexKey(locale),
    async () => {
      const result = await fetchMonsterIndex(locale);
      return result.map((monster) => ({
        ...monster,
        id: monster.slug,
        searchableText: `${monster.title} ${monster.creatureType} ${monster.size} ${monster.cr} ${monster.slug}`,
      }));
    },
    {
      onError: (error) => {
        log.error('Failed to load monster index', {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  );

  return { items: data ?? [], isLoading };
}

/**
 * Loads spell index entries and maps them for GenericCombobox.
 *
 * @param {string} locale - Current locale
 * @returns {EncounterDataState<SpellComboboxItem>} Spell index state
 */
export function useSpellIndex(
  locale: string,
): EncounterDataState<SpellComboboxItem> {
  const { data, isLoading } = useSWR<SpellComboboxItem[]>(
    spellsIndexKey(locale),
    async () => {
      const result = await fetchSpellIndex(locale);
      return result.map((spell) => ({
        ...spell,
        id: spell.slug,
        searchableText: `${spell.title} ${spell.school} ${spell.slug}`,
      }));
    },
    {
      onError: (error) => {
        log.error('Failed to load spell index', {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  );

  return { items: data ?? [], isLoading };
}

/**
 * Loads affix index entries and maps them for GenericCombobox.
 * Filters out affixes whose title is already in `existingAffixes`.
 *
 * @param {string} locale - Current locale
 * @param {string[]} existingAffixes - Existing affix titles to filter out
 * @returns {EncounterDataState<AffixComboboxItem>} Affix index state
 */
export function useAffixIndex(
  locale: string,
  existingAffixes: string[],
): EncounterDataState<AffixComboboxItem> {
  const { data: allItems, isLoading } = useSWR<AffixComboboxItem[]>(
    affixesIndexKey(locale),
    async () => {
      const result = await fetchAffixIndex(locale);
      return result.map((affix) => ({
        ...affix,
        id: affix.slug,
        searchableText: affix.title,
      }));
    },
    {
      onError: (error) => {
        log.error('Failed to load affix index', {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  );

  const items = useMemo(
    () =>
      (allItems ?? []).filter(
        (affix) => !existingAffixes.includes(affix.title),
      ),
    [allItems, existingAffixes],
  );

  return { items, isLoading };
}

/**
 * Loads and caches spell links for provided spell slugs.
 *
 * @param {string[]} slugs - Spell slugs to resolve
 * @param {string} locale - Current locale
 * @returns {Record<string, string>} Map of slug to wiki link
 */
export function useSpellLinks(
  slugs: string[],
  locale: string,
): Record<string, string> {
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const missing = slugs.filter((slug) => !links[slug]);
      if (missing.length === 0) {
        return;
      }

      const fetched: Record<string, string> = {};
      for (const slug of missing) {
        try {
          const detail = await fetchSpellBySlug(locale, slug);
          if (!detail.link) {
            continue;
          }
          fetched[slug] = /^https?:\/\//i.test(detail.link)
            ? detail.link
            : `/${locale}${detail.link.startsWith('/') ? '' : '/'}${detail.link}`;
        } catch (error) {
          log.error('Failed to load spell link', {
            slug,
            locale,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (cancelled || Object.keys(fetched).length === 0) {
        return;
      }

      setLinks((current) => ({ ...current, ...fetched }));
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale, links, slugs]);

  return links;
}
