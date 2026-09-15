/**
 * @fileoverview Finds every site the Wisdom removal touches.
 * @description Intelligence becomes Wisdom and old Wisdom dies, so the sweep
 * tells the two apart per site and names the files where both meet
 *
 * @module scripts/content/audit-wisdom
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-14
 */

import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(import.meta.dirname, '../..');
const REPORT = resolve(ROOT, '.ignore/reports/wisdom-audit.md');
const ROWS = resolve(ROOT, '.ignore/reports/wisdom-audit.json');

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
 * Skills that leave Wisdom, as the manifesto lists them.
 */
export const LEAVING_SKILLS = [
  'Animal Handling',
  'Insight',
  'Medicine',
  'Perception',
  'Survival',
];

/**
 * Skills that stay with the mind stat.
 */
export const MIND_SKILLS = [
  'Arcana',
  'History',
  'Investigation',
  'Nature',
  'Religion',
];

/**
 * What a prose match is, most specific form first.
 *
 * @description Each entry claims its span before the ones after it, so a
 * skill pair is never also counted as a bare ability word
 */
export const KINDS = [
  {
    id: 'wis-skill-pair',
    axis: 'old-wisdom',
    pattern: /\bWisdom \((Animal Handling|Insight|Medicine|Perception|Survival)\)/g,
  },
  {
    id: 'wis-save',
    axis: 'old-wisdom',
    pattern:
      /\bWis(?:dom)? (?:saving throws?|saves?)\b|\bsaves? Wis(?:dom)?\b|resist #\] Wis(?:dom)?\b/g,
  },
  {
    id: 'wis-check',
    axis: 'old-wisdom',
    pattern: /\bWis(?:dom)? (?:checks?|DC \d+)\b/g,
  },
  {
    id: 'wis-primary',
    axis: 'old-wisdom',
    pattern: /(?<=primaryAbility="[^"\n]*)Wisdom(?=[^"\n]*")/g,
  },
  {
    id: 'wis-save-prof',
    axis: 'old-wisdom',
    pattern: /(?<=\bsaves="[^"\n]*)Wisdom(?=[^"\n]*")/g,
  },
  {
    id: 'wis-feat-ability',
    axis: 'old-wisdom',
    pattern: /(?<=\bability="[^"\n]*)Wisdom(?=[^"\n]*")/g,
  },
  {
    id: 'wis-heading',
    axis: 'old-wisdom',
    pattern: /(?<=^#+ [^\n]*)\bWisdom\b/g,
  },
  {
    id: 'wis-table-cell',
    axis: 'old-wisdom',
    pattern: /(?<=\| )(?:\*\*)?(?:Wisdom|WIS|Wis)(?:\*\*)?(?= \|)/g,
  },
  {
    id: 'wis-casting',
    axis: 'old-wisdom',
    pattern:
      /\bWisdom(?: is| as)?(?: your| the)? (?:spell)?casting ability\b|\b(?:spell)?casting ability (?:is|of) Wisdom\b/g,
  },
  {
    id: 'wis-instead',
    axis: 'old-wisdom',
    pattern:
      /\bWisdom(?: modifier| score)?\b[^.\n]{0,40}\binstead of\b|\binstead of\b[^.\n]{0,40}\bWisdom\b/g,
  },
  { id: 'wis-slot-score', axis: 'old-wisdom', pattern: /\bwis="[^"]*"/g },
  { id: 'wis-slot-save', axis: 'old-wisdom', pattern: /\bWis [+−-]\d+/g },
  {
    id: 'wis-bonus',
    axis: 'old-wisdom',
    pattern: /\bWisdom [+−-]\d+|[+−-]\d+ (?:to )?Wisdom\b/g,
  },
  { id: 'wis-modifier', axis: 'old-wisdom', pattern: /\bWisdom modifier\b/g },
  { id: 'wis-score', axis: 'old-wisdom', pattern: /\bWisdom score\b/g },
  { id: 'wis-abbrev', axis: 'old-wisdom', pattern: /\bWIS\b|\bWis\b/g },
  { id: 'wis-word', axis: 'old-wisdom', pattern: /\b[Ww]isdom\b/g },
  {
    id: 'int-skill-pair',
    axis: 'intelligence',
    pattern: /\bIntelligence \((Arcana|History|Investigation|Nature|Religion)\)/g,
  },
  {
    id: 'int-save',
    axis: 'intelligence',
    pattern:
      /\bInt(?:elligence)? (?:saving throws?|saves?)\b|\bsaves? Int(?:elligence)?\b|resist #\] Int(?:elligence)?\b/g,
  },
  {
    id: 'int-check',
    axis: 'intelligence',
    pattern: /\bInt(?:elligence)? (?:checks?|DC \d+)\b/g,
  },
  {
    id: 'int-primary',
    axis: 'intelligence',
    pattern: /(?<=primaryAbility="[^"\n]*)Intelligence(?=[^"\n]*")/g,
  },
  {
    id: 'int-save-prof',
    axis: 'intelligence',
    pattern: /(?<=\bsaves="[^"\n]*)Intelligence(?=[^"\n]*")/g,
  },
  {
    id: 'int-feat-ability',
    axis: 'intelligence',
    pattern: /(?<=\bability="[^"\n]*)Intelligence(?=[^"\n]*")/g,
  },
  {
    id: 'int-heading',
    axis: 'intelligence',
    pattern: /(?<=^#+ [^\n]*)\bIntelligence\b/g,
  },
  {
    id: 'int-table-cell',
    axis: 'intelligence',
    pattern: /(?<=\| )(?:\*\*)?(?:Intelligence|INT|Int)(?:\*\*)?(?= \|)/g,
  },
  {
    id: 'int-casting',
    axis: 'intelligence',
    pattern:
      /\bIntelligence(?: is| as)?(?: your| the)? (?:spell)?casting ability\b|\b(?:spell)?casting ability (?:is|of) Intelligence\b/g,
  },
  {
    id: 'int-instead',
    axis: 'intelligence',
    pattern:
      /\bIntelligence(?: modifier| score)?\b[^.\n]{0,40}\binstead of\b|\binstead of\b[^.\n]{0,40}\bIntelligence\b/g,
  },
  { id: 'int-slot-score', axis: 'intelligence', pattern: /\bint="[^"]*"/g },
  { id: 'int-slot-save', axis: 'intelligence', pattern: /\bInt [+−-]\d+/g },
  {
    id: 'int-bonus',
    axis: 'intelligence',
    pattern: /\bIntelligence [+−-]\d+|[+−-]\d+ (?:to )?Intelligence\b/g,
  },
  {
    id: 'int-modifier',
    axis: 'intelligence',
    pattern: /\bIntelligence modifier\b/g,
  },
  { id: 'int-score', axis: 'intelligence', pattern: /\bIntelligence score\b/g },
  { id: 'int-abbrev', axis: 'intelligence', pattern: /\bINT\b|\bInt\b/g },
  { id: 'int-word', axis: 'intelligence', pattern: /\b[Ii]ntelligence\b/g },
  {
    id: 'perception-passive',
    axis: 'skill',
    pattern: /\bpassive Perception\b/gi,
  },
  { id: 'perception', axis: 'skill', pattern: /\bPerception\b/g },
  { id: 'insight', axis: 'skill', pattern: /\bInsight\b/g },
  { id: 'medicine', axis: 'skill', pattern: /\bMedicine\b/g },
  { id: 'survival', axis: 'skill', pattern: /\bSurvival\b/g },
  { id: 'animal-handling', axis: 'skill', pattern: /\bAnimal Handling\b/g },
];

/**
 * What a code match is.
 */
export const CODE_KINDS = [
  { id: 'code-wisdom', axis: 'code', pattern: /wisdom/gi },
  { id: 'code-intelligence', axis: 'code', pattern: /intelligence/gi },
  { id: 'code-wis-key', axis: 'code', pattern: /\bwis\b/g },
  { id: 'code-int-key', axis: 'code', pattern: /\bint\b/g },
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
 * Every match in one file.
 *
 * @param {string} path - Repo-relative path
 * @param {string} source - File contents
 * @returns {Array<{path: string, area: string, line: number, column: number,
 * kind: string, axis: string, text: string, skill: (string|null),
 * context: string}>} Matches found
 */
export function matchesIn(path, source) {
  const kinds = isProse(path) ? KINDS : CODE_KINDS;
  const lines = source.split(/\r?\n/);
  const found = [];

  lines.forEach((line, index) => {
    const claimed = [];
    for (const { id, axis, pattern } of kinds) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (claimed.some(([from, to]) => start < to && end > from)) continue;
        claimed.push([start, end]);
        found.push({
          path,
          area: areaOf(path),
          line: index + 1,
          column: start + 1,
          kind: id,
          axis,
          text: match[0],
          skill: match[1] ?? null,
          context: line.trim().slice(0, 160),
        });
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
 * Files where old Wisdom and Intelligence both appear.
 *
 * @param {Array<object>} rows - Matches
 * @returns {Array<{path: string, oldWisdom: number, intelligence: number}>}
 * Collision files, most loaded first
 */
export function collisions(rows) {
  const byFile = groupBy(rows, (row) => row.path);
  const out = [];
  for (const [path, list] of byFile) {
    const oldWisdom = list.filter((row) => row.axis === 'old-wisdom').length;
    const intelligence = list.filter(
      (row) => row.axis === 'intelligence',
    ).length;
    if (oldWisdom > 0 && intelligence > 0) {
      out.push({ path, oldWisdom, intelligence });
    }
  }
  return out.sort(
    (a, b) => b.oldWisdom + b.intelligence - (a.oldWisdom + a.intelligence),
  );
}

/**
 * Monster mind scores side by side.
 *
 * @param {Array<object>} rows - Matches
 * @returns {Array<{path: string, int: number, wis: number, gap: number}>}
 * One entry per sheet carrying both scores, widest gap first
 */
export function monsterScores(rows) {
  const byFile = groupBy(
    rows.filter((row) => /-slot-score$/.test(row.kind)),
    (row) => row.path,
  );
  const out = [];
  for (const [path, list] of byFile) {
    const read = (kind) => {
      const row = list.find((entry) => entry.kind === kind);
      const value = row ? Number(row.text.match(/"(\d+)"/)?.[1]) : NaN;
      return Number.isFinite(value) ? value : null;
    };
    const int = read('int-slot-score');
    const wis = read('wis-slot-score');
    if (int === null || wis === null) continue;
    out.push({ path, int, wis, gap: wis - int });
  }
  return out.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
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
 * Report body for one area.
 *
 * @param {string} area - Area name
 * @param {Array<object>} rows - Matches in that area
 * @returns {string} Markdown section
 */
function sectionFor(area, rows) {
  const byFile = groupBy(rows, (row) => row.path);
  const lines = [`## ${area} — ${rows.length} in ${byFile.size} files`, ''];

  for (const [path, fileRows] of [...byFile].sort()) {
    lines.push(`### ${path} — ${fileRows.length}`, '');
    lines.push('| Line | Kind | Match | Context |');
    lines.push('| ---: | --- | --- | --- |');
    for (const row of fileRows) {
      const context = row.context.replaceAll('|', '\\|');
      lines.push(
        `| ${row.line} | ${row.kind} | \`${row.text}\` | \`${context}\` |`,
      );
    }
    lines.push('');
  }

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
    if (path.startsWith('scripts/content/audit-wisdom')) continue;
    if (path.startsWith('scripts/content/rename-wisdom')) continue;
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    rows.push(...matchesIn(path, source));
  }

  const summary = summarize(rows);
  const clash = collisions(rows);
  const scores = monsterScores(rows);
  const byArea = groupBy(rows, (row) => row.area);

  const head = [
    '# Wisdom removal — audit',
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
    `## Collisions — ${clash.length} files carry both old Wisdom and Intelligence`,
    '',
    '| File | Old Wisdom | Intelligence |',
    '| --- | ---: | ---: |',
    ...clash.map(
      (row) => `| ${row.path} | ${row.oldWisdom} | ${row.intelligence} |`,
    ),
    '',
    `## Monster mind scores — ${scores.length} sheets carry both`,
    '',
    `Wisdom above Intelligence on ${scores.filter((row) => row.gap > 0).length}, below on ${scores.filter((row) => row.gap < 0).length}, equal on ${scores.filter((row) => row.gap === 0).length}.`,
    '',
    '| Sheet | Int | Wis | Gap |',
    '| --- | ---: | ---: | ---: |',
    ...scores
      .slice(0, 40)
      .map(
        (row) =>
          `| ${basename(row.path)} | ${row.int} | ${row.wis} | ${row.gap} |`,
      ),
    '',
  ].join('\n');

  const body = [...byArea]
    .sort()
    .map(([area, list]) => sectionFor(area, list))
    .join('\n');

  await mkdir(resolve(ROOT, '.ignore/reports'), { recursive: true });
  await writeFile(REPORT, `${head}\n${body}`, 'utf8');
  await writeFile(ROWS, JSON.stringify(rows, null, 2), 'utf8');

  console.log(`${summary.total} matches → ${relative(ROOT, REPORT)}`);
  for (const row of summary.byKind) console.log(`  ${row.id}: ${row.count}`);
  console.log(`collisions: ${clash.length} files`);
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
