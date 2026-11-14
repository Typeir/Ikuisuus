/**
 * @fileoverview Vocation base-proficiency sync hook
 * @description Syncs each vocation entry's `baseSavingThrows`, `baseSkillChoiceCount`,
 * `baseSkillChoices`, and `baseTradeFixed` from the vocation metadata its slug
 * resolves to.
 *
 * @module modules/character-builder/presentation/builder/useVocationBaseSync
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { VocationOption } from '@/lib/types/vocations';
import { syncVocationBases } from '@/modules/character-builder/application/builderCore/builderMutations';
import {
    useSheetData,
    useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { useEffect } from 'react';

/**
 * Syncs `baseSavingThrows`, `baseSkillChoiceCount`, `baseSkillChoices`, and
 * `baseTradeFixed` on every vocation entry from vocation metadata by slug.
 *
 * @function useVocationBaseSync
 * @param {VocationOption[]} vocOptions - Loaded vocation metadata options
 * @returns {void}
 */
export function useVocationBaseSync(vocOptions: VocationOption[]): void {
  const { vocations } = useSheetData();
  const { patch: onChange } = useSheetMutators();

  useEffect(() => {
    const synced = syncVocationBases(vocations, vocOptions);
    if (synced) onChange({ vocations: synced });
  }, [vocOptions, vocations, onChange]);
}
