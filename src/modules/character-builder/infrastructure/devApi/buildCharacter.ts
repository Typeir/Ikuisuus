/**
 * @fileoverview Builds or extends a character from a structured payload, mirroring the builder UI pick order.
 *
 * @module modules/character-builder/infrastructure/devApi/buildCharacter
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import 'server-only';

import type { BloodlineBoon } from '@/lib/db/content/schemas/bloodlineMetadata';
import type {
  CharacterShard,
  CharacterSheet,
  VocationEntry,
} from '@/lib/types/character';
import { shardFor } from '@/lib/utils/contentShards';
import {
  bloodlinePatch,
  buildBoonShardFrom,
  buildFeatShard,
  buildFeatureShards,
  featSourceFile,
  settleCharacter,
  specializationEntryPatch,
  vocationEntryPatch,
} from '@/modules/character-builder/application/builderCore/builderMutations';
import type {
  BuilderBoonInput,
  BuilderPayload,
  BuilderVocationInput,
  Resolution,
} from '@/modules/character-builder/application/builderCore/types';
import {
  createEmptyCharacter,
  createEmptyVocationEntry,
} from '@/modules/character-builder/lib/utils/characterStorage';
import { entryKey, shardIs } from '@/modules/character-builder/lib/utils/shardKey';
import { applySubOptionSelection } from '@/modules/character-builder/presentation/builder/boonSelection';
import type { BuilderContent } from './builderContentSource';
import {
  applyImports,
  applyScalars,
  applyTiers,
  byName,
  bySlugTitle,
  patch,
  pick,
  type BuildContext,
} from './buildCharacterSteps';

/**
 * Build output.
 *
 * @interface BuildResult
 * @property {CharacterSheet} character - Settled character
 * @property {Resolution[]} resolution - One report per resolved name, in payload order
 * @property {string[]} notes - Input issues that were skipped; never rules checks
 */
export interface BuildResult {
  character: CharacterSheet;
  resolution: Resolution[];
  notes: string[];
}

/**
 * Build options.
 *
 * @interface BuildOptions
 * @property {CharacterSheet} [base] - Character to extend; a new one is created when omitted
 * @property {number} [threshold] - Ambiguity gap for name resolution
 */
export interface BuildOptions {
  base?: CharacterSheet;
  threshold?: number;
}

/**
 * Applies the bloodline pick.
 *
 * @async
 * @function applyBloodline
 * @param {BuildContext} ctx - Build context; mutated
 * @param {string} query - Bloodline name
 * @returns {Promise<void>}
 */
async function applyBloodline(ctx: BuildContext, query: string): Promise<void> {
  const bloodlines = await ctx.content.bloodlines();
  const bloodline = pick(ctx, 'bloodline', query, bloodlines, bySlugTitle);
  if (bloodline) patch(ctx, bloodlinePatch(bloodline.slug, bloodline));
}

/**
 * Adds the specialization of a request to an entry.
 *
 * @async
 * @function withSpecialization
 * @param {BuildContext} ctx - Build context; mutated
 * @param {VocationEntry} entry - Entry with a vocation
 * @param {string} query - Specialization name
 * @param {number} index - Request index
 * @returns {Promise<VocationEntry>} Entry, with the specialization when it resolved
 */
async function withSpecialization(
  ctx: BuildContext,
  entry: VocationEntry,
  query: string,
  index: number,
): Promise<VocationEntry> {
  const specs = (await ctx.content.specializations()).filter(
    (s) => s.vocation === entry.slug,
  );
  const spec = pick(ctx, `vocations[${index}].specialization`, query, specs, bySlugTitle);
  if (!spec) return entry;
  const features = buildFeatureShards(
    spec.slug,
    spec.file,
    spec.features ?? [],
    'specialization-feature',
    await ctx.content.shards('specializations', spec.slug),
  );
  return { ...entry, ...specializationEntryPatch(spec.slug, spec, features) };
}

/**
 * Builds one vocation entry from a payload request.
 *
 * @async
 * @function buildVocationEntry
 * @param {BuildContext} ctx - Build context; mutated
 * @param {BuilderVocationInput} input - Vocation request
 * @param {number} index - Request index
 * @returns {Promise<VocationEntry | null>} Entry; null when the vocation did not resolve
 */
async function buildVocationEntry(
  ctx: BuildContext,
  input: BuilderVocationInput,
  index: number,
): Promise<VocationEntry | null> {
  const vocation = pick(
    ctx,
    `vocations[${index}].vocation`,
    input.vocation,
    await ctx.content.vocations(),
    bySlugTitle,
  );
  if (!vocation) return null;
  const features = buildFeatureShards(
    vocation.slug,
    vocation.file,
    vocation.features ?? [],
    'vocation-feature',
    await ctx.content.shards('vocations', vocation.slug),
  );
  const entry: VocationEntry = {
    ...createEmptyVocationEntry(),
    ...vocationEntryPatch(vocation.slug, vocation, features),
    level: Math.max(1, Math.floor(input.level ?? 1)),
  };
  return input.specialization
    ? withSpecialization(ctx, entry, input.specialization, index)
    : entry;
}

/**
 * Appends the payload vocations.
 *
 * @async
 * @function applyVocations
 * @param {BuildContext} ctx - Build context; mutated
 * @param {BuilderVocationInput[]} inputs - Vocation requests
 * @returns {Promise<void>}
 */
async function applyVocations(
  ctx: BuildContext,
  inputs: BuilderVocationInput[],
): Promise<void> {
  const entries: VocationEntry[] = [];
  for (const [index, input] of inputs.entries()) {
    const entry = await buildVocationEntry(ctx, input, index);
    if (entry) entries.push(entry);
  }
  patch(ctx, { vocations: [...ctx.character.vocations, ...entries] });
}

/**
 * Selects a variable-cost boon through its sub-options.
 *
 * @function selectSubOptions
 * @param {BuildContext} ctx - Build context; mutated
 * @param {BloodlineBoon} boon - Boon with sub-options
 * @param {string[]} names - Requested sub-option names
 * @param {number} index - Boon request index
 * @returns {void}
 */
function selectSubOptions(
  ctx: BuildContext,
  boon: BloodlineBoon,
  names: string[],
  index: number,
): void {
  const bloodlineSlug = ctx.character.bloodlineSlug ?? '';
  let boons = ctx.character.selectedBoons;
  for (const [optIndex, name] of names.entries()) {
    const field = `boons[${index}].subOptions[${optIndex}]`;
    const option = pick(ctx, field, name, boon.subOptions ?? [], byName);
    if (option) boons = applySubOptionSelection(boons, boon, option.name, bloodlineSlug);
  }
  patch(ctx, { selectedBoons: boons });
}

/**
 * Selects one single-cost boon.
 *
 * @async
 * @function selectBoon
 * @param {BuildContext} ctx - Build context; mutated
 * @param {BloodlineBoon} boon - Boon
 * @returns {Promise<void>}
 */
async function selectBoon(ctx: BuildContext, boon: BloodlineBoon): Promise<void> {
  const bloodlineSlug = ctx.character.bloodlineSlug ?? '';
  const key = entryKey(boon);
  const shards = await ctx.content.shards('bloodlines', bloodlineSlug, [key]);
  const shard = buildBoonShardFrom(boon, bloodlineSlug, shardFor(shards, key)?.source);
  patch(ctx, { selectedBoons: [...ctx.character.selectedBoons, shard] });
}

/**
 * Applies the payload boons of the chosen bloodline.
 *
 * @async
 * @function applyBoons
 * @param {BuildContext} ctx - Build context; mutated
 * @param {Array<string | BuilderBoonInput>} inputs - Boon requests
 * @returns {Promise<void>}
 */
async function applyBoons(
  ctx: BuildContext,
  inputs: Array<string | BuilderBoonInput>,
): Promise<void> {
  const slug = ctx.character.bloodlineSlug;
  if (!slug) {
    ctx.notes.push('boons: skipped, no bloodline selected');
    return;
  }
  const bloodline = (await ctx.content.bloodlines()).find((b) => b.slug === slug);
  const boons = (bloodline?.boons ?? []).filter((boon) => !boon.parentName);
  for (const [index, raw] of inputs.entries()) {
    const input = typeof raw === 'string' ? { name: raw } : raw;
    const boon = pick(ctx, `boons[${index}]`, input.name, boons, byName);
    if (!boon) continue;
    if ((boon.subOptions?.length ?? 0) > 0) {
      if (input.subOptions?.length) selectSubOptions(ctx, boon, input.subOptions, index);
      else ctx.notes.push(`boons[${index}]: "${boon.name}" needs subOptions; skipped`);
    } else if (ctx.character.selectedBoons.some((s) => shardIs(s, boon))) {
      ctx.notes.push(`boons[${index}]: "${boon.name}" already selected; skipped`);
    } else {
      await selectBoon(ctx, boon);
    }
  }
}

/**
 * Applies the payload feats; repeats add instances of repeatable feats.
 *
 * @async
 * @function applyFeats
 * @param {BuildContext} ctx - Build context; mutated
 * @param {string[]} inputs - Feat names
 * @returns {Promise<void>}
 */
async function applyFeats(ctx: BuildContext, inputs: string[]): Promise<void> {
  const feats = await ctx.content.feats();
  let selected: CharacterShard[] = ctx.character.selectedFeats ?? [];
  for (const [index, query] of inputs.entries()) {
    const feat = pick(ctx, `feats[${index}]`, query, feats, bySlugTitle);
    if (!feat) continue;
    const already = selected.some((s) => s.sourceFile === featSourceFile(feat.slug));
    if (already && feat.repeatable !== true) {
      ctx.notes.push(`feats[${index}]: "${feat.title}" already selected; skipped`);
      continue;
    }
    selected = [...selected, buildFeatShard(feat, already ? crypto.randomUUID() : undefined)];
  }
  patch(ctx, { selectedFeats: selected });
}

/**
 * Builds or extends a character from a payload; never blocks on rules.
 *
 * @async
 * @function buildCharacterFromPayload
 * @param {BuilderPayload} payload - Build payload
 * @param {BuilderContent} content - Content reader
 * @param {BuildOptions} [options] - Base character and ambiguity gap
 * @returns {Promise<BuildResult>} Settled character, resolution reports, and notes
 */
export async function buildCharacterFromPayload(
  payload: BuilderPayload,
  content: BuilderContent,
  options: BuildOptions = {},
): Promise<BuildResult> {
  const ctx: BuildContext = {
    character: options.base ?? createEmptyCharacter(),
    resolution: [],
    notes: [],
    content,
    threshold: options.threshold,
  };
  applyScalars(ctx, payload);
  if (payload.bloodline) await applyBloodline(ctx, payload.bloodline);
  if (payload.vocations?.length) await applyVocations(ctx, payload.vocations);
  if (payload.experience !== undefined) patch(ctx, { experience: payload.experience });
  if (payload.boons?.length) await applyBoons(ctx, payload.boons);
  if (payload.feats?.length) await applyFeats(ctx, payload.feats);
  if (payload.skills) applyTiers(ctx, 'skills', 'skills', payload.skills);
  if (payload.trades) applyTiers(ctx, 'tools', 'trades', payload.trades);
  await applyImports(ctx, payload);
  return {
    character: settleCharacter(ctx.character, await content.vocations()),
    resolution: ctx.resolution,
    notes: ctx.notes,
  };
}
