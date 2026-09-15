/**
 * @fileoverview Rewrites forced-movement prose into the displacement register.
 * @description Poise charges forced movement by the stride, so every site
 * reads "displaced [= N stride =] {direction}" with a direction from a closed
 * set; a site whose direction the line does not state is left alone and listed
 *
 * @module scripts/content/rewrite-displacement
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-15
 */

import { glob, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(import.meta.dirname, '../..');

/**
 * Where the codemod reads.
 */
const PATTERNS = ['src/content/**/*.mdx', 'tests/fixtures/**/*.mdx'];

/**
 * The object of an active push, pull, shove or hurl.
 */
const OBJECT = String.raw`( (?:the |a |that |each |one |any )?(?:\[# kw:[^\]]+ #\] )?(?:[a-z-]+ )?(?:creatures?|targets?|objects?|it|them|you))?`;

/**
 * The verb phrase, its qualifier and the distance.
 *
 * @description Group 1 is a bold opener glued to the verb, 2 the verb, 3 an
 * adverb after it, 4 the object of an active verb, 5 the qualifier, 6 the
 * stride macro
 */
const SPAN = new RegExp(
  String.raw`(\*\*)?\b(pushed|pulled|hurled|flung|dragged|shoved|launched|thrown|pushes|push|pulls|pull|shoves|shove|hurls|hurl)(?: (back|outward|away|up(?! to)))?${OBJECT}(?: ?\*\*)?( ?(?:only )?up to| to)?(?: ?\*\*)? ?(\[= \d+ stride =\])(?:\*\*)?`,
  'g',
);

/**
 * Clauses about resisting displacement, rewritten on every line.
 */
const RESIST = [
  [/\*\*pushed\*\*, \*\*pulled\*\*, or \*\*knocked\b/g, '**displaced** or **knocked'],
  [/\bpushed, pulled, or knocked\b/g, 'displaced or knocked'],
  [/\bpushed, pulled, knocked\b/g, 'displaced, knocked'],
  [/\bpushed or pulled\b/g, 'displaced'],
  [/\bmoved, pushed,/g, 'displaced,'],
];

/**
 * Where a direction phrase ends.
 */
const STOP = String.raw`(?=,|\.|;|\)| \(|\*\*| and | by | in a | in an | as | that | if | or | unless | until | while | when | before | after | then |$)`;

/**
 * The closed direction set, each read off the line after the distance.
 */
export const DIRECTIONS = [
  {
    id: 'away',
    pattern: new RegExp(
      String.raw`^\s*(?:\*\*)?\s*(?:in a straight line )?(?:directly |straight )?away(?:\*\*)? from (.+?)${STOP}`,
    ),
    render: (source) => `away from ${source}`,
  },
  {
    id: 'toward',
    pattern: new RegExp(
      String.raw`^\s*(?:\*\*)?\s*(?:in a straight line )?(?:directly |straight )?towards?(?:\*\*)? (.+?)${STOP}`,
    ),
    render: (source) => `toward ${source}`,
  },
  {
    id: 'closer',
    pattern: new RegExp(
      String.raw`^\s*(?:\*\*)?\s*closer(?:\*\*)? to (.+?)${STOP}`,
    ),
    render: (source) => `toward ${source}`,
  },
  {
    id: 'choice',
    pattern: new RegExp(
      String.raw`^\s*(?:\*\*)?\s*(?:in a straight line )?in (?:a|any) direction of (?:(.+?)(?:'s|’s|s') choos(?:ing|e)|(your|its|their|his|her|my) (?:choice|choosing))\b`,
    ),
    render: (chooser, owner) =>
      chooser
        ? `in a direction of ${chooser}'s choice`
        : `in a direction of ${owner} choice`,
  },
  {
    id: 'random',
    pattern: /^\s*(?:\*\*)?\s*in a random direction/,
    render: () => 'in a random direction',
  },
  {
    id: 'upward',
    pattern: /^\s*(?:\*\*)?\s*(?:straight )?(?:into the air|upwards?|up)\b/,
    render: () => 'upward',
  },
  {
    id: 'away-bare',
    pattern: /^\s*(?:\*\*)?\s*(?:directly |straight )?(?:away|back)\b/,
    render: () => 'away',
  },
];

/**
 * Tails on a converted line that still say push.
 */
const RESIDUALS = [
  [/\bnot pushed\b/g, 'not displaced'],
  [/\bneither pushed nor\b/g, 'neither displaced nor'],
  [/\bnor pushed\b/g, 'nor displaced'],
  [/\bno push\b/g, 'no displacement'],
];

/**
 * Reads the direction that follows a distance.
 *
 * @param {string} tail - Text after the stride macro
 * @returns {({id: string, length: number, text: string}|null)} The direction
 * and how much of the tail it consumed, or null when none is stated
 */
export function readDirection(tail, consumed = true) {
  for (const { id, pattern, render } of DIRECTIONS) {
    const match = tail.match(pattern);
    if (!match) continue;
    return {
      id,
      length: match[0].length,
      text: render(match[1]?.trim(), match[2]),
      consumed,
    };
  }
  return null;
}

/**
 * Whether bold markers still pair up on a line.
 *
 * @param {string} line - A line of MDX
 * @returns {boolean} True when the count of `**` is even
 */
function boldBalanced(line) {
  return (line.match(/\*\*/g) ?? []).length % 2 === 0;
}

/**
 * Rewrites every forced-movement span on one line.
 *
 * @param {string} line - Line before
 * @returns {{line: string, changed: number, left: Array<{text: string,
 * reason: string}>}} Line after, how many spans moved to the register, and
 * the spans left alone with the reason
 */
export function rewriteLine(line) {
  const left = [];
  let changed = 0;
  let out = '';
  let cursor = 0;

  SPAN.lastIndex = 0;
  let match;
  while ((match = SPAN.exec(line)) !== null) {
    const [span, , verb, adverb, object, upTo, macro] = match;
    const start = match.index;
    const end = start + span.length;
    const direction =
      readDirection(line.slice(end)) ??
      (adverb ? readDirection(` ${adverb}`, false) : null);
    if (!direction) {
      left.push({ text: span, reason: 'no direction on the line' });
      continue;
    }
    const active = /^(?:push|pushes|pull|pulls|shove|shoves|hurl|hurls)$/.test(verb);
    const head = active
      ? `displace${verb.endsWith('s') ? 's' : ''}${object ?? ''}`
      : `displaced${object ?? ''}`;
    const qualifier = upTo && /up to/.test(upTo) ? ' up to' : '';
    const replacement = `${head}${qualifier} ${macro} ${direction.text}`;
    out += line.slice(cursor, start) + replacement;
    cursor = end + (direction.consumed ? direction.length : 0);
    if (match[1] && line.startsWith('**', cursor)) cursor += 2;
    changed += 1;
  }
  out += line.slice(cursor);

  if (changed > 0 && !boldBalanced(out)) {
    return { line, changed: 0, left: [{ text: line.trim(), reason: 'bold span' }] };
  }
  if (changed > 0) {
    out = RESIDUALS.reduce(
      (carry, [pattern, replacement]) => carry.replace(pattern, replacement),
      out,
    );
  }
  const resisted = RESIST.reduce(
    (carry, [pattern, replacement]) => carry.replace(pattern, replacement),
    out,
  );
  if (resisted !== out) {
    out = resisted;
    changed += 1;
  }
  return { line: out, changed, left };
}

/**
 * Rewrites one file's text.
 *
 * @param {string} text - File text
 * @returns {{text: string, changed: number, left: Array<{line: number,
 * text: string, reason: string}>}} Text after, spans changed, spans left alone
 */
export function rewrite(text) {
  const left = [];
  const diffs = [];
  let changed = 0;
  const lines = text.split('\n').map((line, index) => {
    const outcome = rewriteLine(line);
    changed += outcome.changed;
    for (const entry of outcome.left) left.push({ line: index + 1, ...entry });
    if (outcome.changed > 0) {
      diffs.push({ line: index + 1, before: line.trim(), after: outcome.line.trim() });
    }
    return outcome.line;
  });
  return { text: lines.join('\n'), changed, left, diffs };
}

/**
 * Sweeps the corpus and reports what it left behind.
 *
 * @returns {Promise<void>} Resolves once every changed file is written
 */
export async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const show = process.argv.includes('--show');
  const changed = [];
  const left = [];
  let spans = 0;

  for await (const entry of glob(PATTERNS, { cwd: ROOT })) {
    const path = entry.replaceAll('\\', '/');
    const source = await readFile(resolve(ROOT, entry), 'utf8');
    const outcome = rewrite(source);
    for (const row of outcome.left) {
      left.push(`${path}:${row.line} [${row.reason}] ${row.text.slice(0, 100)}`);
    }
    if (outcome.text === source) continue;
    spans += outcome.changed;
    changed.push(`${path} (${outcome.changed})`);
    if (show) {
      for (const diff of outcome.diffs) {
        console.log(`${path}:${diff.line}\n  - ${diff.before}\n  + ${diff.after}`);
      }
    }
    if (!dryRun) await writeFile(resolve(ROOT, entry), outcome.text, 'utf8');
  }

  console.log(
    `${dryRun ? 'Would rewrite' : 'Rewrote'} ${spans} spans in ${changed.length} files`,
  );
  for (const path of changed) console.log(`  ${path}`);
  console.log(`\nLeft alone, ${left.length} spans:`);
  for (const line of left) console.log(`  ${line}`);
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
