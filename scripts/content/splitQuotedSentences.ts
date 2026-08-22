/**
 * Blockquote sentence splitter
 *
 * @fileoverview Breaks long multi-sentence blockquote lines into one line per
 * sentence, reusing the source line's quote prefix so nesting depth survives.
 * Intermediate lines carry no hard break, so a split paragraph still renders as
 * one paragraph; the original trailing whitespace rides on the final segment.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/splitQuotedSentences.ts
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/splitQuotedSentences.ts --apply
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/splitQuotedSentences.ts --min=200 src/content/en
 *
 * @module scripts/content/splitQuotedSentences
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Quote marker plus any following space, repeated for nesting depth. */
const REGEX_QUOTE_PREFIX = /^((?:>[ \t]?)+)/;

/** Sentence boundary: a period, then space, then an opening character. */
const REGEX_SENTENCE_SPLIT = /(?<=\.)[ \t]+(?=[A-Z"'\[*_(])/;

/** Header slots and structural rows that hold no prose. */
const REGEX_STRUCTURAL = /^\*\*(Casting Time|Components|Duration|Range|Targets)\*\*:|^\||^#{1,6}\s|^-{3,}$/;

/** An ordered or bulleted list marker, whose period never ends a sentence. */
const REGEX_LIST_MARKER = /^(?:\d+\.|[-*+])$/;

/** Abbreviations whose period never ends a sentence. */
const ABBREVIATIONS = new Set(['e.g.', 'i.e.', 'mr.', 'mrs.', 'ms.', 'dr.', 'vs.', 'st.', 'cf.', 'etc.']);

/**
 * Splits blockquote content into sentences, rejoining any split that lands
 * directly after an abbreviation or a bare list marker.
 *
 * @param {string} content - Blockquote line content, prefix removed
 * @returns {string[]} One entry per sentence
 */
function splitSentences(content: string): string[] {
  const parts = content.split(REGEX_SENTENCE_SPLIT);
  const merged: string[] = [];
  for (const part of parts) {
    const previous = merged[merged.length - 1];
    const lastWord = previous?.split(/\s+/).pop()?.toLowerCase() ?? '';
    if (
      previous !== undefined &&
      (ABBREVIATIONS.has(lastWord) || REGEX_LIST_MARKER.test(previous.trim()))
    ) {
      merged[merged.length - 1] = `${previous} ${part}`;
      continue;
    }
    merged.push(part);
  }
  return merged;
}

/**
 * Rewrites one file's blockquote lines.
 *
 * @param {string} raw - File contents
 * @param {number} minLength - Only lines at least this long are split
 * @returns {{ text: string; splits: number }} Rewritten text and split count
 */
function rewrite(raw: string, minLength: number): { text: string; splits: number } {
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  let splits = 0;

  for (const line of lines) {
    const prefixMatch = line.match(REGEX_QUOTE_PREFIX);
    if (!prefixMatch) {
      out.push(line);
      continue;
    }

    const prefix = prefixMatch[1];
    const rest = line.slice(prefix.length);
    const trailing = rest.match(/[ \t]*$/)?.[0] ?? '';
    const content = rest.slice(0, rest.length - trailing.length);

    if (
      content.length === 0 ||
      line.length < minLength ||
      REGEX_STRUCTURAL.test(content)
    ) {
      out.push(line);
      continue;
    }

    const sentences = splitSentences(content);
    if (sentences.length < 2) {
      out.push(line);
      continue;
    }

    sentences.forEach((sentence, index) => {
      const isLast = index === sentences.length - 1;
      out.push(`${prefix}${sentence}${isLast ? trailing : ''}`);
    });
    splits += sentences.length - 1;
  }

  return { text: out.join(eol), splits };
}

/**
 * Recursively lists MDX files beneath a path.
 *
 * @param {string} target - File or directory path
 * @returns {Promise<string[]>} MDX file paths
 */
async function collect(target: string): Promise<string[]> {
  const stat = await fs.stat(target);
  if (stat.isFile()) return target.endsWith('.mdx') ? [target] : [];

  const entries = await fs.readdir(target, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) return collect(full);
      return Promise.resolve(entry.name.endsWith('.mdx') ? [full] : []);
    }),
  );
  return nested.flat();
}

/**
 * Entry point.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const minArg = args.find((a) => a.startsWith('--min='));
  const minLength = minArg ? Number(minArg.split('=')[1]) : 140;
  const roots = args.filter((a) => !a.startsWith('--'));
  const targets = roots.length ? roots : ['src/content/en/spells'];

  const files = (await Promise.all(targets.map(collect))).flat();
  let changedFiles = 0;
  let totalSplits = 0;

  for (const file of files) {
    const before = await fs.readFile(file, 'utf8');
    const { text, splits } = rewrite(before, minLength);
    if (splits === 0 || text === before) continue;

    changedFiles += 1;
    totalSplits += splits;
    if (apply) await fs.writeFile(file, text, 'utf8');
    else process.stdout.write(`${path.relative(process.cwd(), file)}  (+${splits})\n`);
  }

  process.stdout.write(
    `${apply ? 'split' : 'would split'} ${totalSplits} line(s) across ${changedFiles} file(s) (min ${minLength})\n`,
  );
  if (!apply) process.stdout.write('re-run with --apply to write\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
