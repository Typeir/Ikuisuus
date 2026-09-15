/**
 * @fileoverview Finds every site the Poise system plugs into.
 * @description Poise is a new source of two existing states, so the sweep
 * lists what already stuns, what already displaces, what refreshes on turn
 * start, and the tables and sheets that need a poise value
 *
 * @module scripts/content/audit-poise
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-14
 */

import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(import.meta.dirname, '../..');
const REPORT = resolve(ROOT, '.ignore/reports/poise-audit.md');
const ROWS = resolve(ROOT, '.ignore/reports/poise-audit.json');

/**
 * Directories the sweep never enters.
 */
const SKIP = [
  'node_modules',
  '.next',
  '.git',
  '.ignore',
  'dist',
  'coverage',
  'public',
  '.meta',
  '.paw',
  'Claude outputs',
];

/**
 * File extensions the sweep reads.
 */
const EXTENSIONS = ['mdx', 'md', 'ts', 'tsx', 'mjs', 'js', 'json'];

/**
 * The armour page, whose rows need a poise multiplier.
 */
export const ARMOUR_PAGE = 'src/content/en/items/equipment/armour.rule.mdx';

/**
 * What a prose match is, most specific form first.
 */
export const KINDS = [
  { id: 'poise-word', axis: 'poise', pattern: /\bpoise\b/gi },
  {
    id: 'stunned-keyword',
    axis: 'state',
    pattern: /\[# kw:condition:stunned #\]/gi,
  },
  { id: 'stunned-bare', axis: 'state', pattern: /\bstunned\b/gi },
  {
    id: 'staggered-keyword',
    axis: 'state',
    pattern: /\[# kw:condition:staggered #\]/gi,
  },
  { id: 'staggered-bare', axis: 'state', pattern: /\bstaggered\b/gi },
  {
    id: 'steady-keyword',
    axis: 'state',
    pattern: /\[# kw:condition:steady #\]/gi,
  },
  { id: 'unsteady', axis: 'state', pattern: /\bunsteady\b/gi },
  {
    id: 'displaced-register',
    axis: 'movement',
    pattern:
      /\bdisplaced?(?: (?:it|them|the \w+|that \w+))?(?: up to)? \[= \d+ stride =\]/gi,
  },
  {
    id: 'displace-keyword',
    axis: 'movement',
    pattern: /\[# kw:displace #\]/gi,
  },
  {
    id: 'displace-bare',
    axis: 'movement',
    pattern: /\bdisplace(?:d|s|ment)?\b/gi,
  },
  {
    id: 'displacement-resist',
    axis: 'movement',
    pattern:
      /\bpushed(?:\*\*)?, (?:\*\*)?pulled(?:\*\*)?, (?:or |)(?:\*\*)?knocked\b|\bpushed or pulled\b|\bmoved, pushed,/gi,
  },
  {
    id: 'forced-move',
    axis: 'movement',
    pattern:
      /\b(?:pushed|pulled|shoved|dragged|thrown|hurled|flung|launched|pushes|push|pulls|pull|shoves|shove|hurls|hurl)(?: (?:back|outward|away|up(?! to)))?(?: (?:the |a |that |each |one |any )?(?:\[# kw:[^\]]+ #\] )?(?:[a-z-]+ )?(?:creatures?|targets?|objects?|it|them|you))?(?: ?\*\*)?(?: ?(?:only )?up to| to)?(?: ?\*\*)? ?\[= \d+ stride =\]/gi,
  },
  {
    id: 'turn-start-legacy',
    axis: 'cadence',
    pattern:
      /\bstart of (?:each of )?(?:its|your|their|the \w+'s) (?:next )?turns?\b/gi,
  },
  {
    id: 'incipient-keyword',
    axis: 'cadence',
    pattern: /\[# kw:incipient #\]/gi,
  },
  {
    id: 'temp-hp',
    axis: 'ward',
    pattern: /\btemporary hit points\b|\bward points\b/gi,
  },
  {
    id: 'dex-to-ac-loss',
    axis: 'defence',
    pattern: /\blose(?:s)? (?:their|its|your) Dexterity bonus to AC\b/gi,
  },
  { id: 'ac-slot', axis: 'defence', pattern: /\barmorClass="[^"]*"/g },
  {
    id: 'ac-formula',
    axis: 'defence',
    pattern:
      /\b(?:base )?(?:AC|Armou?r Class)\b[^.\n|]{0,20}?\b(?:is|equals|becomes|of)\b[^.\n|]{0,12}?\b\d{1,2}\b(?: ?\+ ?[A-Za-z]{3}[^.\n|]{0,30})?/gi,
  },
  {
    id: 'ac-bonus',
    axis: 'defence',
    pattern:
      /[+−–-] ?\d (?:bonus )?to (?:your |their |its )?(?:AC|Armou?r Class)\b|\b(?:AC|Armou?r Class) (?:increases|goes up|is increased) by [+−–-]?\d|\bbonus to (?:your |their |its )?(?:AC|Armou?r Class)\b|\b(?:AC|Armou?r Class) [+−–-]\d|[+−–-]\d (?:AC|Armou?r Class)\b/gi,
  },
  {
    id: 'ac-penalty',
    axis: 'defence',
    pattern:
      /[−–-] ?\d penalty to (?:their |its |your )?(?:AC|Armou?r Class)\b|\b(?:AC|Armou?r Class) (?:decreases|goes down|is reduced) by [+−–-]?\d|\bpenalty to (?:their |its |your )?(?:AC|Armou?r Class)\b|\blose(?:s)? \d (?:points? of )?(?:AC|Armou?r Class)\b/gi,
  },
  {
    id: 'ac-word',
    axis: 'defence',
    pattern: /\b[Aa]rmou?r [Cc]lass\b|\bAC\b/g,
  },
  {
    id: 'defence-name',
    axis: 'defence',
    pattern: /\b(?:Uncanny|Shadowy) Dodge\b|\bDeflect (?:Attacks?|Energy|Missiles)\b/g,
  },
  {
    id: 'defence-word',
    axis: 'defence',
    pattern: /\bDefence\b|\bDodge\b|\bDeflect\b/g,
  },
  { id: 'monster-tag', axis: 'sheet', pattern: /^<Monster\b/g },
];

/**
 * What a code match is.
 */
export const CODE_KINDS = [
  { id: 'code-poise', axis: 'code', pattern: /poise/gi },
  { id: 'code-stunned', axis: 'code', pattern: /stunned/gi },
  { id: 'code-staggered', axis: 'code', pattern: /staggered/gi },
];

/**
 * Area a path belongs to.
 *
 * @param {string} path - Repo-relative path
 * @returns {string} Area name
 */
export function areaOf(path) {
  if (path.startsWith('src/content/')) return 'content';
  if (path.startsWith('tests/fixtures/')) return 'fixtures';
  if (path.startsWith('src/')) return 'src';
  if (path.startsWith('foundry/')) return 'foundry';
  if (path.startsWith('scripts/')) return 'scripts';
  if (path.startsWith('tests/')) return 'tests';
  if (path.startsWith('messages/')) return 'messages';
  if (path.startsWith('.github/')) return 'docs';
  return 'other';
}

/**
 * Whether a path is read as prose.
 *
 * @param {string} path - Repo-relative path
 * @returns {boolean} True for MDX and Markdown
 */
export function isProse(path) {
  return /\.mdx?$/.test(path);
}

/**
 * Whether a line is an armour table row.
 *
 * @param {string} line - One line of the armour page
 * @returns {boolean} True for a data row carrying a burden
 */
export function isArmourRow(line) {
  return /^\| /.test(line) && /burden/.test(line) && !/^\| -/.test(line);
}

/**
 * Every match in one file.
 *
 * @param {string} path - Repo-relative path
 * @param {string} source - File contents
 * @returns {Array<{path: string, area: string, line: number, column: number,
 * kind: string, axis: string, text: string, context: string}>} Matches found
 */
export function matchesIn(path, source) {
  const kinds = isProse(path) ? KINDS : CODE_KINDS;
  const lines = source.split(/\r?\n/);
  const found = [];
  const push = (index, kind, axis, text, start) =>
    found.push({
      path,
      area: areaOf(path),
      line: index + 1,
      column: start + 1,
      kind,
      axis,
      text,
      context: lines[index].trim().slice(0, 160),
    });

  lines.forEach((line, index) => {
    if (path === ARMOUR_PAGE && isArmourRow(line)) {
      push(index, 'armour-row', 'table', line.split('|')[1].trim(), 0);
    }
    const claimed = [];
    for (const { id, axis, pattern } of kinds) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (claimed.some(([from, to]) => start < to && end > from)) continue;
        claimed.push([start, end]);
        push(index, id, axis, match[0], start);
        if (match[0].length === 0) pattern.lastIndex += 1;
      }
    }
  });

  return found;
}

/**
 * Groups rows by a key.
 *
 * @param {Array<object>} rows - Matches
 * @param {(row: object) => string} key - Key to group on
 * @returns {Map<string, Array<object>>} Grouped matches
 */
export function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const at = key(row);
    if (!groups.has(at)) groups.set(at, []);
    groups.get(at).push(row);
  }
  return groups;
}

/**
 * Counts by kind and by area.
 *
 * @param {Array<object>} rows - Matches
 * @returns {{total: number, files: number, byKind: Array<{id: string,
 * axis: string, count: number, files: number}>, byArea: Array<{area: string,
 * count: number, files: number}>}} Summary
 */
export function summarize(rows) {
  const tally = (groups, name) =>
    [...groups].map(([key, list]) => ({
      [name]: key,
      axis: list[0].axis,
      count: list.length,
      files: new Set(list.map((row) => row.path)).size,
    }));
  return {
    total: rows.length,
    files: new Set(rows.map((row) => row.path)).size,
    byKind: tally(groupBy(rows, (row) => row.kind), 'id'),
    byArea: tally(groupBy(rows, (row) => row.area), 'area'),
  };
}

/**
 * Content folder a path sits in.
 *
 * @param {string} path - Repo-relative path
 * @returns {string} First folder under the locale, or the area
 */
export function folderOf(path) {
  const match = path.match(/^src\/content\/[a-z]{2}\/([^/]+)/);
  return match ? match[1] : areaOf(path);
}

/**
 * Report body for one kind, grouped by folder.
 *
 * @param {string} kind - Kind id
 * @param {Array<object>} rows - Matches of that kind
 * @returns {string} Markdown section
 */
function sectionFor(kind, rows) {
  const byFolder = groupBy(rows, (row) => folderOf(row.path));
  const lines = [`## ${kind} — ${rows.length}`, ''];
  lines.push('| Folder | Count | Files |');
  lines.push('| --- | ---: | ---: |');
  for (const [folder, list] of [...byFolder].sort()) {
    lines.push(
      `| ${folder} | ${list.length} | ${new Set(list.map((row) => row.path)).size} |`,
    );
  }
  lines.push('', '| File | Line | Context |', '| --- | ---: | --- |');
  for (const row of rows) {
    const context = row.context.replaceAll('|', '\\|');
    lines.push(`| ${row.path} | ${row.line} | \`${context}\` |`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Sweeps the repo and writes the report and the row file.
 *
 * @returns {Promise<void>} Resolves once both files are written
 */
export async function main() {
  const rows = [];
  const patterns = [
    `**/*.{${EXTENSIONS.join(',')}}`,
    `.github/**/*.{${EXTENSIONS.join(',')}}`,
  ];

  for await (const entry of glob(patterns, { cwd: ROOT })) {
    const path = entry.replaceAll('\\', '/');
    if (SKIP.some((dir) => path === dir || path.includes(`${dir}/`))) continue;
    if (path.startsWith('scripts/content/audit-poise')) continue;
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    rows.push(...matchesIn(path, source));
  }

  const summary = summarize(rows);
  const byKind = groupBy(rows, (row) => row.kind);

  const head = [
    '# Poise — audit',
    '',
    `${summary.total} matches across ${summary.files} files.`,
    '',
    '| Kind | Axis | Count | Files |',
    '| --- | --- | ---: | ---: |',
    ...summary.byKind.map(
      (row) => `| ${row.id} | ${row.axis} | ${row.count} | ${row.files} |`,
    ),
    '',
    '| Area | Count | Files |',
    '| --- | ---: | ---: |',
    ...summary.byArea.map(
      (row) => `| ${row.area} | ${row.count} | ${row.files} |`,
    ),
    '',
  ].join('\n');

  const body = [...byKind]
    .map(([kind, list]) => sectionFor(kind, list))
    .join('\n');

  await mkdir(resolve(ROOT, '.ignore/reports'), { recursive: true });
  await writeFile(REPORT, `${head}\n${body}`, 'utf8');
  await writeFile(ROWS, JSON.stringify(rows, null, 2), 'utf8');

  console.log(`${summary.total} matches → ${relative(ROOT, REPORT)}`);
  for (const row of summary.byKind) console.log(`  ${row.id}: ${row.count}`);
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
