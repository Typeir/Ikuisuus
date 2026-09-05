/**
 * @fileoverview Wraps bare condition words in their keyword. `poisoned`
 * becomes `[# kw:condition:poisoned #]`, casing kept, so a capitalised word
 * at the head of a sentence displays as authored. Only the unambiguous
 * condition words are touched — the ones with no everyday sense in prose.
 * A burning horse or a dying breath is left alone, and `check-stale-prose`
 * reports those separately for a reader.
 *
 * Skips headings (they define keywords, they do not reference them),
 * frontmatter, fenced code, words already inside a keyword or a link's text,
 * and the term inside a `[# kw:… #]` that names the word itself.
 *
 *   node scripts/content/link-bare-conditions.mjs src/content/en/spells --check
 *   node scripts/content/link-bare-conditions.mjs src/content/en/spells
 */

import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Condition words with no everyday sense in prose. Mirrors the legacy set in
 * `check-stale-prose.mjs`; the ambiguous ones are deliberately absent.
 */
export const CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'staggered',
  'stunned',
  'suffocating',
  'terrified',
  'unconscious',
  'unsteady',
];

const WORD = new RegExp(`\\b(${CONDITIONS.join('|')})\\b`, 'gi');

/**
 * Whether an index in a line sits inside a span that must not be rewritten:
 * a keyword block, a link's text or target, or inline code.
 *
 * @param {string} line - The line
 * @param {number} index - Match index
 * @returns {boolean} True when the match is protected
 */
function isProtected(line, index) {
  const before = line.slice(0, index);
  const after = line.slice(index);

  const openKw = before.lastIndexOf('[#');
  if (openKw !== -1 && before.indexOf('#]', openKw) === -1) return true;

  const openLink = before.lastIndexOf('[');
  if (openLink !== -1 && before.indexOf(']', openLink) === -1) {
    if (/^[^\]]*\]\(/.test(after)) return true;
  }
  if (/^[^)]*\)/.test(after) && before.lastIndexOf('](') > before.lastIndexOf(')')) {
    return true;
  }

  const ticks = (before.match(/`/g) ?? []).length;
  if (ticks % 2 === 1) return true;

  return false;
}

/**
 * Whether a line is one the linker never edits.
 *
 * @param {string} line - The line
 * @param {{ inFrontmatter: boolean, inFence: boolean }} state - Block state
 * @returns {boolean} True when the line is skipped whole
 */
function isSkippedLine(line, state) {
  return state.inFrontmatter || state.inFence || /^\s*#{1,6}\s/.test(line);
}

/**
 * Text with bare condition words wrapped, and how many were wrapped.
 *
 * @param {string} text - File contents
 * @returns {{ text: string, count: number, changes: Array<{line: number, word: string}> }} Result
 */
export function linkConditions(text) {
  const lines = text.split(/\r?\n/);
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const state = { inFrontmatter: false, inFence: false };
  const changes = [];

  const out = lines.map((line, index) => {
    if (index === 0 && line.trim() === '---') {
      state.inFrontmatter = true;
      return line;
    }
    if (state.inFrontmatter) {
      if (line.trim() === '---') state.inFrontmatter = false;
      return line;
    }
    if (/^\s*```/.test(line)) {
      state.inFence = !state.inFence;
      return line;
    }
    if (isSkippedLine(line, state)) return line;

    return line.replace(WORD, (word, _group, offset) => {
      if (isProtected(line, offset)) return word;
      changes.push({ line: index + 1, word });
      return `[# kw:condition:${word} #]`;
    });
  });

  return { text: out.join(eol), count: changes.length, changes };
}

/**
 * Expands paths and globs into MDX files.
 *
 * @param {string[]} inputs - Paths, directories or globs
 * @returns {string[]} MDX file paths, sorted and unique
 */
function resolveFiles(inputs) {
  const out = new Set();
  for (const input of inputs) {
    if (input.includes('*')) {
      globSync(input).forEach((file) => out.add(file));
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(input).isDirectory();
    } catch {
      continue;
    }
    if (isDir) globSync(join(input, '**', '*.mdx')).forEach((f) => out.add(f));
    else out.add(input);
  }
  return [...out].sort();
}

/**
 * Standalone entry point.
 */
function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const inputs = args.filter((arg) => !arg.startsWith('--'));
  if (inputs.length === 0) {
    console.error('usage: link-bare-conditions.mjs [--check] <path|glob>...');
    process.exit(2);
  }

  let files = 0;
  let total = 0;
  for (const file of resolveFiles(inputs)) {
    const before = readFileSync(file, 'utf8');
    const { text, count, changes } = linkConditions(before);
    if (count === 0) continue;
    files += 1;
    total += count;
    console.log(`${String(count).padStart(3)}  ${file}`);
    if (check) {
      for (const change of changes) {
        console.log(`       :${change.line}  ${change.word}`);
      }
    } else {
      writeFileSync(file, text);
    }
  }
  console.log(
    `${check ? 'would wrap' : 'wrapped'} ${total} condition word${total === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'}`,
  );
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  main();
}
