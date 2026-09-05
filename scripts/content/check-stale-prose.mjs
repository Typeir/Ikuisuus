/**
 * @fileoverview Finds prose the corpus has moved past. Each pattern names one
 * expression the register replaced — a D&D save clause, an attack block, a
 * bare condition word — and says what replaced it. The scan reports where
 * each still occurs, by family, by file, or as a worklist for a swarm.
 *
 * The default pattern set is the D&D inheritance inventory. Adding a pattern
 * is one object in PATTERNS; the scan, the summary, the JSON and the tests
 * take it from there. A pattern marked `review` is not wrong on sight and is
 * reported apart from the ones marked `legacy`, so a sweep does not convert
 * what only wanted reading.
 *
 *   npm run stale-prose -- src/content/en/items/heirlooms
 *   node scripts/content/check-stale-prose.mjs src/content/en/spells --list
 *   node scripts/content/check-stale-prose.mjs src/content/en --family=save
 *   node scripts/content/check-stale-prose.mjs src/content/en/monsters --json > worklist.json
 *   node scripts/content/check-stale-prose.mjs src/content/en/items --fail
 *
 * Call `node` directly when passing `--flags`; the npm shim on Windows does
 * not forward them reliably. Paths alone go through `npm run` fine.
 */

import { globSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Condition words with no everyday sense in prose; bare, each is a keyword
 * that was never linked.
 */
const CONDITIONS =
  'blinded|charmed|deafened|frightened|grappled|incapacitated|paralyzed|' +
  'petrified|poisoned|prone|restrained|staggered|stunned|suffocating|' +
  'terrified|unconscious|unsteady';

/**
 * Condition words that are also ordinary English — a burning horse, a dying
 * breath, a blade that cannot be sundered. Bare, each may be the condition
 * or may be the word, and only a reader can tell.
 */
const AMBIGUOUS_CONDITIONS =
  'bleeding|burning|dying|invisible|slowed|steady|sundered';

/**
 * The patterns. `legacy` is wrong wherever it appears; `review` needs a read
 * before it is touched, and the hint says what to read for.
 *
 * @type {ReadonlyArray<{id: string, family: string, severity: 'legacy'|'review', label: string, regex: RegExp, hint: string}>}
 */
export const PATTERNS = [
  {
    id: 'legacy-save',
    family: 'save',
    severity: 'legacy',
    label: 'must succeed on / must make … saving throw',
    regex: /must (?:succeed on|make)[^.]{0,60}saving throw/i,
    hint: '`X saves Y against DC N or Z`',
  },
  {
    id: 'repeat-save',
    family: 'save',
    severity: 'legacy',
    label: 'repeat the saving throw … ending the effect',
    regex: /repeat the saving throw[^.]{0,80}ending the effect/i,
    hint: '`may [# kw:resist #] at the end of each of its turns`',
  },
  {
    id: 'bare-dc-save',
    family: 'save',
    severity: 'legacy',
    label: 'DC N X saving throw',
    regex:
      /\bDC \d+ (?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i,
    hint: '`saves X against DC N`',
  },
  {
    id: 'immune-until',
    family: 'save',
    severity: 'review',
    label: 'immune to this effect until …',
    regex: /immune to (?:this|the) effect (?:for|until)/i,
    hint: 'no keyword covers it; keep the meaning, decide the duration',
  },
  {
    id: 'attack-block',
    family: 'attack',
    severity: 'legacy',
    label: '_Melee/Ranged Weapon Attack:_',
    regex: /_(?:Melee|Ranged)(?: or Ranged)? (?:Weapon|Spell) Attack:?_/i,
    hint: '`Accuracy +N, reach R, one creature.`',
  },
  {
    id: 'to-hit',
    family: 'attack',
    severity: 'legacy',
    label: '+N to hit',
    regex: /\+\d+ to hit\b/i,
    hint: '`accuracy +N`',
  },
  {
    id: 'hit-line',
    family: 'attack',
    severity: 'legacy',
    label: '_Hit:_ average (dice)',
    regex: /_Hit:?_\s*\d+\s*\(/i,
    hint: '`On a hit, A (dice).`',
  },
  {
    id: 'one-target',
    family: 'attack',
    severity: 'legacy',
    label: 'reach R, one target',
    regex: /reach [^,]+, one target\b/i,
    hint: 'part of an attack block; converts with it',
  },
  {
    id: 'spellcaster-level',
    family: 'cast',
    severity: 'legacy',
    label: 'is a Nth-level spellcaster',
    regex: /is an? \*{0,2}\d+(?:st|nd|rd|th)-level spellcaster/i,
    hint: 'a spell list; the level is metadata',
  },
  {
    id: 'spellcasting-ability',
    family: 'cast',
    severity: 'legacy',
    label: 'spellcasting ability is X (spell save DC …)',
    regex: /spellcasting ability is[^.]{0,40}\(spell save DC/i,
    hint: '`saveDc` on the sheet',
  },
  {
    id: 'no-components',
    family: 'cast',
    severity: 'legacy',
    label: 'does not require material components',
    regex: /(?:does not|doesn.t) require (?:any )?material components/i,
    hint: 'drop; components are the spell’s to declare',
  },
  {
    id: 'spells-prepared',
    family: 'cast',
    severity: 'legacy',
    label: 'has the following spells prepared',
    regex: /following spells (?:prepared|known)/i,
    hint: 'a spell list needs no preamble',
  },
  {
    id: 'slot-notation',
    family: 'cast',
    severity: 'legacy',
    label: '(N slots) / (at will) / N/day',
    regex: /\((?:\d+ slots?|at will|\d+\/day(?: each)?)\)/i,
    hint: '`charges` and `recharge` on the block',
  },
  {
    id: 'upcast',
    family: 'cast',
    severity: 'legacy',
    label: 'upcast',
    regex: /\bupcast\b/i,
    hint: 'overcast',
  },
  {
    id: 'magic-resistance',
    family: 'trait',
    severity: 'review',
    label: 'Magic Resistance boilerplate',
    regex: /advantage on saving throws against spells and other magical effects/i,
    hint: 'boilerplate; a trait keyword once one exists',
  },
  {
    id: 'magic-weapons',
    family: 'trait',
    severity: 'review',
    label: 'Magic Weapons boilerplate',
    regex: /(?:weapon )?attacks are (?:considered )?magical/i,
    hint: 'boilerplate; a trait keyword once one exists',
  },
  {
    id: 'siege-monster',
    family: 'trait',
    severity: 'review',
    label: 'Siege Monster boilerplate',
    regex: /deals (?:double|triple|quadruple) damage to objects/i,
    hint: 'boilerplate; a trait keyword once one exists',
  },
  {
    id: 'no-action-required',
    family: 'tempo',
    severity: 'legacy',
    label: 'no action required',
    regex: /no action required/i,
    hint: 'drop; a thing that costs nothing says nothing',
  },
  {
    id: 'per-day',
    family: 'tempo',
    severity: 'legacy',
    label: '(N/Day)',
    regex: /\(\d+\/[Dd]ay\)/,
    hint: '`1/[# kw:Recovery #]` or `1/[# kw:Repose #]`',
  },
  {
    id: 'end-of-next-turn',
    family: 'tempo',
    severity: 'legacy',
    label: 'until the end of its/their next turn',
    regex: /until the end of (?:its|their) next turn/i,
    hint: '`[# kw:briefly #]` — the subject is the sufferer',
  },
  {
    id: 'end-of-your-next-turn',
    family: 'tempo',
    severity: 'review',
    label: 'until the end of your next turn',
    regex: /until the end of your next turn/i,
    hint: 'the wielder’s turn, a different duration from briefly; usually stays',
  },
  {
    id: 'next-dawn',
    family: 'tempo',
    severity: 'review',
    label: 'until the next dawn',
    regex: /until the next dawn/i,
    hint: 'a real duration in Damocles; legacy only where it means “per day”',
  },
  {
    id: 'bonus-action',
    family: 'tempo',
    severity: 'legacy',
    label: 'Bonus Action',
    regex: /\b[Bb]onus [Aa]ction\b/,
    hint: 'Minor Action',
  },
  {
    id: 'magic-action',
    family: 'tempo',
    severity: 'legacy',
    label: 'Magic action',
    regex: /\b[Mm]agic\*{0,2} [Aa]ction\b/,
    hint: 'Major Action; the resource it spends is a separate cost',
  },
  {
    id: 'feet',
    family: 'units',
    severity: 'legacy',
    label: 'N feet / ft.',
    regex: /\b\d+\s*(?:ft\.?|feet|foot)\b/i,
    hint: '`[= N stride =]`',
  },
  {
    id: 'bare-condition',
    family: 'cond',
    severity: 'legacy',
    label: 'condition word without a keyword',
    regex: new RegExp(`(?<![:\\w])(?:${CONDITIONS})\\b(?![^\\[]*#\\])`, 'i'),
    hint: '`[# kw:condition:name #]`',
  },
  {
    id: 'ambiguous-condition',
    family: 'cond',
    severity: 'review',
    label: 'condition word that is also plain English',
    regex: new RegExp(
      `(?<![:\\w])(?:${AMBIGUOUS_CONDITIONS})\\b(?![^\\[]*#\\])`,
      'i',
    ),
    hint: 'the condition wants `[# kw:condition:name #]`; a burning horse or a dying breath wants nothing',
  },
  {
    id: 'proficiency-bonus',
    family: 'misc',
    severity: 'legacy',
    label: 'Proficiency Bonus / PB',
    regex: /\b(?:[Pp]roficiency [Bb]onus|PB)\b/,
    hint: 'tier bonus',
  },
  {
    id: 'challenge-rating-prose',
    family: 'misc',
    severity: 'review',
    label: 'challenge rating in prose',
    regex: /\bchallenge rating\b/i,
    hint: 'stays on sheets; check prose uses mean what the term means',
  },
];

/**
 * One occurrence of a pattern.
 *
 * @typedef {object} Hit
 * @property {string} file - File path as given
 * @property {number} line - 1-based line number
 * @property {string} id - Pattern id
 * @property {string} excerpt - The line around the match, whitespace collapsed
 */

/**
 * Scans text for every pattern, one hit per line per pattern.
 *
 * @param {string} file - File path, carried into each hit
 * @param {string} text - File contents
 * @param {ReadonlyArray<typeof PATTERNS[number]>} [patterns] - Patterns to apply
 * @returns {Hit[]} Hits in line order
 */
export function scanText(file, text, patterns = PATTERNS) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = pattern.regex.exec(line);
      if (!match) continue;
      const from = Math.max(0, match.index - 40);
      const to = Math.min(line.length, match.index + match[0].length + 40);
      hits.push({
        file,
        line: index + 1,
        id: pattern.id,
        excerpt: line.slice(from, to).replace(/\s+/g, ' ').trim(),
      });
    }
  });
  return hits;
}

/**
 * Scans files.
 *
 * @param {string[]} files - File paths
 * @param {ReadonlyArray<typeof PATTERNS[number]>} [patterns] - Patterns to apply
 * @returns {Hit[]} All hits
 */
export function scanFiles(files, patterns = PATTERNS) {
  return files.flatMap((file) =>
    scanText(file, readFileSync(file, 'utf8'), patterns),
  );
}

/**
 * Hits rolled up by pattern.
 *
 * @param {Hit[]} hits - Hits
 * @param {ReadonlyArray<typeof PATTERNS[number]>} [patterns] - Patterns, for order and labels
 * @returns {Array<{id: string, family: string, severity: string, label: string, hint: string, hits: number, files: number, example: Hit|null}>} One row per pattern that hit
 */
export function summarize(hits, patterns = PATTERNS) {
  return patterns
    .map((pattern) => {
      const own = hits.filter((hit) => hit.id === pattern.id);
      return {
        id: pattern.id,
        family: pattern.family,
        severity: pattern.severity,
        label: pattern.label,
        hint: pattern.hint,
        hits: own.length,
        files: new Set(own.map((hit) => hit.file)).size,
        example: own[0] ?? null,
      };
    })
    .filter((row) => row.hits > 0);
}

/**
 * Expands paths and globs into MDX files.
 *
 * @param {string[]} inputs - Paths, directories or globs
 * @returns {string[]} MDX file paths, sorted and unique
 */
export function resolveFiles(inputs) {
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
    if (isDir) {
      globSync(join(input, '**', '*.mdx')).forEach((file) => out.add(file));
    } else {
      out.add(input);
    }
  }
  return [...out].sort();
}

/**
 * Prints the summary table.
 *
 * @param {ReturnType<typeof summarize>} rows - Summary rows
 * @param {number} fileCount - Files scanned
 */
function printSummary(rows, fileCount) {
  const total = rows.reduce((sum, row) => sum + row.hits, 0);
  const legacy = rows
    .filter((row) => row.severity === 'legacy')
    .reduce((sum, row) => sum + row.hits, 0);
  console.log(`${fileCount} files, ${total} hits (${legacy} legacy, ${total - legacy} review)\n`);
  if (rows.length === 0) return;
  const width = Math.max(...rows.map((row) => row.label.length));
  for (const row of rows) {
    const mark = row.severity === 'review' ? '?' : '!';
    const ex = row.example
      ? `${basename(row.example.file)}:${row.example.line}`
      : '';
    console.log(
      `${mark} ${row.family.padEnd(6)} ${row.label.padEnd(width)}  ${String(row.hits).padStart(4)} in ${String(row.files).padStart(3)}   ${ex}`,
    );
  }
  console.log('\n! legacy: wrong on sight   ? review: read before touching');
}

/**
 * Prints every hit, grouped by file.
 *
 * @param {Hit[]} hits - Hits
 * @param {ReadonlyArray<typeof PATTERNS[number]>} patterns - Patterns, for hints
 */
function printList(hits, patterns) {
  const byFile = new Map();
  for (const hit of hits) {
    if (!byFile.has(hit.file)) byFile.set(hit.file, []);
    byFile.get(hit.file).push(hit);
  }
  const hintOf = Object.fromEntries(patterns.map((p) => [p.id, p.hint]));
  for (const [file, own] of byFile) {
    console.log(`\n${file}`);
    for (const hit of own) {
      console.log(`  :${hit.line}  [${hit.id}]  …${hit.excerpt}…`);
      console.log(`         → ${hintOf[hit.id]}`);
    }
  }
}

/**
 * Standalone entry point.
 */
function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith('--')));
  const family = args.find((arg) => arg.startsWith('--family='))?.slice(9);
  const only = args.find((arg) => arg.startsWith('--only='))?.slice(7);
  const inputs = args.filter((arg) => !arg.startsWith('--'));

  if (inputs.length === 0) {
    console.error(
      'usage: check-stale-prose.mjs <path|glob>... [--list] [--json] [--family=<f>] [--only=<id>] [--fail]',
    );
    process.exit(2);
  }

  let patterns = PATTERNS;
  if (family) patterns = patterns.filter((p) => p.family === family);
  if (only) patterns = patterns.filter((p) => p.id === only);

  const files = resolveFiles(inputs);
  const hits = scanFiles(files, patterns);

  if (flags.has('--json')) {
    console.log(JSON.stringify({ files: files.length, hits }, null, 2));
  } else if (flags.has('--list')) {
    printList(hits, patterns);
    console.log(`\n${hits.length} hits in ${new Set(hits.map((h) => h.file)).size} files`);
  } else {
    printSummary(summarize(hits, patterns), files.length);
  }

  const legacyHits = hits.filter(
    (hit) => patterns.find((p) => p.id === hit.id)?.severity === 'legacy',
  ).length;
  process.exit(flags.has('--fail') && legacyHits > 0 ? 1 : 0);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  main();
}
