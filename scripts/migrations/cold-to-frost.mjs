#!/usr/bin/env node
// Migration: rename the "Cold" damage type to "Frost" across content.
//
// Renames ONLY damage-type occurrences of cold/Cold. Leaves untouched:
//   - adjectival / flavour cold  ("cold air", "cold light", "burns cold", "the cold of the void")
//   - weather / temperature cold (control-weather's "| Cold |", "Arctic cold", "heat or cold")
// Case is preserved: cold -> frost, Cold -> Frost.
//
// Usage:
//   node scripts/migrations/cold-to-frost.mjs                       # dry run (report only)
//   node scripts/migrations/cold-to-frost.mjs --apply               # write changes
//   node scripts/migrations/cold-to-frost.mjs --root src/content    # override target dir
//   node scripts/migrations/cold-to-frost.mjs --report <file>       # write full report to a file
//
// A migration is applied by matching one of the rules below. Everything the rules
// do NOT touch is listed under "UNMATCHED (left as-is — review)" so a human can
// confirm no damage-type use was missed and no flavour use was caught.

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => (argv.indexOf(f) >= 0 ? argv[argv.indexOf(f) + 1] : d);

const APPLY = has('--apply');
const ROOT = val('--root', 'src/content');
const REPORT = val('--report', null);

// Damage-type words that, when list-adjacent to "cold", prove it is a type list.
const TYPES = [
  'chemical', 'fire', 'lightning', 'poison', 'bludgeoning', 'slashing', 'piercing',
  'psychic', 'holy', 'dark', 'force', 'frost', 'acid', 'thunder', 'radiant', 'necrotic',
];
const TYPE = TYPES.join('|');
const SEP = String.raw`(?:\*{0,2}\s*,\s*\*{0,2}|\*{0,2}\s+(?:or|and)\s+\*{0,2})`; // comma/or/and, tolerating **bold**

const frost = (token) => (token[0] === 'C' ? 'Frost' : 'frost');

// Walk ROOT for .md / .mdx files.
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.mdx?$/.test(name)) acc.push(p);
  }
  return acc;
}

// Apply every rule to one line. Returns { text, hits: [{rule, before, after}] }.
function migrateLine(line, rel) {
  const hits = [];
  let s = line;

  // R5 — monster defence lines: rename every cold/Cold on the line.
  if (/Damage\s+(Immunities|Resistances|Vulnerabilities)/i.test(s) && /\bcold\b/i.test(s)) {
    const after = s.replace(/\bcold\b/gi, frost);
    if (after !== s) { hits.push({ rule: 'R5 defence-line', before: s, after }); s = after; }
    return { text: s, hits };
  }

  const rules = [
    // R1 — dice wrappers: [% ... cold ... %]
    ['R1 dice-wrapper', () => s.replace(/\[%[^%]*?%\]/g, (w) => w.replace(/\bcold\b/gi, frost))],
    // R2 — "cold damage"
    ['R2 cold-damage', () => s.replace(/\b(cold)(\*{0,2}\s+damage)\b/gi, (_m, c, rest) => frost(c) + rest)],
    // R4 — "resistance/immunity/vulnerability to cold"
    ['R4 resist-to', () =>
      s.replace(/\b(resist(?:ance|ant)?|immun(?:e|ity)|vulnerab(?:le|ility))(\s+to\s+)(cold)\b/gi,
        (_m, kw, mid, c) => kw + mid + frost(c))],
    // R3a — cold immediately before another damage type in a list
    ['R3 type-list', () => s.replace(new RegExp(String.raw`\b(cold)\b(?=${SEP}(?:${TYPE})\b)`, 'gi'), (c) => frost(c))],
    // R3b — cold immediately after another damage type in a list
    ['R3 type-list', () => s.replace(new RegExp(String.raw`(?<=(?:${TYPE})\b${SEP})\b(cold)\b`, 'gi'), (c) => frost(c))],
  ];

  for (const [rule, fn] of rules) {
    const before = s;
    const after = fn();
    if (after !== before) { hits.push({ rule, before, after }); s = after; }
  }

  // R6 — bare type-name cells in the two canonical definition/mapping tables only
  // (kept file-scoped on purpose: a general "| Cold |" rule would wrongly catch
  //  control-weather's weather table and bag-o-limbs' effect table).
  if (/rules[\\/]steel-and-strife[\\/]damage\.mdx$/.test(rel)) {
    const after = s.replace(/^(\|\s*)Cold(\s*\|)/, (_m, a, b) => a + 'Frost' + b);
    if (after !== s) { hits.push({ rule: 'R6 type-table', before: s, after }); s = after; }
  }
  if (/spells[\\/]imbue-weapon\.mdx$/.test(rel)) {
    const after = s.replace(/^(\|\s*)cold(\s*\|)/, (_m, a, b) => a + 'frost' + b);
    if (after !== s) { hits.push({ rule: 'R6 type-table', before: s, after }); s = after; }
  }
  if (/heirlooms[\\/]bag-o-limbs\.heirloom\.mdx$/.test(rel)) {
    const after = s.replace(/\*\*Cold\*\*/g, '**Frost**'); // "Elemental Effect" d6 damage table
    if (after !== s) { hits.push({ rule: 'R6 type-table', before: s, after }); s = after; }
  }

  return { text: s, hits };
}

const files = walk(ROOT);
const changes = [];   // { file, line, rule, snippet }
const unmatched = []; // { file, line, snippet } — bare cold that no rule touched
let changedFiles = 0;

const ctx = (text, re) => {
  const m = re.exec(text);
  if (!m) return text.trim().slice(0, 120);
  const i = m.index;
  return ('…' + text.slice(Math.max(0, i - 35), i + 40) + '…').replace(/\s+/g, ' ').trim();
};

for (const file of files) {
  const rel = relative(process.cwd(), file);
  const original = readFileSync(file, 'utf8');
  const lines = original.split('\n');
  let dirty = false;

  const outLines = lines.map((line, idx) => {
    const { text, hits } = migrateLine(line, rel);
    for (const h of hits) {
      changes.push({ file: rel, line: idx + 1, rule: h.rule, before: h.before.trim(), after: h.after.trim() });
    }
    if (text !== line) dirty = true;
    // remaining bare cold on the resulting line = left as-is (flavour / weather / missed)
    if (/\bcold\b/i.test(text)) {
      unmatched.push({ file: rel, line: idx + 1, snippet: ctx(text, /\bcold\b/i) });
    }
    return text;
  });

  if (dirty) {
    changedFiles++;
    if (APPLY) writeFileSync(file, outLines.join('\n'), 'utf8'); // Node writes UTF-8 without BOM
  }
}

// ---- report ----
const byRule = {};
for (const c of changes) byRule[c.rule] = (byRule[c.rule] || 0) + 1;

const lines = [];
lines.push(`cold -> frost migration  (${APPLY ? 'APPLY' : 'DRY RUN'})`);
lines.push(`root: ${ROOT}   files scanned: ${files.length}   files changed: ${changedFiles}   renames: ${changes.length}`);
lines.push('');
lines.push('Renames by rule:');
for (const [r, n] of Object.entries(byRule).sort()) lines.push(`  ${String(n).padStart(4)}  ${r}`);
lines.push('');
lines.push('=== ALL RENAMES ===');
for (const c of changes) lines.push(`  ${c.file}:${c.line}  [${c.rule}]`);
lines.push('');
lines.push(`=== UNMATCHED bare "cold" left as-is (${unmatched.length}) — verify none is a damage type ===`);
for (const u of unmatched) lines.push(`  ${u.file}:${u.line}  ${u.snippet}`);

const fullReport = lines.join('\n');
if (REPORT) writeFileSync(REPORT, fullReport, 'utf8');

// Console: summary + the two buckets that need human eyes (R3 type-lists and UNMATCHED).
console.log(`cold -> frost migration  (${APPLY ? 'APPLY' : 'DRY RUN'})`);
console.log(`root: ${ROOT}   files scanned: ${files.length}   files changed: ${changedFiles}   renames: ${changes.length}`);
console.log('\nRenames by rule:');
for (const [r, n] of Object.entries(byRule).sort()) console.log(`  ${String(n).padStart(4)}  ${r}`);

console.log('\n--- R3 type-list renames (review these: "cold" sitting in a comma/or list) ---');
for (const c of changes.filter((c) => c.rule.startsWith('R3'))) {
  console.log(`  ${c.file}:${c.line}`);
  console.log(`      ${c.before}`);
}

console.log(`\n--- UNMATCHED bare "cold" left as-is (${unmatched.length}) — scan for any missed damage type ---`);
for (const u of unmatched) console.log(`  ${u.file}:${u.line}  ${u.snippet}`);

if (REPORT) console.log(`\nFull rename list written to ${REPORT}`);
if (!APPLY) console.log('\n(dry run — no files written. Re-run with --apply to write.)');
