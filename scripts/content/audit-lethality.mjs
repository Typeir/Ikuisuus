/**
 * @fileoverview Finds every written trace of Challenge Rating across the repo.
 * @description Lethality replaces Challenge Rating, so the rename has to see
 * prose, slot props, identifiers and external schema keys apart from each other
 *
 * @module scripts/content/audit-lethality
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 */

import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const REPORT = resolve(ROOT, '.ignore/reports/lethality-audit.md');

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
];

/**
 * File extensions the sweep reads.
 */
const EXTENSIONS = [
  'mdx',
  'md',
  'ts',
  'tsx',
  'mjs',
  'js',
  'json',
  'scss',
  'yml',
];

/**
 * What a match is, most specific form first.
 *
 * @description Each entry claims a match before the ones after it, so a
 * `challengeRating` identifier is never also counted as bare `challenge`
 */
const KINDS = [
  { kind: 'challenge-rating-prose', pattern: /challenge\s+rating/gi },
  { kind: 'challenge-identifier', pattern: /challengeRating|ChallengeRating/g },
  { kind: 'challenge-word', pattern: /\bchallenges?\b/gi },
  { kind: 'cr-upper', pattern: /\bCR\b/g },
  { kind: 'cr-lower', pattern: /\bcr\b/g },
];

/**
 * Area a path belongs to.
 *
 * @param {string} path - Repo-relative path
 * @returns {string} Area name
 */
function areaOf(path) {
  if (path.startsWith('src/content/')) return 'content';
  if (path.startsWith('src/')) return 'src';
  if (path.startsWith('foundry/')) return 'foundry';
  if (path.startsWith('scripts/')) return 'scripts';
  if (path.startsWith('tests/')) return 'tests';
  if (path.startsWith('.github/')) return 'docs';
  return 'other';
}

/**
 * Every match in one file.
 *
 * @param {string} path - Repo-relative path
 * @param {string} source - File contents
 * @returns {Array<{path: string, area: string, line: number, kind: string,
 * text: string, context: string}>} Matches found
 */
function matchesIn(path, source) {
  const lines = source.split(/\r?\n/);
  const found = [];

  lines.forEach((line, index) => {
    const claimed = [];
    for (const { kind, pattern } of KINDS) {
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
          kind,
          text: match[0],
          context: line.trim().slice(0, 160),
        });
      }
    }
  });

  return found;
}

/**
 * Groups matches by a key.
 *
 * @param {Array<object>} rows - Matches
 * @param {(row: object) => string} key - Key to group on
 * @returns {Map<string, Array<object>>} Grouped matches
 */
function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const at = key(row);
    if (!groups.has(at)) groups.set(at, []);
    groups.get(at).push(row);
  }
  return groups;
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
 * Sweeps the repo and writes the report.
 *
 * @returns {Promise<void>} Resolves once the report is written
 */
async function main() {
  const rows = [];
  const patterns = [
    `**/*.{${EXTENSIONS.join(',')}}`,
    `.github/**/*.{${EXTENSIONS.join(',')}}`,
  ];

  for await (const entry of glob(patterns, { cwd: ROOT })) {
    const path = entry.replaceAll('\\', '/');
    if (SKIP.some((dir) => path === dir || path.includes(`${dir}/`))) continue;
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    rows.push(...matchesIn(path, source));
  }

  const byKind = groupBy(rows, (row) => row.kind);
  const byArea = groupBy(rows, (row) => row.area);

  const head = [
    '# Lethality rename — audit',
    '',
    `${rows.length} matches across ${groupBy(rows, (row) => row.path).size} files.`,
    '',
    '| Kind | Count |',
    '| --- | ---: |',
    ...[...byKind].map(([kind, list]) => `| ${kind} | ${list.length} |`),
    '',
    '| Area | Count |',
    '| --- | ---: |',
    ...[...byArea].map(([area, list]) => `| ${area} | ${list.length} |`),
    '',
  ].join('\n');

  const body = [...byArea]
    .sort()
    .map(([area, list]) => sectionFor(area, list))
    .join('\n');

  await mkdir(resolve(ROOT, '.ignore/reports'), { recursive: true });
  await writeFile(REPORT, `${head}\n${body}`, 'utf8');

  console.log(`${rows.length} matches → ${relative(ROOT, REPORT)}`);
  for (const [kind, list] of byKind) console.log(`  ${kind}: ${list.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
