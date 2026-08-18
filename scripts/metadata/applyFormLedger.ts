/**
 * @fileoverview Apply curated form ledger to spell frontmatter.
 * @description Reads form-analysis-curated.md and syncs form: aspects; ledger is source of truth.
 *
 * @module scripts/metadata/applyFormLedger
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import matter from 'gray-matter';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LEDGER = path.join(ROOT, '.ignore', 'form-analysis-curated.md');
const SPELLS = path.join(ROOT, 'src', 'content', 'en', 'spells');
const SHARED = path.join(ROOT, 'scripts', 'core', 'shared-data.json');

/**
 * Parse ledger table; skip none/— rows.
 *
 * @param {string} text - Ledger markdown
 * @returns {Map<string, string[]>} slug → forms
 */
function parseLedger(text: string): Map<string, string[]> {
  const rows = new Map<string, string[]>();
  let inTable = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('## Assignments')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    const m = /^\| ([a-z0-9-]+) \| ([^|]*)\|/.exec(line);
    if (!m || m[1] === 'spell') continue;
    const forms = m[2]
      .split(/\s+/)
      .map((f) => f.trim())
      .filter((f) => f && f !== 'none' && f !== '—');
    rows.set(m[1], forms);
  }
  return rows;
}

/**
 * Serialises a frontmatter object back into the file, preserving key order.
 *
 * @param {string} file - Spell path
 * @param {Record<string, unknown>} data - Frontmatter
 * @param {string} content - Body
 */
function write(file: string, data: Record<string, unknown>, content: string): void {
  writeFileSync(file, matter.stringify(content, data, { lineWidth: -1 } as never), 'utf8');
}

const dry = process.argv.includes('--dry');
const vocab = new Set<string>(
  (JSON.parse(readFileSync(SHARED, 'utf8')) as { aspects: { form: { values: string[] } } })
    .aspects.form.values,
);
const ledger = parseLedger(readFileSync(LEDGER, 'utf8'));

let written = 0;
let unchanged = 0;
let skipped = 0;
const unknown: string[] = [];

for (const [slug, forms] of ledger) {
  const file = path.join(SPELLS, `${slug}.mdx`);
  if (!existsSync(file)) {
    skipped++;
    continue;
  }
  for (const f of forms) if (!vocab.has(f)) unknown.push(`${slug}:${f}`);

  const raw = readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const current = Array.isArray(data.aspects)
    ? (data.aspects as unknown[]).filter((a): a is string => typeof a === 'string')
    : [];
  const kept = current.filter((a) => !a.startsWith('form:'));
  const wanted = forms.filter((f) => vocab.has(f)).map((f) => `form:${f}`);
  const next = [...wanted, ...kept];
  const same =
    next.length === current.length && next.every((a, i) => a === current[i]);
  if (same) {
    unchanged++;
    continue;
  }
  if (next.length) data.aspects = next;
  else delete data.aspects;
  written++;
  if (!dry) write(file, data, parsed.content);
}

console.log(
  JSON.stringify(
    { dry, rows: ledger.size, written, unchanged, skipped, unknown },
    null,
    2,
  ),
);
