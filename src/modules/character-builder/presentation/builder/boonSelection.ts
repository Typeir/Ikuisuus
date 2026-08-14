/**
 * @fileoverview Boon Selection Helpers
 * @description Pure functions computing the next selected-boon shard array when a
 * variable-cost boon's sub-option is toggled.
 *
 * @module lib/components/characterSheet/builder/boonSelection
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata';
import type { CharacterShard } from '@/lib/types/character';

/**
 * Computes the next selected-boon array after toggling a sub-option of a
 * variable-cost boon. `choose-one` replaces the choice; `pick-any` toggles the
 * option in/out. Empty result removes the boon. `bpCost` is the summed cost of
 * the chosen options.
 *
 * @param {CharacterShard[]} selectedBoons - Current selection
 * @param {BloodlineBoon} boon - The boon whose sub-option changed
 * @param {string} optionName - The toggled sub-option name
 * @param {string} bloodlineSlug - Active bloodline slug, used for a new shard's id/source
 * @returns {CharacterShard[]} Next selection
 */
export function applySubOptionSelection(
  selectedBoons: CharacterShard[],
  boon: BloodlineBoon,
  optionName: string,
  bloodlineSlug: string,
): CharacterShard[] {
  const options = boon.subOptions ?? [];
  const mode = boon.subOptionMode ?? 'choose-one';
  const existing = selectedBoons.find((s) => s.heading === boon.name);
  const current = existing?.selectedSubOptions ?? [];

  let next: string[];
  if (mode === 'pick-any') {
    next = current.includes(optionName)
      ? current.filter((name) => name !== optionName)
      : [...current, optionName];
  } else {
    next = [optionName];
  }

  if (next.length === 0) {
    return selectedBoons.filter((s) => s.heading !== boon.name);
  }

  const bpCost = next.reduce(
    (sum, name) =>
      sum + (options.find((option) => option.name === name)?.bpValue ?? 0),
    0,
  );

  if (existing) {
    return selectedBoons.map((s) =>
      s.heading === boon.name ? { ...s, bpCost, selectedSubOptions: next } : s,
    );
  }

  const shard: CharacterShard = {
    id: `${bloodlineSlug}::${boon.name}`,
    sourceFile: `character-creation/bloodlines/${bloodlineSlug}.bloodline.mdx`,
    heading: boon.name,
    category: 'boon',
    bpCost,
    selectedSubOptions: next,
  };
  return [...selectedBoons, shard];
}
