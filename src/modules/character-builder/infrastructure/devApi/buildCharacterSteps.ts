/**
 * @fileoverview Build context, name pick, and scalar/tier/import steps for the dev character builder.
 *
 * @module modules/character-builder/infrastructure/devApi/buildCharacterSteps
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import 'server-only';

import type {
  CharacterAbility,
  CharacterSheet,
  TierLevel,
} from '@/lib/types/character';
import { applyCharacterPatch } from '@/modules/character-builder/application/builderCore/builderMutations';
import type {
  BuilderPayload,
  Resolution,
} from '@/modules/character-builder/application/builderCore/types';
import { TIER_CYCLE } from '@/modules/character-builder/lib/utils/characterStorage';
import { mapImportToAbility } from '@/modules/character-builder/presentation/tabs/abilities/importAbilityMapper';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';
import type { BuilderContent } from './builderContentSource';
import { resolveName, type CandidateReader } from './nameResolver';

/**
 * Mutable build context.
 *
 * @interface BuildContext
 * @property {CharacterSheet} character - Character being built
 * @property {Resolution[]} resolution - Resolution reports
 * @property {string[]} notes - Skipped inputs
 * @property {BuilderContent} content - Content reader
 * @property {number} [threshold] - Ambiguity gap
 */
export interface BuildContext {
  character: CharacterSheet;
  resolution: Resolution[];
  notes: string[];
  content: BuilderContent;
  threshold?: number;
}

/** Reader for slug/title records. */
export const bySlugTitle: CandidateReader<{ slug: string; title: string }> = {
  slug: (item) => item.slug,
  title: (item) => item.title,
};

/** Reader for name-keyed records, e.g. boons and sub-options. */
export const byName: CandidateReader<{ name: string }> = {
  slug: (item) => item.name,
  title: (item) => item.name,
};

/**
 * Turns a camel row-key tail into spaced words.
 *
 * @function humanizeRowKey
 * @param {string} rowKey - Row-key, e.g. `skills.sleightOfHand`
 * @returns {string} Spaced lower-case words, e.g. `sleight of hand`
 */
export function humanizeRowKey(rowKey: string): string {
  const tail = rowKey.includes('.') ? rowKey.slice(rowKey.indexOf('.') + 1) : rowKey;
  return tail.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

const byRowKey: CandidateReader<{ name: string }> = {
  slug: (item) => item.name,
  title: (item) => humanizeRowKey(item.name),
  extra: (item) => [item.name.slice(item.name.indexOf('.') + 1)],
};

/**
 * Resolves a name, records the report, and returns the picked item.
 *
 * @function pick
 * @template T
 * @param {BuildContext} ctx - Build context; mutated
 * @param {string} field - Payload path
 * @param {string} query - Name as sent
 * @param {T[]} items - Candidates
 * @param {CandidateReader<T>} reader - Candidate reader
 * @returns {T | null} Picked item
 */
export function pick<T>(
  ctx: BuildContext,
  field: string,
  query: string,
  items: T[],
  reader: CandidateReader<T>,
): T | null {
  const { resolution, item } = resolveName(field, query, items, reader, ctx.threshold);
  ctx.resolution.push(resolution);
  if (!item) ctx.notes.push(`${field}: no match for "${query}"`);
  return item;
}

/**
 * Applies a merge patch to the context character.
 *
 * @function patch
 * @param {BuildContext} ctx - Build context; mutated
 * @param {Partial<CharacterSheet>} partial - Merge patch
 * @returns {void}
 */
export function patch(ctx: BuildContext, partial: Partial<CharacterSheet>): void {
  ctx.character = applyCharacterPatch(ctx.character, partial);
}

/**
 * True for a known tier value.
 *
 * @function isTier
 * @param {unknown} value - Candidate
 * @returns {boolean} True when `value` is a {@link TierLevel}
 */
function isTier(value: unknown): value is TierLevel {
  return (TIER_CYCLE as readonly string[]).includes(String(value));
}

/**
 * Applies manual tiers to the skills or tools table.
 *
 * @function applyTiers
 * @param {BuildContext} ctx - Build context; mutated
 * @param {'skills' | 'tools'} table - Character table
 * @param {string} field - Payload field name
 * @param {Record<string, TierLevel>} tiers - Name to tier
 * @returns {void}
 */
export function applyTiers(
  ctx: BuildContext,
  table: 'skills' | 'tools',
  field: string,
  tiers: Record<string, TierLevel>,
): void {
  let rows = [...ctx.character[table]];
  for (const [name, tier] of Object.entries(tiers)) {
    if (!isTier(tier)) {
      ctx.notes.push(`${field}.${name}: unknown tier "${String(tier)}"; skipped`);
      continue;
    }
    const row = pick(ctx, `${field}.${name}`, name, rows, byRowKey);
    if (row) rows = rows.map((r) => (r.name === row.name ? { ...r, tier } : r));
  }
  patch(ctx, { [table]: rows } as Partial<CharacterSheet>);
}

/**
 * Imports named library items as abilities.
 *
 * @async
 * @function applyImports
 * @param {BuildContext} ctx - Build context; mutated
 * @param {BuilderPayload} payload - Build payload
 * @returns {Promise<void>}
 */
export async function applyImports(
  ctx: BuildContext,
  payload: BuilderPayload,
): Promise<void> {
  const imported: CharacterAbility[] = [];
  const sources = ctx.character.vocations
    .filter((v) => v.slug && v.title)
    .map((v) => v.title);
  const groups = [
    { tab: 'heirlooms' as const, names: payload.heirlooms, load: () => ctx.content.heirlooms() },
    { tab: 'trinkets' as const, names: payload.trinkets, load: () => ctx.content.trinkets() },
    {
      tab: 'spells' as const,
      names: payload.spells,
      load: () => ctx.content.spells([...new Set(sources)]),
    },
  ];
  for (const group of groups) {
    if (!group.names?.length) continue;
    const items = await group.load();
    for (const [index, query] of group.names.entries()) {
      const item = pick(ctx, `${group.tab}[${index}]`, query, items, bySlugTitle);
      if (item) imported.push(mapImportToAbility(item, group.tab));
    }
  }
  if (imported.length > 0) {
    patch(ctx, { abilities: [...ctx.character.abilities, ...imported] });
  }
}

/**
 * Applies scalar fields, which are name, ability scores, saves, equipment, and carry inputs.
 *
 * @function applyScalars
 * @param {BuildContext} ctx - Build context; mutated
 * @param {BuilderPayload} payload - Build payload
 * @returns {void}
 */
export function applyScalars(ctx: BuildContext, payload: BuilderPayload): void {
  if (payload.name !== undefined) patch(ctx, { name: payload.name });
  if (payload.abilityScores) {
    patch(ctx, {
      abilityScores: { ...ctx.character.abilityScores, ...payload.abilityScores },
    });
  }
  if (payload.savingThrows) {
    patch(ctx, {
      savingThrows: { ...ctx.character.savingThrows, ...payload.savingThrows },
    });
  }
  if (payload.equipment?.length) {
    patch(ctx, {
      equipment: [
        ...ctx.character.equipment,
        ...payload.equipment.map((item) => ({
          id: generateId(),
          name: item.name,
          quantity: item.quantity ?? 1,
          weightLb: item.weightLb ?? 0,
        })),
      ],
    });
  }
  if (payload.carrying) {
    patch(ctx, {
      carrying: { ...ctx.character.carrying, ...payload.carrying },
    });
  }
}
