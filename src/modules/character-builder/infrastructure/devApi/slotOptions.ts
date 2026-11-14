/**
 * @fileoverview Lists slot options with the same filters the builder UI applies.
 *
 * @module modules/character-builder/infrastructure/devApi/slotOptions
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import 'server-only';

import type { CharacterSheet } from '@/lib/types/character';
import { computeBpStatus } from '@/modules/character-builder/application/builderCore/builderMetrics';
import { featSourceFile } from '@/modules/character-builder/application/builderCore/builderMutations';
import { collectFeatureStates } from '@/modules/character-builder/application/builderCore/builderState';
import type {
  BuilderSlot,
  SlotOption,
} from '@/modules/character-builder/application/builderCore/types';
import {
  collectAssignableGrants,
  matchesChoice,
} from '@/modules/character-builder/lib/utils/assignableGrants';
import { deriveGrantFloors } from '@/modules/character-builder/lib/utils/grants';
import { deriveProficiencyHints } from '@/modules/character-builder/lib/utils/proficiencyBudget';
import { shardIs } from '@/modules/character-builder/lib/utils/shardKey';
import type { BuilderContent } from './builderContentSource';
import { humanizeRowKey } from './buildCharacterSteps';

/**
 * Every slot the listing accepts.
 *
 * @constant BUILDER_SLOTS
 * @type {readonly BuilderSlot[]}
 */
export const BUILDER_SLOTS: readonly BuilderSlot[] = [
  'bloodline',
  'vocation',
  'specialization',
  'boons',
  'feats',
  'skills',
  'trades',
  'heirlooms',
  'trinkets',
  'spells',
  'features',
];

/**
 * True for a known slot name.
 *
 * @function isBuilderSlot
 * @param {unknown} value - Candidate
 * @returns {boolean} True when `value` is a {@link BuilderSlot}
 */
export function isBuilderSlot(value: unknown): value is BuilderSlot {
  return (BUILDER_SLOTS as readonly string[]).includes(String(value));
}

/**
 * Lists boons of the character's bloodline with cost and pick state.
 *
 * @async
 * @function boonOptions
 * @param {CharacterSheet} character - Character
 * @param {BuilderContent} content - Content reader
 * @returns {Promise<SlotOption[]>} Boon options; empty without a bloodline
 */
async function boonOptions(
  character: CharacterSheet,
  content: BuilderContent,
): Promise<SlotOption[]> {
  const bloodline = (await content.bloodlines()).find(
    (b) => b.slug === character.bloodlineSlug,
  );
  const bp = computeBpStatus(character.selectedBoons ?? [], character.boonBudget ?? 0);
  return (bloodline?.boons ?? [])
    .filter((boon) => !boon.parentName)
    .map((boon) => ({
      slug: boon.name,
      title: boon.name,
      info: {
        bpValue: boon.bpValue ?? null,
        bpLabel: boon.bpLabel ?? null,
        subOptionMode: boon.subOptions?.length ? (boon.subOptionMode ?? 'choose-one') : null,
        subOptions: (boon.subOptions ?? []).map((o) => ({
          name: o.name,
          bpValue: o.bpValue ?? null,
        })),
        selected: (character.selectedBoons ?? []).some((s) => shardIs(s, boon)),
        affordable: boon.bpValue === undefined ? null : boon.bpValue <= bp.remaining,
      },
    }));
}

/**
 * Lists skill or trade rows with tier, floor, hint, and eligible grant ids.
 *
 * @function proficiencyOptions
 * @param {CharacterSheet} character - Character
 * @param {'skills' | 'trades'} slot - Table slot
 * @returns {SlotOption[]} Row options
 */
function proficiencyOptions(
  character: CharacterSheet,
  slot: 'skills' | 'trades',
): SlotOption[] {
  const floors = deriveGrantFloors(character);
  const hints = deriveProficiencyHints(character);
  const category = slot === 'skills' ? 'skill' : 'trade';
  const grants = collectAssignableGrants(character).filter(
    (grant) => grant.category === category,
  );
  const rows = slot === 'skills' ? character.skills : character.tools;
  const floorMap = slot === 'skills' ? floors.skills : floors.tools;
  const hintSet = slot === 'skills' ? hints.skills : hints.trades;
  return rows.map((row) => ({
    slug: row.name,
    title: humanizeRowKey(row.name),
    info: {
      tier: row.tier,
      floor: floorMap[row.name] ?? 'none',
      hinted: hintSet.has(row.name),
      eligibleGrants: grants
        .filter((grant) => matchesChoice(row.name, grant.choice))
        .map((grant) => grant.id),
    },
  }));
}

/**
 * Lists options for one slot.
 *
 * @async
 * @function listSlotOptions
 * @param {BuilderSlot} slot - Slot name
 * @param {CharacterSheet} character - Character the listing is relative to
 * @param {BuilderContent} content - Content reader
 * @param {number} [vocationIndex] - Vocation entry for `specialization` (default 0)
 * @returns {Promise<SlotOption[]>} Options; empty when the slot has no context yet
 */
export async function listSlotOptions(
  slot: BuilderSlot,
  character: CharacterSheet,
  content: BuilderContent,
  vocationIndex = 0,
): Promise<SlotOption[]> {
  switch (slot) {
    case 'bloodline':
      return (await content.bloodlines()).map((b) => ({
        slug: b.slug,
        title: b.title,
        info: { boonBudget: b.boonBudget ?? 0 },
      }));
    case 'vocation':
      return (await content.vocations()).map((v) => ({
        slug: v.slug,
        title: v.title,
        info: { hitDie: v.hitDie ?? null },
      }));
    case 'specialization': {
      const vocationSlug = character.vocations[vocationIndex]?.slug;
      if (!vocationSlug) return [];
      return (await content.specializations())
        .filter((s) => s.vocation === vocationSlug)
        .map((s) => ({ slug: s.slug, title: s.title, info: { vocation: s.vocation } }));
    }
    case 'boons':
      return boonOptions(character, content);
    case 'feats': {
      const selected = character.selectedFeats ?? [];
      return (await content.feats()).map((f) => ({
        slug: f.slug,
        title: f.title,
        info: {
          repeatable: f.repeatable === true,
          hasPrerequisite: f.hasPrerequisite === true,
          prerequisite: f.prerequisite ?? null,
          selectedCount: selected.filter(
            (s) => s.sourceFile === featSourceFile(f.slug),
          ).length,
        },
      }));
    }
    case 'skills':
    case 'trades':
      return proficiencyOptions(character, slot);
    case 'heirlooms':
      return (await content.heirlooms()).map((i) => ({ slug: i.slug, title: i.title }));
    case 'trinkets':
      return (await content.trinkets()).map((i) => ({ slug: i.slug, title: i.title }));
    case 'spells': {
      const sources = [
        ...new Set(
          character.vocations.filter((v) => v.slug && v.title).map((v) => v.title),
        ),
      ];
      return (await content.spells(sources)).map((s) => ({
        slug: s.slug,
        title: s.title,
        info: { level: s.level ?? null },
      }));
    }
    case 'features':
      return collectFeatureStates(character).map((f) => ({
        slug: f.id,
        title: f.heading,
        info: {
          category: f.category,
          level: f.level,
          vocationIndex: f.vocationIndex,
          unlocked: f.unlocked,
        },
      }));
  }
}
