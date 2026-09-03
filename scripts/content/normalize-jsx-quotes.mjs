/**
 * @fileoverview Rewrites curly quotes used as JSX attribute delimiters back to
 * ASCII. Only a quote pair that opens immediately after `=` is touched, so
 * curly quotes in prose and in blockquotes are left alone. Language models
 * emit these sporadically and no prompt reliably stops them, so this runs as a
 * post-step over generated MDX.
 *
 *   node scripts/content/normalize-jsx-quotes.mjs <glob-or-path>...
 *   node scripts/content/normalize-jsx-quotes.mjs --check <glob-or-path>...
 */

import { globSync } from 'node:fs';
import { readFileSync, writeFileSync } from 'node:fs';

const DOUBLE = /=[“”]([^“”\n]*)[“”]/g;
const SINGLE = /=[‘’]([^‘’\n]*)[‘’]/g;

/**
 * The text with attribute delimiters normalised, and how many were changed.
 *
 * @param {string} text - File contents.
 * @returns {{ text: string, count: number }} Result.
 */
export function normalize(text) {
  let count = 0;
  const tally = () => {
    count += 1;
  };
  const out = text
    .replace(DOUBLE, (_m, inner) => {
      tally();
      return '="' + inner + '"';
    })
    .replace(SINGLE, (_m, inner) => {
      tally();
      return "='" + inner + "'";
    });
  return { text: out, count };
}

const args = process.argv.slice(2);
const check = args.includes('--check');
const patterns = args.filter((arg) => arg !== '--check');

if (patterns.length === 0) {
  console.error('usage: normalize-jsx-quotes.mjs [--check] <glob-or-path>...');
  process.exit(2);
}

const files = patterns.flatMap((pattern) =>
  pattern.includes('*') ? globSync(pattern) : [pattern],
);

let touched = 0;
let total = 0;

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const { text, count } = normalize(before);
  if (count === 0) continue;
  touched += 1;
  total += count;
  console.log(`${count === 1 ? ' 1' : String(count).padStart(2)}  ${file}`);
  if (!check) writeFileSync(file, text);
}

console.log(
  `${check ? 'would fix' : 'fixed'} ${total} attribute${total === 1 ? '' : 's'} in ${touched} file${touched === 1 ? '' : 's'}`,
);
process.exit(check && total > 0 ? 1 : 0);
