/**
 * @fileoverview Encounter Data Hooks
 * @description Client hooks for encounter planner combobox indexes and
 * spell link hydration.
 *
 * @module lib/hooks/data/useEncounterData
 */

import type { ComboboxItem } from '@/lib/components/encounterPlanner/comboboxes/genericCombobox';
import { logger } from '@/lib/logging/logger';
import {
  fetchAffixIndex,
  fetchMonsterIndex,
  fetchSpellBySlug,
  fetchSpellIndex,
  type AffixIndexEntry,
  type MonsterIndexEntry,
  type SpellIndexEntry,
} from '@/lib/services/api/encounterDataService';
import { useEffect, useMemo, useState } from 'react';

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
  const [items, setItems] = useState<CreatureComboboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchMonsterIndex(locale);
        if (cancelled) {
          return;
        }
        setItems(
          result.map((monster) => ({
            ...monster,
            id: monster.slug,
            searchableText: `${monster.title} ${monster.creatureType} ${monster.size} ${monster.cr} ${monster.slug}`,
          })),
        );
      } catch (error) {
        log.error('Failed to load monster index', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { items, isLoading };
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
  const [items, setItems] = useState<SpellComboboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchSpellIndex(locale);
        if (cancelled) {
          return;
        }
        setItems(
          result.map((spell) => ({
            ...spell,
            id: spell.slug,
            searchableText: `${spell.title} ${spell.school} ${spell.slug}`,
          })),
        );
      } catch (error) {
        log.error('Failed to load spell index', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { items, isLoading };
}

/**
 * Loads affix index entries and maps them for GenericCombobox.
 *
 * @param {string} locale - Current locale
 * @param {string[]} existingAffixes - Existing affix titles to filter out
 * @returns {EncounterDataState<AffixComboboxItem>} Affix index state
 */
export function useAffixIndex(
  locale: string,
  existingAffixes: string[],
): EncounterDataState<AffixComboboxItem> {
  const [allItems, setAllItems] = useState<AffixComboboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchAffixIndex(locale);
        if (cancelled) {
          return;
        }
        setAllItems(
          result.map((affix) => ({
            ...affix,
            id: affix.slug,
            searchableText: affix.title,
          })),
        );
      } catch (error) {
        log.error('Failed to load affix index', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const items = useMemo(
    () => allItems.filter((affix) => !existingAffixes.includes(affix.title)),
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
