/**
 * @fileoverview Pure character transforms shared by builder pickers and the dev API.
 *
 * @module modules/character-builder/application/builderCore/builderMutations
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { ResolvedShard } from '@/lib/types/api';
import type {
  CharacterShard,
  CharacterSheet,
  VocationEntry,
} from '@/lib/types/character';
import type {
  BloodlineOption,
  FeatureEntry,
  SpecOption,
  VocationOption,
} from '@/lib/types/vocations';
import { UNKNOWN_DIE } from '@/lib/utils/diceUtils';
import { shardFor } from '@/lib/utils/contentShards';
import { sheetReducer } from '@/modules/character-builder/application/context/sheetReducer';
import { syncHitDiceLog } from '@/modules/character-builder/lib/utils/hitDiceSync';
import { proficiencyRowKey } from '@/modules/character-builder/lib/utils/proficiencyRowKey';
import { anchorOf, entryKey } from '@/modules/character-builder/lib/utils/shardKey';

/**
 * Base-proficiency snapshot a vocation slug resolves to.
 *
 * @interface VocationBaseSnapshot
 * @property {string[]} saves - Saving-throw ability names
 * @property {number} skillCount - Number of base skill picks offered
 * @property {string[]} skillChoices - Offered skills as row-keys; empty means any
 * @property {string[]} tradeFixed - Outright-granted trades as row-keys
 */
export interface VocationBaseSnapshot {
  saves: string[];
  skillCount: number;
  skillChoices: string[];
  tradeFixed: string[];
}

/**
 * Feature category of a vocation or specialization shard.
 *
 * @typedef {'vocation-feature'|'specialization-feature'} FeatureCategory
 */
export type FeatureCategory = 'vocation-feature' | 'specialization-feature';

/**
 * Order-insensitive equality for two string lists.
 *
 * @function sameStringSet
 * @param {string[]} a - First list
 * @param {string[]} b - Second list
 * @returns {boolean} True when both hold the same values
 */
function sameStringSet(a: string[], b: string[]): boolean {
  return (
    a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')
  );
}

/**
 * Maps grant names to deduped, non-null table row-keys.
 *
 * @function toRowKeys
 * @param {'skill' | 'trade'} category - Table the names belong to
 * @param {string[]} names - Names from vocation metadata
 * @returns {string[]} Row-keys; wildcard names dropped
 */
function toRowKeys(category: 'skill' | 'trade', names: string[]): string[] {
  const keys = names
    .map((name) => proficiencyRowKey(category, name))
    .filter((key): key is string => key !== null);
  return [...new Set(keys)];
}

/**
 * Strips the `src/content/{locale}/` prefix from a metadata file path.
 *
 * @function stripContentPrefix
 * @param {string} file - Metadata file path
 * @returns {string} Path relative to the locale content root
 */
export function stripContentPrefix(file: string): string {
  return file.replace(/^src\/content\/[^/]+\//, '');
}

/**
 * Returns the merge patch for a bloodline pick; clears selected boons.
 *
 * @function bloodlinePatch
 * @param {string} slug - Picked slug; empty clears the bloodline
 * @param {BloodlineOption} [bloodline] - Bloodline metadata for `slug`
 * @returns {Partial<CharacterSheet>} Merge patch
 */
export function bloodlinePatch(
  slug: string,
  bloodline?: BloodlineOption,
): Partial<CharacterSheet> {
  const rawSpeeds = bloodline?.coreFeatures?.movementSpeeds ?? [];
  const walkEntry = rawSpeeds.find((s) => s.toLowerCase().startsWith('walk:'));
  const parsedWalk = walkEntry
    ? parseInt(walkEntry.replace(/[^0-9]/g, ''), 10) || null
    : null;
  return {
    bloodlineSlug: slug || null,
    bloodlineTitle: bloodline?.title ?? '',
    boonBudget: bloodline?.boonBudget ?? 0,
    selectedBoons: [],
    bloodlineSpeeds: rawSpeeds,
    speedOverride: parsedWalk,
  };
}

/**
 * Builds vocation or specialization feature shards from metadata and resolved prose.
 *
 * @function buildFeatureShards
 * @param {string} slug - Vocation or specialization slug
 * @param {string} file - Metadata file path
 * @param {FeatureEntry[]} features - Feature list from metadata
 * @param {FeatureCategory} category - Shard category
 * @param {ResolvedShard[]} [shards] - Resolved prose; omitted leaves `cachedText` unset
 * @returns {CharacterShard[]} Feature shards
 */
export function buildFeatureShards(
  slug: string,
  file: string,
  features: FeatureEntry[],
  category: FeatureCategory,
  shards?: ResolvedShard[],
): CharacterShard[] {
  const sourceFile = stripContentPrefix(file);
  return features.map((f) => ({
    id: `${slug}::${f.level}::${f.name}`,
    sourceFile,
    heading: f.name,
    key: entryKey(f),
    category,
    level: f.level,
    cachedText: shards ? shardFor(shards, f.name)?.source : undefined,
    grants: f.grants,
    tags: f.tags,
  }));
}

/**
 * Returns the entry patch for a vocation pick; resets the specialization.
 *
 * @function vocationEntryPatch
 * @param {string} slug - Picked slug; empty clears the entry
 * @param {VocationOption | undefined} vocation - Vocation metadata for `slug`
 * @param {CharacterShard[]} vocationFeatures - Feature shards of the vocation
 * @returns {Partial<VocationEntry>} Entry patch
 */
export function vocationEntryPatch(
  slug: string,
  vocation: VocationOption | undefined,
  vocationFeatures: CharacterShard[],
): Partial<VocationEntry> {
  return {
    slug: slug || '',
    title: vocation?.title ?? '',
    hitDie: vocation?.hitDie ?? UNKNOWN_DIE,
    vocationFeatures,
    specializationSlug: null,
    specializationTitle: '',
    specializationFeatures: [],
  };
}

/**
 * Returns the entry patch for a specialization pick.
 *
 * @function specializationEntryPatch
 * @param {string} slug - Picked slug; empty clears the specialization
 * @param {SpecOption | undefined} spec - Specialization metadata for `slug`
 * @param {CharacterShard[]} specializationFeatures - Feature shards of the specialization
 * @returns {Partial<VocationEntry>} Entry patch
 */
export function specializationEntryPatch(
  slug: string,
  spec: SpecOption | undefined,
  specializationFeatures: CharacterShard[],
): Partial<VocationEntry> {
  return {
    specializationSlug: slug || null,
    specializationTitle: spec?.title ?? '',
    specializationFeatures,
  };
}

/**
 * Merges a patch into one vocation entry.
 *
 * @function patchVocationAt
 * @param {VocationEntry[]} vocations - Current entries
 * @param {number} index - Entry index
 * @param {Partial<VocationEntry>} patch - Entry patch
 * @returns {VocationEntry[]} New entry list
 */
export function patchVocationAt(
  vocations: VocationEntry[],
  index: number,
  patch: Partial<VocationEntry>,
): VocationEntry[] {
  return vocations.map((v, i) => (i === index ? { ...v, ...patch } : v));
}

/**
 * Builds the base-proficiency snapshot of a vocation option.
 *
 * @function snapshotVocationBase
 * @param {VocationOption} option - Vocation metadata
 * @returns {VocationBaseSnapshot} Snapshot
 */
export function snapshotVocationBase(option: VocationOption): VocationBaseSnapshot {
  return {
    saves: option.savingThrows ?? [],
    skillCount: option.skillProficiencies?.count ?? 0,
    skillChoices: toRowKeys('skill', option.skillProficiencies?.choices ?? []),
    tradeFixed: toRowKeys('trade', option.toolProficiencies ?? []),
  };
}

/**
 * Syncs base saves, skill offer, and fixed trades on each entry from metadata.
 *
 * @function syncVocationBases
 * @param {VocationEntry[]} vocations - Current entries
 * @param {VocationOption[]} options - Vocation metadata
 * @returns {VocationEntry[] | null} Synced entries, or null when already in sync
 */
export function syncVocationBases(
  vocations: VocationEntry[],
  options: VocationOption[],
): VocationEntry[] | null {
  if (options.length === 0) return null;
  const bySlug = new Map(
    options.map((option) => [option.slug, snapshotVocationBase(option)]),
  );
  let changed = false;
  const synced = vocations.map((entry) => {
    const meta = entry.slug ? bySlug.get(entry.slug) : undefined;
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
  return changed ? synced : null;
}

/**
 * Returns the source file of a feat slug.
 *
 * @function featSourceFile
 * @param {string} slug - Feat slug
 * @returns {string} Source file path relative to the locale content root
 */
export function featSourceFile(slug: string): string {
  return `character-creation/feats/${slug}.mdx`;
}

/**
 * Builds the shard for a feat pick.
 *
 * @function buildFeatShard
 * @param {FeatMetadata} feat - Feat metadata
 * @param {string} [instanceId] - Extra id suffix for repeat instances
 * @returns {CharacterShard} Feat shard
 */
export function buildFeatShard(
  feat: FeatMetadata,
  instanceId?: string,
): CharacterShard {
  return {
    id: instanceId ? `feat::${feat.slug}::${instanceId}` : `feat::${feat.slug}`,
    sourceFile: featSourceFile(feat.slug),
    heading: feat.title,
    key: anchorOf(feat.title),
    category: 'feat',
    cachedText: feat.description ?? undefined,
    grants: feat.grants,
    tags: feat.tags,
  };
}

/**
 * Builds the shard for a single-cost boon pick.
 *
 * @function buildBoonShardFrom
 * @param {BloodlineBoon} boon - Boon metadata
 * @param {string} bloodlineSlug - Bloodline slug
 * @param {string} [cachedText] - Resolved boon prose
 * @returns {CharacterShard} Boon shard
 */
export function buildBoonShardFrom(
  boon: BloodlineBoon,
  bloodlineSlug: string,
  cachedText?: string,
): CharacterShard {
  return {
    id: `${bloodlineSlug}::${boon.name}`,
    sourceFile: `character-creation/bloodlines/${bloodlineSlug}.bloodline.mdx`,
    heading: boon.name,
    key: entryKey(boon),
    category: 'boon',
    bpCost: boon.bpValue,
    cachedText,
    tags: boon.tags,
  };
}

/**
 * Applies a merge patch through the sheet reducer so level, tier, and XP recompute.
 *
 * @function applyCharacterPatch
 * @param {CharacterSheet} character - Current character
 * @param {Partial<CharacterSheet>} patch - Merge patch
 * @returns {CharacterSheet} Patched character
 */
export function applyCharacterPatch(
  character: CharacterSheet,
  patch: Partial<CharacterSheet>,
): CharacterSheet {
  return sheetReducer(
    {
      character,
      draft: character,
      editing: false,
      activeTab: 'overview',
      dirty: false,
    },
    { type: 'PATCH', payload: patch },
  ).draft;
}

/**
 * Runs the sheet's sync effects once: vocation base data, then hit dice and max HP.
 *
 * @function settleCharacter
 * @param {CharacterSheet} character - Character to settle
 * @param {VocationOption[]} vocationOptions - Vocation metadata
 * @returns {CharacterSheet} Settled character
 */
export function settleCharacter(
  character: CharacterSheet,
  vocationOptions: VocationOption[],
): CharacterSheet {
  const vocations = syncVocationBases(character.vocations, vocationOptions);
  const withBases = vocations
    ? applyCharacterPatch(character, { vocations })
    : character;
  const hitDice = syncHitDiceLog(withBases);
  return hitDice ? applyCharacterPatch(withBases, hitDice) : withBases;
}
