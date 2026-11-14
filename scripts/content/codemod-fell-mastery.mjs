/**
 * @fileoverview Renames the Topple mastery to Fell, per the ruling of 11 Nov 2026.
 * @description Dry run by default. Pass `--apply` to write, `--out <file>` to save the report.
 * Only sites that name the mastery change. Feature headings and plain English stay and are listed.
 */

import { globSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { emit, mapLines, parseFlags, readText } from './codemod-io.mjs';

/** Content glob the codemod scans. */
export const CONTENT_GLOB = 'src/content/**/*.mdx';

/** Game data file that lists the masteries for the metadata extractors. */
export const SHARED_DATA = 'scripts/core/shared-data.json';

/**
 * Rewrite rules, applied to each line in order.
 *
 * @type {ReadonlyArray<{ id: string, label: string, regex: RegExp, replace: string, appliesTo: (path: string, line: string) => boolean }>}
 */
export const RULES = [
  {
    id: 'keyword',
    label: 'frontmatter keyword `topple: Masteries`',
    regex: /^(\s*-\s*)topple(\s*:\s*Masteries\s*)$/,
    replace: '$1fell$2',
    appliesTo: (path) => path.endsWith('.mdx'),
  },
  {
    id: 'prop',
    label: 'component prop `mastery="Topple"`',
    regex: /\bmastery="Topple"/g,
    replace: 'mastery="Fell"',
    appliesTo: (path) => path.endsWith('.mdx'),
  },
  {
    id: 'table-cell',
    label: 'table cell naming the mastery',
    regex: /(\|\s*|,\s*)Topple(?=\s*[,|])/g,
    replace: '$1Fell',
    appliesTo: (path, line) => path.endsWith('.mdx') && line.trimStart().startsWith('|'),
  },
  {
    id: 'prose',
    label: 'prose `the Topple mastery`',
    regex: /\b(the\s+)(\*\*|_)?Topple(\*\*|_)?(\s+mastery)/g,
    replace: '$1$2Fell$3$4',
    appliesTo: (path) => path.endsWith('.mdx'),
  },
  {
    id: 'link',
    label: 'link text `[_Topple_](…#masteries)`',
    regex: /\[_Topple_\](\([^)]*#masteries\))/g,
    replace: '[_Fell_]$1',
    appliesTo: (path) => path.endsWith('.mdx'),
  },
  {
    id: 'data',
    label: 'shared-data mastery list entry',
    regex: /^(\s*)"topple"(,?)(\s*)$/,
    replace: '$1"fell"$2$3',
    appliesTo: (path) => path === SHARED_DATA,
  },
];

/** Any remaining form of the word, mastery or English. */
const RESIDUAL = /\btoppl(e|es|ed|ing)\b/gi;

/**
 * Rewrites one line and records which rules fired.
 *
 * @param {string} path - Repo-relative file path, forward slashes.
 * @param {string} line - Line text without its separator.
 * @returns {{ line: string, hits: string[] }} Rewritten line and fired rule ids, one per replacement.
 */
export function transformLine(path, line) {
  const hits = [];
  let next = line;
  for (const rule of RULES) {
    if (!rule.appliesTo(path, next)) {
      continue;
    }
    next = next.replace(rule.regex, (...args) => {
      hits.push(rule.id);
      const groups = args.slice(1, -2);
      return rule.replace.replace(/\$(\d)/g, (_, n) => groups[Number(n) - 1] ?? '');
    });
  }
  return { line: next, hits };
}

/**
 * Lists every form of "topple" a rewritten line still holds.
 *
 * @param {string} line - Rewritten line.
 * @returns {string[]} Matched words.
 */
export function residualWords(line) {
  return [...line.matchAll(RESIDUAL)].map((match) => match[0]);
}

/**
 * Runs the codemod over a set of files.
 *
 * @param {string[]} paths - Repo-relative paths, forward slashes.
 * @param {(path: string) => string} read - File reader.
 * @returns {{ edits: Array<{ path: string, before: string, after: string }>, sites: Array<{ path: string, line: number, rule: string }>, residual: Array<{ path: string, line: number, words: string[], text: string }> }} Edits, changed sites and untouched forms.
 */
export function run(paths, read) {
  const edits = [];
  const sites = [];
  const residual = [];
  for (const path of paths) {
    const before = read(path);
    if (!/toppl/i.test(before)) {
      continue;
    }
    const after = mapLines(before, (line, number) => {
      const result = transformLine(path, line);
      for (const rule of result.hits) {
        sites.push({ path, line: number, rule });
      }
      const words = residualWords(result.line);
      if (words.length > 0) {
        residual.push({ path, line: number, words, text: result.line.trim() });
      }
      return result.line;
    });
    edits.push({ path, before, after });
  }
  return { edits, sites, residual };
}

/**
 * Formats the site and residual lists for the report.
 *
 * @param {ReturnType<typeof run>} result - Codemod result.
 * @returns {string[]} Report lines.
 */
export function describe(result) {
  const byRule = RULES.map((rule) => {
    const count = result.sites.filter((site) => site.rule === rule.id).length;
    return `- ${rule.id} (${rule.label}): ${count}`;
  });
  const sites = result.sites.map((site) => `- ${site.path}:${site.line} [${site.rule}]`);
  const residual = result.residual.map((hit) => {
    const text = hit.text.length > 160 ? `${hit.text.slice(0, 157)}…` : hit.text;
    return `- ${hit.path}:${hit.line} (${hit.words.join(', ')}): ${text}`;
  });
  return [
    `## Sites changed: ${result.sites.length}`,
    ...byRule,
    '',
    ...sites,
    '',
    `## Untouched forms: ${result.residual.length}`,
    ...residual,
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const paths = [...globSync(CONTENT_GLOB).map((path) => path.replace(/\\/g, '/')), SHARED_DATA].sort();
  const result = run(paths, readText);
  emit('codemod-fell-mastery', result.edits, parseFlags(process.argv.slice(2)), describe(result));
}
