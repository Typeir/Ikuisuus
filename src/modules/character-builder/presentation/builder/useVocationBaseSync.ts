/**
 * @fileoverview Vocation base-proficiency sync hook
 * @description Syncs each vocation entry's `baseSavingThrows`, `baseSkillChoiceCount`,
 * `baseSkillChoices`, and `baseTradeFixed` from the vocation metadata its slug
 * resolves to. Patches only on a real difference.
 *
 * @module modules/character-builder/presentation/builder/useVocationBaseSync
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { VocationOption } from '@/lib/types/vocations';
import {
    useSheetData,
    useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { proficiencyRowKey } from '@/modules/character-builder/lib/utils/proficiencyRowKey';
import { useEffect } from 'react';

/**
 * Order-insensitive equality for two string lists.
 *
 * @function sameStringSet
 * @param {string[]} a - First list
 * @param {string[]} b - Second list
 * @returns {boolean} True when both contain the same values regardless of order
 */
function sameStringSet(a: string[], b: string[]): boolean {
  return (
    a.length === b.length &&
    [...a].sort().join('|') === [...b].sort().join('|')
  );
}

/**
 * Maps a list of grant names to deduped, non-null table row-keys.
 *
 * @function toRowKeys
 * @param {'skill' | 'trade'} category - Which table the names belong to
 * @param {string[]} names - Grant names from vocation metadata
 * @returns {string[]} Resolved row-keys, wildcard/category names dropped
 */
function toRowKeys(category: 'skill' | 'trade', names: string[]): string[] {
  const keys = names
    .map((name) => proficiencyRowKey(category, name))
    .filter((key): key is string => key !== null);
  return [...new Set(keys)];
}

/**
 * Base-proficiency snapshot a vocation slug resolves to.
 *
 * @interface VocationBaseSnapshot
 * @property {string[]} saves - Saving-throw ability names
 * @property {number} skillCount - Number of base skill picks offered
 * @property {string[]} skillChoices - Offered skills as row-keys (empty = "any")
 * @property {string[]} tradeFixed - Outright-granted trades as row-keys
 */
interface VocationBaseSnapshot {
  saves: string[];
  skillCount: number;
  skillChoices: string[];
  tradeFixed: string[];
}

/**
 * Syncs `baseSavingThrows`, `baseSkillChoiceCount`, `baseSkillChoices`, and
 * `baseTradeFixed` on every vocation entry from vocation metadata by slug.
 * Reads the vocation entries and the write API from the active-sheet context.
 *
 * @function useVocationBaseSync
 * @param {VocationOption[]} vocOptions - Loaded vocation metadata options
 * @returns {void}
 */
export function useVocationBaseSync(vocOptions: VocationOption[]): void {
  const { vocations } = useSheetData();
  const { patch: onChange } = useSheetMutators();

  useEffect(() => {
    if (vocOptions.length === 0) return;
    const metaBySlug = new Map<string, VocationBaseSnapshot>(
      vocOptions.map((option) => [
        option.slug,
        {
          saves: option.savingThrows ?? [],
          skillCount: option.skillProficiencies?.count ?? 0,
          skillChoices: toRowKeys(
            'skill',
            option.skillProficiencies?.choices ?? [],
          ),
          tradeFixed: toRowKeys('trade', option.toolProficiencies ?? []),
        },
      ]),
    );
    let changed = false;
    const synced = vocations.map((entry) => {
      if (!entry.slug) return entry;
      const meta = metaBySlug.get(entry.slug);
      if (meta === undefined) return entry;
      const same =
        sameStringSet(entry.baseSavingThrows ?? [], meta.saves) &&
        (entry.baseSkillChoiceCount ?? 0) === meta.skillCount &&
        sameStringSet(entry.baseSkillChoices ?? [], meta.skillChoices) &&
        sameStringSet(entry.baseTradeFixed ?? [], meta.tradeFixed);
      if (same) return entry;
      changed = true;
      return {
        ...entry,
        baseSavingThrows: meta.saves,
        baseSkillChoiceCount: meta.skillCount,
        baseSkillChoices: meta.skillChoices,
        baseTradeFixed: meta.tradeFixed,
      };
    });
    if (changed) onChange({ vocations: synced });
  }, [vocOptions, vocations, onChange]);
}
