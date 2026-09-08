/**
 * @fileoverview Declared-deed section reader.
 * @description Reads a sheet's single `Deeds` section, where each block names
 * its own kind on a `deed` attribute rather than sitting under a heading that
 * names it for the whole run.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 * @module scripts/metadata/extraction/monsterDeclaredDeeds
 */

import type { MonsterFeature } from '@/lib/types/feature';
import {
  extractDeedActs,
  extractDeedLair,
  extractDeedPhases,
  extractDeedStratagems,
} from './monsterDeedExtractor';
import type { MonsterSection } from './monsterSectionClassifier';

/**
 * Deed kinds a block may declare, and the reader each one belongs to.
 */
const READERS: Record<
  string,
  (section: MonsterSection) => MonsterFeature[]
> = {
  act: extractDeedActs,
  resist: extractDeedActs,
  stratagem: extractDeedStratagems,
  lair: extractDeedLair,
  phase: extractDeedPhases,
};

/**
 * Matches the kind a block declares on its opening tag.
 */
const DECLARED_KIND = /^\s*<[A-Z]\w*[^>]*\bdeed="([a-z]+)"/;

/**
 * Matches the heading that names a kind for a run of options that declare none
 * of their own, which is how a bullet list of deeds says what it is.
 */
const KIND_HEADING = /^\s*#{4,6} +(Act|Stratagem|Lair|Phase|Resist)\s*$/i;

/**
 * Splits a Deeds section into one run per declared kind.
 *
 * @description A run starts where a block declares a kind and ends where the
 * next block declares a different one, so the lines between — the prose that
 * introduces a kind's options — stay with the kind they belong to.
 *
 * @param {string[]} lines - The section's lines
 * @returns {Array<{ kind: string; start: number; lines: string[] }>} Runs in
 * source order
 */
function runsByKind(
  lines: string[],
): Array<{ kind: string; start: number; lines: string[] }> {
  type Run = { kind: string; start: number; lines: string[] };
  const runs: Run[] = [];
  let kind = '';

  for (let i = 0; i < lines.length; i += 1) {
    const named = lines[i].match(KIND_HEADING);
    if (named) {
      kind = named[1].toLowerCase();
      /* The heading names the run and is not itself a deed, so it is dropped
         rather than passed on as a sub-heading the reader would read. */
      runs.push({ kind, start: i + 1, lines: [] });
      continue;
    }

    const declared = lines[i].match(DECLARED_KIND);
    if (declared && declared[1] !== kind) {
      kind = declared[1];
      runs.push({ kind, start: i, lines: [] });
    }
    if (runs.length > 0) runs[runs.length - 1].lines.push(lines[i]);
  }
  return runs;
}

/**
 * Reads every deed in a section whose blocks declare their own kind.
 *
 * @param {MonsterSection} section - The classified `Deeds` section
 * @returns {MonsterFeature[]} Extracted deed features, in source order
 */
export function extractDeclaredDeeds(
  section: MonsterSection,
): MonsterFeature[] {
  const runs = runsByKind(section.lines);
  if (runs.length === 0) return [];

  const features: MonsterFeature[] = [];
  for (const run of runs) {
    const reader = READERS[run.kind];
    if (!reader) continue;
    features.push(
      ...reader({
        ...section,
        startLine: section.startLine + run.start,
        lines: run.lines,
      }),
    );
  }

  return features;
}
