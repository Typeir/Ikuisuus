/**
 * @fileoverview Rewrites Armour Class prose into Defence, Dodge and Deflect.
 * @description Defence is 10 + Deflect + Dodge, so each classified AC site
 * takes the word its verdict names, a formula splits into its two parts, and
 * a hand verdict rewrites or deletes lines; a site whose line has moved is
 * skipped and listed
 *
 * @module scripts/content/rewrite-defence
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-15
 */

import { glob, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(import.meta.dirname, '../..');

/**
 * Where the verdict files root their content paths.
 */
export const CONTENT = 'src/content/en/';

/**
 * The classifier's verdict per AC line.
 */
export const CLASSIFICATION = '.ignore/reports/defence-haiku-classification.json';

/**
 * The operator's side for each unclear line.
 */
export const TICKS = '.ignore/reports/defence-unclear-choices.md';

/**
 * Hand verdicts: rewrites, deletions and sides taken on classified lines.
 */
export const HAND = '.ignore/reports/defence-verdicts.json';

/**
 * Files whose classified sites the codemod leaves alone, being rewritten by hand.
 */
export const SKIP = new Set(['items/equipment/armour.rule.mdx']);

/**
 * The word each verdict writes over AC.
 */
export const WORDS = {
  dodge: 'Dodge',
  deflect: 'Deflect',
  total: 'Defence',
  object: 'Defence',
  split: 'Defence',
};

/**
 * Any AC mention still in prose.
 */
export const MENTION = /\bAC\b|\b[Aa]rmou?r [Cc]lass\b/g;

const ABILITY = String.raw`(?:DEX|Dex(?:terity)?|WIS|Wis(?:dom)?|CHA|Cha(?:risma)?|CON|Con(?:stitution)?|INT|Int(?:elligence)?|STR|Str(?:ength)?)(?: (?:modifier|mod))?`;
const TERMS = String.raw`${ABILITY}(?: \+ ${ABILITY})*`;
const AC = String.raw`(?:AC|Armou?r Class)`;

/**
 * A formula with ability terms.
 *
 * @description Groups: 1 bold before AC, 2 "base ", 3 bold after AC, 4 verb,
 * 5 bold before the number, 6 the number, 7 the terms, 8 closing bold
 */
const FORMULA = new RegExp(
  String.raw`(\*\*)?((?:base )?)${AC}(\*\*)? (is|becomes|equals|=) (\*\*)?(\d{1,2})(?: \+ | plus (?:their |your )?)(${TERMS})(\*\*)?`,
  'g',
);

/**
 * A flat formula with no ability term.
 */
const FLAT = new RegExp(
  String.raw`(\*\*)?((?:base )?)${AC}(\*\*)? (is|becomes|equals|of) (\*\*)?(\d{1,2})(\*\*)?(?!\d| \+| plus)`,
  'g',
);

/**
 * A line that sets an unarmoured baseline.
 */
const UNARMOURED = /unarmou?red|not wearing armou?r|aren't wearing armou?r|wearing no armou?r/i;

/**
 * Losing the Dexterity part of AC.
 */
const DEX_LOSS = /\b(lose|loses|losing) (its|their|your) Dexterity (?:modifier|bonus) to (?:AC|Armou?r Class)\b/g;

/**
 * Whether a formula term is Dexterity.
 *
 * @param {string} term - One ability term
 * @returns {boolean} True for any spelling of Dexterity
 */
function isDex(term) {
  return /^Dex/i.test(term);
}

/**
 * Reads the operator's tick file into verdicts by site.
 *
 * @param {string} text - The tick file
 * @returns {Map<string, {verdict: string, note: string}>} Verdict per path:line
 */
export function readTicks(text) {
  const ticks = new Map();
  let key = null;
  for (const line of text.split(/\r?\n/)) {
    const head = line.match(/^## (.+):(\d+)\s*$/);
    if (head) {
      key = `${head[1]}:${head[2]}`;
      continue;
    }
    const mark =
      key && line.match(/^- \[[VvXx]\] (dodge|deflect|total|object|other)\b:?\s*(.*)$/);
    if (mark) ticks.set(key, { verdict: mark[1], note: mark[2].trim() });
  }
  return ticks;
}

/**
 * Joins the classifier's rows, the ticks and the hand verdicts into sites.
 *
 * @param {Array<object>} rows - Classifier rows
 * @param {Map<string, object>} ticks - Verdict per unclear path:line
 * @param {Array<object>} hand - Hand verdicts, which win on their line
 * @returns {Array<object>} One site per path:line
 */
export function mergeSites(rows, ticks, hand) {
  const sites = new Map();
  for (const row of rows) {
    const key = `${row.path}:${row.line}`;
    const site = {
      path: row.path,
      line: row.line,
      kind: row.kind,
      context: row.context,
      verdict: row.verdict,
      source: 'classifier',
    };
    if (row.verdict === 'unclear') {
      const tick = ticks.get(key);
      if (tick) Object.assign(site, { verdict: tick.verdict, note: tick.note, source: 'tick' });
      else site.verdict = 'unticked';
    }
    sites.set(key, site);
  }
  for (const entry of hand) {
    const key = `${entry.path}:${entry.line}`;
    const base = sites.get(key) ?? { path: entry.path, line: entry.line, kind: 'hand' };
    sites.set(key, { ...base, ...entry, source: 'hand' });
  }
  return [...sites.values()];
}

/**
 * Finds the line a site names, following it if the file has shifted.
 *
 * @param {Array<string>} lines - The file
 * @param {object} site - A site with a line and a probe
 * @returns {number} Zero-based index, or -1 when the line is gone or ambiguous
 */
export function locate(lines, site) {
  const probe = (site.match ?? site.context ?? '').trim().slice(0, 60);
  if (!probe) return -1;
  const at = site.line - 1;
  if (lines[at]?.includes(probe)) return at;
  const hits = [];
  lines.forEach((line, index) => {
    if (line.includes(probe)) hits.push(index);
  });
  return hits.length === 1 ? hits[0] : -1;
}

/**
 * Splits a formula with ability terms into Deflect and Dodge.
 *
 * @param {string} line - The line
 * @returns {string} The line with the formula split
 */
export function splitFormula(line) {
  return line.replace(FORMULA, (match, open, prefix, closeAc, verb, boldNum, base, terms, close) => {
    const parts = terms.split(' + ');
    const hasDex = parts.some(isDex);
    const others = parts.filter((part) => !isDex(part));
    const deflect = Number(base) - 10;
    const value = (x) => (open || !boldNum ? String(x) : `**${x}**`);
    const clauses = [];
    if (deflect !== 0 || others.length === 0) clauses.push(`Deflect ${verb} ${value(deflect)}`);
    if (others.length > 0) clauses.push(`Dodge ${verb} ${value(terms)}`);
    return `${open ?? ''}${prefix}${clauses.join(' and ')}${open ? (close ?? '') : ''}`;
  });
}

/**
 * Turns a flat baseline into Deflect, with Dodge 0 where it replaces armour.
 *
 * @param {string} line - The line
 * @returns {string} The line with the flat number made Deflect
 */
export function flatFormula(line) {
  const unarmoured = UNARMOURED.test(line);
  return line.replace(FLAT, (match, open, prefix, closeAc, verb, boldNum, base, close) => {
    const value = open || !boldNum ? String(Number(base) - 10) : `**${Number(base) - 10}**`;
    const dodge = unarmoured && verb !== 'of' ? ` and Dodge ${verb} 0` : '';
    return `${open ?? ''}${prefix}Deflect ${verb} ${value}${dodge}${open ? (close ?? '') : ''}`;
  });
}

/**
 * Writes the verdict's word over every AC mention on the line.
 *
 * @param {string} line - The line
 * @param {string} word - Dodge, Deflect or Defence
 * @returns {string} The line renamed
 */
export function swapWords(line, word) {
  return line
    .replace(/\bArmou?r Class \(AC\)/g, word)
    .replace(/\barmou?r class \(AC\)/g, word.toLowerCase())
    .replace(/\bArmou?r Class\b/g, word)
    .replace(/\barmou?r class\b/g, word.toLowerCase())
    .replace(/\bAC\b/g, word)
    .replace(/\ban (Deflect|Dodge|Defence)\b/g, 'a $1');
}

/**
 * Applies a word verdict to one line.
 *
 * @param {string} line - The line
 * @param {object} site - The site with its verdict
 * @returns {string} The rewritten line, unchanged when the verdict is not a word
 */
export function applySite(line, site) {
  const word = WORDS[site.verdict];
  if (!word) return line;
  let text = line;
  if (site.verdict === 'split') text = splitFormula(text);
  if (site.verdict === 'deflect') text = flatFormula(splitFormula(text));
  if (site.verdict === 'dodge') text = text.replace(DEX_LOSS, '$1 $2 Dodge');
  return swapWords(text, word);
}

/**
 * Rewrites one file's sites, bottom-up so line numbers hold.
 *
 * @param {string} text - The file
 * @param {Array<object>} sites - The sites in this file
 * @returns {{text: string, applied: Array<object>, skipped: Array<object>}} Outcome
 */
export function rewrite(text, sites) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(eol);
  const applied = [];
  const skipped = [];
  const located = [];
  for (const site of sites) {
    const at = locate(lines, site);
    if (at < 0) skipped.push({ ...site, reason: 'moved' });
    else located.push({ ...site, at, end: site.through ? at + (site.through - site.line) : at });
  }
  const blocks = located.filter((site) => site.verdict === 'rewrite' && site.end > site.at);
  const covered = (site) =>
    blocks.some((block) => block !== site && site.at >= block.at && site.at <= block.end);
  located.sort((a, b) => b.at - a.at);
  for (const site of located) {
    if (covered(site)) continue;
    const before = lines.slice(site.at, site.end + 1).join('\n');
    if (site.verdict === 'rewrite') {
      lines.splice(site.at, site.end - site.at + 1, ...site.text.split('\n'));
      applied.push({ ...site, before, after: site.text });
      continue;
    }
    if (site.verdict === 'delete') {
      lines.splice(site.at, site.end - site.at + 1);
      applied.push({ ...site, before, after: '' });
      continue;
    }
    if (!WORDS[site.verdict]) {
      skipped.push({ ...site, reason: site.verdict === 'skip' ? 'skipped' : site.verdict });
      continue;
    }
    const after = applySite(before, site);
    if (after === before) {
      skipped.push({ ...site, reason: 'unchanged' });
      continue;
    }
    lines[site.at] = after;
    applied.push({ ...site, before, after });
  }
  return { text: lines.join(eol), applied, skipped };
}

/**
 * Counts the AC mentions a text still carries.
 *
 * @param {string} text - The text after rewriting
 * @returns {Array<{line: number, text: string}>} Lines still naming AC
 */
export function remaining(text) {
  const rows = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.match(MENTION)) rows.push({ line: index + 1, text: line.trim() });
  });
  return rows;
}

/**
 * Groups sites by file.
 *
 * @param {Array<object>} sites - All sites
 * @returns {Map<string, Array<object>>} Sites per content path
 */
export function byPath(sites) {
  const groups = new Map();
  for (const site of sites) {
    if (!groups.has(site.path)) groups.set(site.path, []);
    groups.get(site.path).push(site);
  }
  return groups;
}

/**
 * Reads the argument after a flag.
 *
 * @param {Array<string>} args - Command line
 * @param {string} flag - The flag
 * @returns {(string|undefined)} The value, if the flag is present
 */
function argAfter(args, flag) {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : undefined;
}

/**
 * Loads the three verdict files into sites.
 *
 * @param {string} classification - Classifier rows
 * @param {string} ticks - The tick file
 * @param {string} hand - Hand verdicts
 * @returns {Promise<Array<object>>} Sites
 */
export async function loadSites(classification, ticks, hand) {
  const rows = JSON.parse(await readFile(resolve(ROOT, classification), 'utf8'));
  const marks = readTicks(await readFile(resolve(ROOT, ticks), 'utf8'));
  const extra = JSON.parse(await readFile(resolve(ROOT, hand), 'utf8'));
  return mergeSites(rows, marks, extra);
}

/**
 * Renders the before and after of every applied site as markdown.
 *
 * @param {Map<string, object>} outcomes - Outcome per path
 * @param {Array<object>} left - AC mentions left after the run
 * @returns {string} The report
 */
export function render(outcomes, left) {
  const lines = ['# Defence rewrite — dry run', ''];
  const counts = new Map();
  const skips = new Map();
  for (const outcome of outcomes.values()) {
    for (const site of outcome.applied) counts.set(site.verdict, (counts.get(site.verdict) ?? 0) + 1);
    for (const site of outcome.skipped) skips.set(site.reason, (skips.get(site.reason) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  lines.push(
    `Applied ${total} sites (${[...counts].map(([k, n]) => `${k} ${n}`).join(', ')}). Skipped ${[...skips.values()].reduce((sum, n) => sum + n, 0)} (${[...skips].map(([k, n]) => `${k} ${n}`).join(', ')}). AC mentions left in prose: ${left.length}.`,
    '',
  );
  for (const [path, outcome] of outcomes) {
    if (outcome.applied.length === 0 && outcome.skipped.length === 0) continue;
    lines.push(`## ${path}`, '');
    for (const site of [...outcome.applied].sort((a, b) => a.at - b.at)) {
      const note = site.note ? ` — ${site.note}` : '';
      lines.push(`- L${site.line} ${site.verdict} (${site.source})${note}`, '', '```diff');
      for (const row of site.before.split('\n')) lines.push(`- ${row}`);
      for (const row of site.after.split('\n')) if (site.after) lines.push(`+ ${row}`);
      lines.push('```', '');
    }
    for (const site of outcome.skipped) {
      lines.push(`- L${site.line} skipped: ${site.reason}${site.note ? ` — ${site.note}` : ''}`);
    }
    lines.push('');
  }
  if (left.length > 0) {
    lines.push('## Left in prose', '');
    for (const row of left) lines.push(`- ${row.path}:${row.line} ${row.text.slice(0, 160)}`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Sweeps the classified sites and rewrites them, then counts what is left.
 *
 * @returns {Promise<void>} Resolves once every changed file is written
 */
export async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const show = args.includes('--show');
  const out = argAfter(args, '--out');
  const sites = await loadSites(
    argAfter(args, '--classification') ?? CLASSIFICATION,
    argAfter(args, '--ticks') ?? TICKS,
    argAfter(args, '--hand') ?? HAND,
  );
  const outcomes = new Map();
  const finals = new Map();
  for (const [path, group] of byPath(sites)) {
    if (SKIP.has(path)) continue;
    const source = await readFile(resolve(ROOT, CONTENT, path), 'utf8');
    const outcome = rewrite(source, group);
    outcomes.set(path, outcome);
    finals.set(path, outcome.text);
    if (outcome.text !== source && !dryRun) {
      await writeFile(resolve(ROOT, CONTENT, path), outcome.text, 'utf8');
    }
  }
  const left = [];
  for await (const entry of glob('**/*.mdx', { cwd: resolve(ROOT, CONTENT) })) {
    const path = entry.replaceAll('\\', '/');
    const text = finals.get(path) ?? (await readFile(resolve(ROOT, CONTENT, path), 'utf8'));
    for (const row of remaining(text)) left.push({ path, ...row });
  }
  const report = render(outcomes, left);
  if (out) await writeFile(resolve(ROOT, out), report, 'utf8');
  const changed = [...outcomes].filter(([, outcome]) => outcome.applied.length > 0).length;
  console.log(`${dryRun ? 'Would rewrite' : 'Rewrote'} ${changed} files`);
  console.log(report.split('\n')[2]);
  if (show) console.log(report);
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  main();
}
