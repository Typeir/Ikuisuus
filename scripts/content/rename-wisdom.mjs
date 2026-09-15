/**
 * @fileoverview Renames Intelligence to Wisdom once old Wisdom is gone.
 * @description The manifesto orders the two moves, so each file resolves its
 * old Wisdom sites through verdicts before its Intelligence is renamed
 *
 * @module scripts/content/rename-wisdom
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-14
 */

import { glob, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { matchesIn } from './audit-wisdom.mjs';

const ROOT = resolve(import.meta.dirname, '../..');

/**
 * Where the codemod reads.
 */
const PATTERNS = ['src/content/**/*.mdx', 'tests/fixtures/**/*.mdx'];

/**
 * Verdicts the manifesto already gives.
 *
 * @description Animal Handling moves to Charisma, Medicine stays on the mind
 * stat, and a monster's old Wisdom score and save die with the stat
 */
export const AUTO_VERDICTS = {
  'wis-skill-pair:Animal Handling': 'cha',
  'wis-skill-pair:Medicine': 'keep',
  'wis-slot-score': 'delete',
  'wis-slot-save': 'delete',
  'wis-save': 'keep',
  'wis-check': 'keep',
  'wis-modifier': 'keep',
  'wis-score': 'keep',
  'wis-abbrev': 'keep',
  'wis-word': 'keep',
  'wis-feat-ability': 'keep',
};

/**
 * Gap between old Wisdom and old Intelligence from which a monster's mind
 * score is their average rather than the Intelligence alone.
 */
export const MIND_GAP = 6;

/**
 * Old Intelligence at or below which a creature counts as low-minded.
 */
export const MIND_LOW = 8;

/**
 * Sets each Monster tag's Intelligence to the averaged mind score where its old
 * Wisdom stood far above a low old Intelligence.
 *
 * @description The mind stat no longer means abstract cognition, so a beast
 * with a large old Wisdom and a small old Intelligence keeps some of the
 * former; a creature whose Intelligence was already fair keeps it as is. The
 * Intelligence value is rewritten in place and renamed later
 * @param {string} text - Sheet text
 * @param {number} gap - Gap from which the average applies
 * @param {number} low - Intelligence at or below which it applies
 * @returns {{text: string, averaged: Array<{int: number, wis: number,
 * mind: number}>}} Text after, and each tag that was averaged
 */
export function averageMindScores(text, gap = MIND_GAP, low = MIND_LOW) {
  const averaged = [];
  const next = text.replace(/<Monster\b[\s\S]*?>/g, (tag) => {
    const int = tag.match(/\bint="(\d+)"/);
    const wis = tag.match(/\bwis="(\d+)"/);
    if (!int || !wis) return tag;
    const a = Number(int[1]);
    const b = Number(wis[1]);
    if (a > low || b - a < gap) return tag;
    const mind = Math.round((a + b) / 2);
    averaged.push({ int: a, wis: b, mind });
    return tag.replace(int[0], `int="${mind}"`);
  });
  return { text: next, averaged };
}

/**
 * Ability names by verdict.
 */
const ABILITY = {
  keep: ['Wisdom', 'WIS', 'Wis', 'wisdom'],
  cha: ['Charisma', 'CHA', 'Cha', 'charisma'],
  dex: ['Dexterity', 'DEX', 'Dex', 'dexterity'],
  con: ['Constitution', 'CON', 'Con', 'constitution'],
};

/**
 * Perception halves by verdict.
 */
const HALF = { descry: 'Descry', discern: 'Discern' };

/**
 * Renames applied once a file is clear of old Wisdom.
 */
const INTELLIGENCE_RULES = [
  [/\bint="/g, 'wis="'],
  [/\bInt ([+−-]\d+)/g, 'Wis $1'],
  [/\bIntelligence\b/g, 'Wisdom'],
  [/\bintelligence\b/g, 'wisdom'],
  [/\bINT\b/g, 'WIS'],
  [/\bInt\b/g, 'Wis'],
];

/**
 * Key a verdict is filed under.
 *
 * @param {object} row - An audit row
 * @returns {string} Path, line and kind joined
 */
export function verdictKey(row) {
  return `${row.path}:${row.line}:${row.kind}`;
}

/**
 * Verdict for one row, supplied or automatic.
 *
 * @param {object} row - An audit row
 * @param {Map<string, object>} verdicts - Supplied verdicts by key
 * @returns {(object|null)} Verdict with a `verdict` field, or null
 */
export function verdictFor(row, verdicts) {
  const supplied = verdicts.get(verdictKey(row));
  if (supplied) return supplied;
  if (row.kind === 'wis-save-prof' && /\/monsters\//.test(row.path)) {
    return { verdict: 'delete' };
  }
  const bySkill = row.skill && AUTO_VERDICTS[`${row.kind}:${row.skill}`];
  const byKind = AUTO_VERDICTS[row.kind];
  const verdict = bySkill ?? byKind;
  return verdict ? { verdict } : null;
}

/**
 * Swaps the ability words inside a matched span.
 *
 * @param {string} text - Matched text
 * @param {string} verdict - keep, cha, dex or con
 * @returns {string} Text on the new ability
 */
function swapAbility(text, verdict) {
  const [long, upper, title, lower] = ABILITY[verdict];
  return text
    .replace(/\bWisdom\b/g, long)
    .replace(/\bWIS\b/g, upper)
    .replace(/\bWis\b/g, title)
    .replace(/\bwisdom\b/g, lower);
}

/**
 * Rewrites one skill pair.
 *
 * @param {string} text - The `Wisdom (Skill)` span
 * @param {string} skill - Skill inside it
 * @param {string} verdict - Verdict for the pair
 * @returns {string} Pair on its new ability, Perception split if asked
 */
function swapPair(text, skill, verdict) {
  if (verdict in HALF) {
    const ability = verdict === 'descry' ? 'Dexterity' : 'Wisdom';
    return `${ability} (${HALF[verdict]})`;
  }
  return swapAbility(text, verdict).replace(skill, skill);
}

/**
 * Removes one saves entry from a `saves="…"` list.
 *
 * @param {string} line - The line carrying the list
 * @param {string} text - The `Wis +N` entry
 * @returns {string} Line without the entry
 */
function dropSave(line, text) {
  return line
    .replace(new RegExp(`${text.replace('+', '\\+')},\\s*`), '')
    .replace(new RegExp(`,\\s*${text.replace('+', '\\+')}`), '')
    .replace(text, '');
}

/**
 * Applies one verdict to one line.
 *
 * @param {string} line - Line before
 * @param {object} row - Audit row on that line
 * @param {object} verdict - Verdict for the row
 * @returns {(string|null)} Line after, or null when the line is deleted
 */
export function applyVerdict(line, row, verdict) {
  const kind = verdict.verdict;
  if (kind === 'rewrite') return verdict.text ?? line;
  if (kind === 'delete') {
    if (row.kind === 'wis-slot-score') {
      const stripped = line.replace(/\s*\bwis="[^"]*"/, '');
      return stripped.trim() === '' ? null : stripped;
    }
    if (row.kind === 'wis-slot-save') return dropSave(line, row.text);
    if (row.kind === 'wis-save-prof') {
      const entry = line.match(/Wisdom [+−-]\d+/)?.[0];
      return entry ? dropSave(line, entry) : line;
    }
    return null;
  }
  if (row.kind === 'wis-skill-pair') {
    return line.replaceAll(row.text, swapPair(row.text, row.skill, kind));
  }
  if (row.kind === 'perception' || row.kind === 'perception-passive') {
    if (!(kind in HALF)) return line;
    return line.replace(/\bPerception\b/g, HALF[kind]);
  }
  if (kind === 'keep') return line;
  if (kind in ABILITY) return line.replaceAll(row.text, swapAbility(row.text, kind));
  return line;
}

/**
 * Collapses a doubled Wisdom in an ability list.
 *
 * @param {string} text - File text after the rename
 * @returns {string} Text with `Wisdom or Wisdom` and `Wisdom, Wisdom` folded
 */
export function dedupeAbilityLists(text) {
  return text
    .replace(/\bWisdom(?:,| or) Wisdom\b/g, 'Wisdom')
    .replace(/\bWisdom, (?:[A-Z][a-z]+, )*Wisdom\b/g, (span) =>
      span.replace(/, Wisdom$/, ''),
    );
}

/**
 * Resolves a file's old Wisdom sites.
 *
 * @param {string} path - Repo-relative path
 * @param {string} text - File text
 * @param {Map<string, object>} verdicts - Supplied verdicts by key
 * @returns {{text: string, unresolved: Array<object>, applied: number}}
 * Text after the resolved verdicts, the rows still waiting, and how many
 * verdicts landed
 */
export function resolveOldWisdom(path, text, verdicts) {
  const rows = matchesIn(path, text).filter(
    (row) =>
      row.axis === 'old-wisdom' ||
      row.kind === 'perception' ||
      row.kind === 'perception-passive',
  );
  const lines = text.split('\n');
  const unresolved = [];
  const deleted = new Set();
  let applied = 0;

  for (const row of rows) {
    const verdict = verdictFor(row, verdicts);
    if (!verdict) {
      if (row.axis === 'old-wisdom') unresolved.push(row);
      continue;
    }
    const index = row.line - 1;
    if (deleted.has(index)) continue;
    const next = applyVerdict(lines[index], row, verdict);
    applied += 1;
    if (next === null) deleted.add(index);
    else lines[index] = next;
  }

  return {
    text: lines.filter((_, index) => !deleted.has(index)).join('\n'),
    unresolved,
    applied,
  };
}

/**
 * Renames Intelligence to Wisdom throughout a text.
 *
 * @param {string} text - Text clear of old Wisdom
 * @returns {string} Renamed text
 */
export function renameIntelligence(text) {
  const renamed = INTELLIGENCE_RULES.reduce(
    (carry, [pattern, replacement]) => carry.replace(pattern, replacement),
    text,
  );
  return dedupeAbilityLists(renamed);
}

/**
 * Rewrites one file, or leaves it whole when it is not ready.
 *
 * @param {string} path - Repo-relative path
 * @param {string} text - File text
 * @param {Map<string, object>} verdicts - Supplied verdicts by key
 * @returns {{text: string, ready: boolean, unresolved: Array<object>,
 * applied: number}} Outcome
 */
export function rewrite(path, text, verdicts) {
  const resolved = resolveOldWisdom(path, text, verdicts);
  if (resolved.unresolved.length > 0) {
    return { text, ready: false, unresolved: resolved.unresolved, applied: 0, averaged: [] };
  }
  const mind = averageMindScores(text);
  const settled = resolveOldWisdom(path, mind.text, verdicts);
  return {
    text: renameIntelligence(settled.text),
    ready: true,
    unresolved: [],
    applied: settled.applied,
    averaged: mind.averaged,
  };
}

/**
 * Reads a verdicts file into a map.
 *
 * @param {(string|undefined)} file - Path given on the command line
 * @returns {Promise<Map<string, object>>} Verdicts by key
 */
async function loadVerdicts(file) {
  const verdicts = new Map();
  if (!file) return verdicts;
  const list = JSON.parse(await readFile(resolve(ROOT, file), 'utf8'));
  for (const entry of list) {
    verdicts.set(`${entry.path}:${entry.line}:${entry.kind}`, entry);
  }
  return verdicts;
}

/**
 * Sweeps the corpus and rewrites the files that are ready.
 *
 * @returns {Promise<void>} Resolves once every ready file is written
 */
export async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const at = args.indexOf('--verdicts');
  const verdicts = await loadVerdicts(at >= 0 ? args[at + 1] : undefined);
  const ready = [];
  const blocked = new Map();
  const averaged = [];

  for await (const entry of glob(PATTERNS, { cwd: ROOT })) {
    const path = entry.replaceAll('\\', '/');
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    const outcome = rewrite(path, source, verdicts);
    if (!outcome.ready) {
      blocked.set(path, outcome.unresolved);
      continue;
    }
    for (const row of outcome.averaged) averaged.push(`${path} int ${row.int}, wis ${row.wis} → ${row.mind}`);
    if (outcome.text === source) continue;
    ready.push(path);
    if (!dryRun) await writeFile(resolve(ROOT, entry), outcome.text, 'utf8');
  }

  console.log(`${dryRun ? 'Would rewrite' : 'Rewrote'} ${ready.length} files`);
  for (const path of ready) console.log(`  ${path}`);
  console.log(`\nMind scores averaged (old Intelligence ${MIND_LOW} or less, old Wisdom at least ${MIND_GAP} above it): ${averaged.length}`);
  for (const line of averaged) console.log(`  ${line}`);
  const waiting = [...blocked.values()].flat();
  const byKind = new Map();
  for (const row of waiting) {
    byKind.set(row.kind, (byKind.get(row.kind) ?? 0) + 1);
  }
  console.log(
    `\nBlocked, ${blocked.size} files with ${waiting.length} old Wisdom sites awaiting a verdict:`,
  );
  for (const [kind, count] of byKind) console.log(`  ${kind}: ${count}`);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
