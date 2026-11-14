/**
 * @fileoverview Folds letters glued after a keyword into its display override, per the request of 11 Nov 2026.
 * @description Dry run by default. Pass `--apply` to write, `--out <file>` to save the report.
 * `[# kw:displace #]d` becomes `[# kw:displace;displaced #]`, so the inflected word renders whole and links the same term.
 * A glued word that is not an inflection gets a space instead.
 * A link beside a keyword to the same term loses the link and keeps its text, and a word that repeats its keyword is dropped.
 * Duplicates the rules miss are listed only.
 */

import { globSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { emit, mapLines, parseFlags, readText } from './codemod-io.mjs';

/** Content glob the codemod scans. */
export const CONTENT_GLOB = 'src/content/**/*.mdx';

/** Endings that inflect the keyword's own word. */
export const INFLECTIONS = new Set(['s', 'es', 'd', 'ed', 'ing', 'er', 'ers', 'ly']);

/** A keyword expression followed directly by letters. */
const GLUED = /\[#\s*kw:([^#]+?)\s*#\]([A-Za-z]+)/g;

/** Any keyword expression. */
const KEYWORD = /\[#\s*kw:([^#]+?)\s*#\]/g;

/**
 * Splits a keyword expression into its target and display text.
 *
 * @param {string} expression - Text between `kw:` and `#]`.
 * @returns {{ target: string, display: string, override: boolean }} Target, rendered text and whether an override exists.
 */
export function splitExpression(expression) {
  const cut = expression.indexOf(';');
  if (cut >= 0) {
    return { target: expression.slice(0, cut).trim(), display: expression.slice(cut + 1).trim(), override: true };
  }
  const target = expression.trim();
  return { target, display: target.split(':').pop().trim(), override: false };
}

/**
 * Reduces a word to a rough stem for echo matching.
 *
 * @param {string} word - Word to reduce.
 * @returns {string} Lower-case stem.
 */
function stem(word) {
  return word.toLowerCase().replace(/(ing|ed|es|s|d)$/, '');
}

/** A markdown link directly before a keyword. */
const LINK_THEN_KEYWORD = /\[([^\]]+)\]\(([^)]*)\)(\s*)(\[#\s*kw:([^#]+?)\s*#\])/g;

/** A plain word directly before a keyword. */
const WORD_THEN_KEYWORD = /\b([A-Za-z][A-Za-z-]+) (\[#\s*kw:([^#]+?)\s*#\])/g;

/** A keyword directly before a plain word. */
const KEYWORD_THEN_WORD = /(\[#\s*kw:([^#]+?)\s*#\]) ([A-Za-z][A-Za-z-]+)\b/g;

/**
 * Tells whether a word repeats the keyword's own display word.
 *
 * @param {string} word - Neighbouring word.
 * @param {string} expression - Keyword expression.
 * @returns {boolean} True when the stems match.
 */
function echoes(word, expression) {
  const own = stem(splitExpression(expression).display.split(/\s+/).pop());
  return own.length > 2 && stem(word) === own;
}

/**
 * Rewrites the glued keywords and duplicated neighbours of one line.
 * A link to the keyword's own term keeps its text and loses the link, and a word that repeats the keyword is dropped.
 *
 * @param {string} line - Line text without its separator.
 * @returns {{ line: string, hits: Array<{ rule: 'inflect' | 'space' | 'unlink' | 'echo', from: string, to: string }> }} Rewritten line and each rewrite.
 */
export function transformLine(line) {
  const hits = [];
  let next = line.replace(LINK_THEN_KEYWORD, (whole, text, url, gap, keyword, expression) => {
    const value = splitExpression(expression).target.split(':').pop().trim().toLowerCase().replace(/\s+/g, '-');
    if (!url.toLowerCase().includes(value)) {
      return whole;
    }
    const to = `${text}${gap || ' '}${keyword}`;
    hits.push({ rule: 'unlink', from: whole, to });
    return to;
  });
  next = next.replace(WORD_THEN_KEYWORD, (whole, word, keyword, expression) => {
    if (!echoes(word, expression)) {
      return whole;
    }
    hits.push({ rule: 'echo', from: whole, to: keyword });
    return keyword;
  });
  next = next.replace(KEYWORD_THEN_WORD, (whole, keyword, expression, word) => {
    if (!echoes(word, expression)) {
      return whole;
    }
    hits.push({ rule: 'echo', from: whole, to: keyword });
    return keyword;
  });
  next = next.replace(GLUED, (whole, expression, suffix) => {
    const { target, display } = splitExpression(expression);
    if (INFLECTIONS.has(suffix.toLowerCase())) {
      const to = `[# kw:${target};${display}${suffix} #]`;
      hits.push({ rule: 'inflect', from: whole, to });
      return to;
    }
    const to = `${whole.slice(0, whole.length - suffix.length)} ${suffix}`;
    hits.push({ rule: 'space', from: whole, to });
    return to;
  });
  return { line: next, hits };
}

/**
 * Lists duplications on one line: a keyword beside its own word, or a link beside a keyword to the same term.
 *
 * @param {string} line - Line text.
 * @returns {Array<{ kind: 'echo' | 'link', text: string }>} Findings with a short excerpt.
 */
export function findDuplicates(line) {
  const found = [];
  for (const match of line.matchAll(KEYWORD)) {
    const { target, display } = splitExpression(match[1]);
    const value = target.split(':').pop().trim().toLowerCase();
    const before = line.slice(0, match.index);
    const after = line.slice(match.index + match[0].length);
    const excerpt = line.slice(Math.max(0, match.index - 60), match.index + match[0].length + 30).trim();
    const own = stem(display.split(/\s+/).pop());
    const neighbours = [before.match(/([A-Za-z][A-Za-z-]+)[\s*_]*$/)?.[1], after.match(/^[\s*_]*([A-Za-z][A-Za-z-]+)/)?.[1]];
    if (own.length > 2 && neighbours.some((word) => word && stem(word) === own)) {
      found.push({ kind: 'echo', text: excerpt });
    }
    const link = before.match(/\]\(([^)]*)\)[\s*_]*$/);
    if (link && link[1].toLowerCase().includes(value.replace(/\s+/g, '-'))) {
      found.push({ kind: 'link', text: line.slice(Math.max(0, match.index - 110), match.index + match[0].length + 10).trim() });
    }
  }
  return found;
}

/**
 * Runs the codemod over a set of files.
 *
 * @param {string[]} paths - Repo-relative paths, forward slashes.
 * @param {(path: string) => string} read - File reader.
 * @returns {{ edits: Array<{ path: string, before: string, after: string }>, sites: Array<{ path: string, line: number, rule: string, from: string, to: string }>, duplicates: Array<{ path: string, line: number, kind: string, text: string }> }} Edits, rewritten sites and listed duplicates.
 */
export function run(paths, read) {
  const edits = [];
  const sites = [];
  const duplicates = [];
  for (const path of paths) {
    const before = read(path);
    if (!before.includes('kw:')) {
      continue;
    }
    const after = mapLines(before, (line, number) => {
      const result = transformLine(line);
      for (const hit of result.hits) {
        sites.push({ path, line: number, ...hit });
      }
      for (const dup of findDuplicates(result.line)) {
        duplicates.push({ path, line: number, ...dup });
      }
      return result.line;
    });
    if (after !== before) {
      edits.push({ path, before, after });
    }
  }
  return { edits, sites, duplicates };
}

/**
 * Formats the site and duplicate lists for the report.
 *
 * @param {ReturnType<typeof run>} result - Codemod result.
 * @returns {string[]} Report lines.
 */
export function describe(result) {
  return [
    `## Sites changed: ${result.sites.length}`,
    ...result.sites.map((site) => `- ${site.path}:${site.line} [${site.rule}] \`${site.from}\` → \`${site.to}\``),
    '',
    `## Duplicates left after the rules, not changed: ${result.duplicates.length}`,
    ...result.duplicates.map((dup) => `- ${dup.path}:${dup.line} [${dup.kind}] …${dup.text}…`),
  ];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const paths = globSync(CONTENT_GLOB).map((path) => path.replace(/\\/g, '/')).sort();
  const result = run(paths, readText);
  emit('codemod-keyword-shapes', result.edits, parseFlags(process.argv.slice(2)), describe(result));
}
