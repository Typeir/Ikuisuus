/**
 * @fileoverview Moves a vocation's authored progression table onto the
 * `<Progression>` tag, then rebuilds the table from the tag and reports every
 * cell that differs from the authored one.
 * @module scripts/content/migrate-progression
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/migrate-progression.ts src/content/en/character-creation/vocations
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/migrate-progression.ts <file> --write
 */

import { castingColumns, type CastingKind } from '@/modules/library/domain/castingTables';
import {
  buildProgression,
  featuresText,
  tierBonusAt,
  type ColumnEntry,
  type ColumnSpec,
  type FeatureHeading,
} from '@/modules/library/domain/progression';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageFeatureHeadings } from '../metadata/progressionText';

/**
 * A converter's result.
 *
 * @property {string} text - Output text
 * @property {boolean} changed - Whether anything moved
 * @property {string} [skipped] - Why nothing moved
 * @property {string[]} notes - What to look at
 */
export interface Conversion {
  text: string;
  changed: boolean;
  skipped?: string;
  notes: string[];
}

const HEADER = /^\|\s*Level\s*\|/i;
const SEPARATOR = /^\|[-\s|:]+\|\s*$/;
const NONE = /^[-–—]?$/;
const SLOT = /^\d+(?:st|nd|rd|th)$/;
const MARKUP = /\[[%=#]|\*\*|\[[^\]]*\]\(/;

/**
 * Cells of a table row, trimmed.
 *
 * @param {string} line - Row
 * @returns {string[]} Cells
 */
function cells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/**
 * Plain text of a cell: bold and links stripped.
 *
 * @param {string} text - Markdown
 * @returns {string} Text
 */
function plain(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim();
}

/**
 * Whether a table name and a heading name the same feature: equal, or one
 * inside the other, as `Action Surge (One Use)` names `Action Surge` and
 * `Spellcasting` names `Esper Spellcasting`.
 *
 * @param {string} cell - Table name
 * @param {string} heading - Heading name
 * @returns {boolean} True when they name the same feature
 */
function sameFeature(cell: string, heading: string): boolean {
  const a = cell.toLowerCase();
  const b = heading.toLowerCase();
  const bare = a.replace(/\s*\([^)]*\)\s*$/, '');
  return a === b || bare === b || b.endsWith(` ${bare}`) || bare.endsWith(` ${b}`);
}

/**
 * The casting kind a set of headers implies.
 *
 * @param {string[]} headers - Table headers
 * @returns {CastingKind | undefined} Kind
 */
function castingOf(headers: string[]): CastingKind | undefined {
  const slots = headers.filter((h) => SLOT.test(h)).length;
  if (slots >= 9) return 'full';
  if (slots === 5) return 'half';
  if (slots === 4) return 'third';
  if (headers.some((h) => /^spell points$/i.test(h))) return 'points';
  if (headers.some((h) => /^slot level$/i.test(h))) return 'pact';
  return undefined;
}

/**
 * A column's rows, one at each level the value changes.
 *
 * @param {string[]} values - Value per level from level 1
 * @returns {ColumnEntry<string>[]} Rows
 */
function compress(values: string[]): ColumnEntry<string>[] {
  const entries: ColumnEntry<string>[] = [];
  let last: string | undefined;
  values.forEach((value, i) => {
    if (value === last) return;
    if (value !== '' || last !== undefined) entries.push({ at: i + 1, value });
    last = value;
  });
  return entries;
}

/**
 * Attribute text, double-quoted unless the value holds a double quote.
 *
 * @param {string} value - Value
 * @returns {string} Quoted
 */
function quoted(value: string): string {
  return value.includes('"') ? `'${value}'` : `"${value}"`;
}

/**
 * Lines of one declared column.
 *
 * @param {ColumnSpec<string>} column - Column
 * @returns {string[]} Lines
 */
function columnLines(column: ColumnSpec<string>): string[] {
  if (column.values && column.values.every((v) => !v.includes(',') && !v.includes('"'))) {
    return [`  <Column label=${quoted(column.label)} values="${column.values.join(', ')}" />`];
  }
  const rows = (column.entries ?? (column.values ? compress(column.values) : [])).map(
    (e) => `    <Row${e.at === undefined ? '' : ` at="${e.at}"`}${e.unique ? ' unique' : ''}>${e.value}</Row>`,
  );
  return [`  <Column label=${quoted(column.label)}>`, ...rows, '  </Column>'];
}

/**
 * Converts one vocation page.
 *
 * @param {string} text - Page text
 * @returns {Conversion} Result
 */
export function migrateProgression(text: string): Conversion {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const notes: string[] = [];
  const done = (out: string, changed: boolean, skipped?: string): Conversion => ({ text: out, changed, skipped, notes });

  if (lines.some((l) => /^<Progression\b/.test(l))) return done(text, false, 'already on the tag');
  if (!lines.some((l) => /^<(?:Vocation|Specialization)\b/.test(l))) {
    return done(text, false, 'no host tag; run migrate-vocation first');
  }
  const start = lines.findIndex((l) => HEADER.test(l));
  if (start < 0) return done(text, false, 'no progression table');
  const headers = cells(lines[start]).map(plain);
  const featuresAt = headers.findIndex((h) => /features$/i.test(h));
  if (featuresAt < 0) return done(text, false, 'no Features column');
  let end = start + 1;
  while (end + 1 < lines.length && /^\|/.test(lines[end + 1])) end += 1;
  const rows = lines
    .slice(start + 1, end + 1)
    .filter((l) => !SEPARATOR.test(l))
    .map(cells)
    .filter((r) => /^\d+$/.test(r[0]));
  const levels = rows.length ? Number(rows[rows.length - 1][0]) : 0;
  if (levels === 0) return done(text, false, 'progression table has no level rows');

  const tierAt = headers.findIndex((h) => /^(?:tier bonus|tb)$/i.test(h));
  const casting = castingOf(headers);
  const castingSet = new Set(
    casting === 'points'
      ? ['spell points', 'max spell level']
      : casting === 'pact'
        ? ['spell slots', 'slot level']
        : headers.filter((h) => SLOT.test(h)).map((h) => h.toLowerCase()),
  );
  const headings: FeatureHeading[] = pageFeatureHeadings(lines);
  const feats: number[] = [];
  const specialization: { label: string; levels: number[] }[] = [];
  const milestones: ColumnEntry<string>[] = [];
  const authoredFeatures = new Map<number, string>();

  for (const row of rows) {
    const level = Number(row[0]);
    const names = plain(row[featuresAt] ?? '')
      .split(/,\s*/)
      .map((n) => n.trim())
      .filter((n) => n && !NONE.test(n));
    authoredFeatures.set(level, names.join(', ') || '—');
    const atLevel = headings.filter((h) => h.level === level);
    const claimed = new Set<string>();
    const extra: string[] = [];
    for (const name of names) {
      if (/^feat$/i.test(name)) {
        feats.push(level);
        continue;
      }
      const spec = name.match(/^(.+?) Feature$/);
      if (spec) {
        const entry = specialization.find((s) => s.label === spec[1]);
        if (entry) entry.levels.push(level);
        else specialization.push({ label: spec[1], levels: [level] });
        continue;
      }
      const match = atLevel.find((h) => !claimed.has(h.name) && sameFeature(name, h.name));
      if (match) {
        claimed.add(match.name);
        if (match.name.toLowerCase() !== name.toLowerCase()) {
          notes.push(`level ${level}: table "${name}", page "${match.name}"; the page's name is printed`);
        }
        continue;
      }
      extra.push(name);
    }
    const unmatchedHeadings = atLevel.filter((h) => !claimed.has(h.name));
    if (extra.length && unmatchedHeadings.length) {
      notes.push(
        `level ${level}: table "${extra.join(', ')}" against page "${unmatchedHeadings.map((h) => h.name).join(', ')}"; the page's names are printed`,
      );
    } else if (extra.length) {
      milestones.push({ at: level, value: extra.join(', '), unique: true });
    }
  }
  if (specialization.length > 1) {
    notes.push(`several specialization labels (${specialization.map((s) => s.label).join(', ')}); the first is written`);
  }

  const columns: ColumnSpec<string>[] = [];
  if (milestones.length) columns.push({ label: 'Features', entries: milestones });
  headers.forEach((header, index) => {
    if (index === 0 || index === tierAt || index === featuresAt || castingSet.has(header.toLowerCase())) return;
    const values = rows.map((r) => (NONE.test(plain(r[index] ?? '')) ? '' : (r[index] ?? '').trim()));
    if (index < featuresAt) notes.push(`column ${header} sat before Features; it prints after`);
    columns.push(
      values.some((v) => MARKUP.test(v))
        ? { label: header, entries: compress(values) }
        : { label: header, values },
    );
  });

  const spec = specialization[0];
  const attrs = [
    casting ? ` casting="${casting}"` : '',
    feats.length ? ` feats="${feats.join(', ')}"` : '',
    spec ? ` specialization="${spec.label === 'Specialization' ? '' : `${spec.label}: `}${spec.levels.join(', ')}"` : '',
    levels !== 20 ? ` levels="${levels}"` : '',
  ].join('');
  const block = columns.length
    ? [`<Progression${attrs}>`, ...columns.flatMap(columnLines), '</Progression>']
    : [`<Progression${attrs} />`];

  const built = buildProgression<string>({
    casting,
    feats,
    specialization: spec,
    headings,
    columns,
    levels: levels !== 20 ? levels : undefined,
  });
  const builtCasting = casting ? castingColumns(casting, levels) : { columns: [], cells: [] };
  for (const row of rows) {
    const level = Number(row[0]);
    const builtRow = built.rows[level - 1];
    if (!builtRow) continue;
    const features = featuresText(builtRow.features);
    if (features !== authoredFeatures.get(level)) {
      notes.push(`level ${level}, Features: authored "${authoredFeatures.get(level)}", built "${features}"`);
    }
    if (tierAt >= 0 && plain(row[tierAt]) !== `+${tierBonusAt(level)}`) {
      notes.push(`level ${level}, Tier Bonus: authored "${plain(row[tierAt])}", built "+${tierBonusAt(level)}"`);
    }
    builtCasting.columns.forEach((column, i) => {
      const at = headers.findIndex((h) => h.toLowerCase() === column.toLowerCase());
      const authored = at >= 0 ? plain(row[at] ?? '') : '';
      const value = builtCasting.cells[level - 1]?.[i] ?? '';
      if ((NONE.test(authored) ? '' : authored) !== value) {
        notes.push(`level ${level}, ${column}: authored "${authored}", built "${value || '—'}"`);
      }
    });
  }

  const out = [...lines.slice(0, start), ...block, ...lines.slice(end + 1)].join(eol);
  return done(out, true);
}

/**
 * Standalone entry point.
 */
function main(): void {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const inputs = args.filter((a) => !a.startsWith('--'));
  if (inputs.length === 0) {
    console.error('usage: migrate-progression.ts [--write] <path|glob>...');
    process.exit(2);
  }
  const files = new Set<string>();
  for (const input of inputs) {
    if (statSync(input).isDirectory()) {
      for (const entry of readdirSync(input, { recursive: true }) as string[]) {
        if (entry.endsWith('.vocation.mdx')) files.add(join(input, entry));
      }
    } else {
      files.add(input);
    }
  }
  let converted = 0;
  let skipped = 0;
  for (const file of [...files].sort()) {
    const result = migrateProgression(readFileSync(file, 'utf8'));
    if (!result.changed) {
      skipped += 1;
      console.log(`skip   ${file}  (${result.skipped})`);
      continue;
    }
    converted += 1;
    console.log(`${write ? 'wrote ' : 'would '} ${file}`);
    for (const note of result.notes) console.log(`         ? ${note}`);
    if (write) writeFileSync(file, result.text);
  }
  console.log(`${write ? 'converted' : 'would convert'} ${converted}, skipped ${skipped}`);
}

if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  main();
}
