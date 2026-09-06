/**
 * @fileoverview Reads a `<Progression>` block out of page text and builds the
 * feature list the vocation generator used to read from the markdown table.
 * @module scripts/metadata/progressionText
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import { CASTING_KINDS, type CastingKind } from '@/modules/library/domain/castingTables';
import {
  buildProgression,
  parseLevels,
  parseSpecialization,
  type ColumnEntry,
  type ColumnSpec,
} from '@/modules/library/domain/progression';
import { readHostTag } from './slotForms';

/**
 * What the generator reads from a progression: the same shape the table parser returns.
 *
 * @property {Array<{ level: number; name: string }>} features - Feature names by level
 * @property {boolean} hasSpellSlots - Whether the table carries slot columns
 * @property {string[]} headers - Column headers in order
 */
export interface ProgressionReading {
  features: Array<{ level: number; name: string }>;
  hasSpellSlots: boolean;
  headers: string[];
}

const COLUMN_OPEN = /^\s*<Column\b([^>]*?)(\/?)>\s*$/;
const COLUMN_CLOSE = /^\s*<\/Column>\s*$/;
const ROW = /^\s*<Row\b([^>]*)>(.*?)<\/Row>\s*$/;
const LABEL = /\blabel=(?:"([^"]*)"|'([^']*)')/;
const VALUES = /\bvalues=\{\[([\s\S]*?)\]\}/;
const AT = /\bat=(?:"(\d+)"|'(\d+)'|\{(\d+)\})/;
const UNIQUE = /\bunique\b(?!=["'{]?false)/;
const LEVEL_HEADING = /^#{1,6}\s+(\d+)(?:st|nd|rd|th)\s+Level\s+[–—-]\s+(.+?)\s*$/i;
const FEATURE_OPEN = /^<Feature\b[^>]*\blevel=(?:"(\d+)"|'(\d+)')/;

/**
 * Plain text of a cell: bold and links stripped.
 *
 * @param {string} text - Markdown
 * @returns {string} Text
 */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim();
}

/**
 * Items of an array literal such as `["12", "14", 3]`.
 *
 * @param {string} inner - Text between the brackets
 * @returns {string[]} Items as text
 */
function arrayItems(inner: string): string[] {
  const items: string[] = [];
  for (const match of inner.matchAll(/"([^"]*)"|'([^']*)'|([^,\s"']+)/g)) {
    items.push(match[1] ?? match[2] ?? match[3]);
  }
  return items;
}

/**
 * Feature headings on the page, in either the level-heading form or the
 * `<Feature level>` block form.
 *
 * @param {string[]} lines - Page lines
 * @returns {Array<{ level: number; name: string }>} Headings in page order
 */
export function pageFeatureHeadings(lines: string[]): Array<{ level: number; name: string }> {
  const out: Array<{ level: number; name: string }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const levelled = lines[i].match(LEVEL_HEADING);
    if (levelled) {
      out.push({ level: Number(levelled[1]), name: plain(levelled[2]) });
      continue;
    }
    const block = lines[i].match(FEATURE_OPEN);
    if (!block) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j += 1;
    const heading = lines[j]?.match(/^#{1,6}\s+(.*?)\s*$/);
    if (heading) out.push({ level: Number(block[1] ?? block[2]), name: plain(heading[1]) });
  }
  return out;
}

/**
 * The columns a progression block declares.
 *
 * @param {string[]} lines - Lines between the opening and closing tag
 * @returns {ColumnSpec<string>[]} Columns in order
 */
function columnsOf(lines: string[]): ColumnSpec<string>[] {
  const columns: ColumnSpec<string>[] = [];
  let open: { label: string; entries: ColumnEntry<string>[] } | null = null;
  for (const line of lines) {
    const column = line.match(COLUMN_OPEN);
    if (column) {
      const label = plain(column[1].match(LABEL)?.[1] ?? column[1].match(LABEL)?.[2] ?? '');
      const values = column[1].match(VALUES);
      if (values || column[2] === '/') {
        columns.push({ label, values: values ? arrayItems(values[1]) : [] });
        open = null;
      } else {
        open = { label, entries: [] };
        columns.push(open);
      }
      continue;
    }
    if (COLUMN_CLOSE.test(line)) {
      open = null;
      continue;
    }
    const row = open ? line.match(ROW) : null;
    if (row && open) {
      const at = row[1].match(AT);
      open.entries.push({
        at: at ? Number(at[1] ?? at[2] ?? at[3]) : undefined,
        value: plain(row[2]),
        unique: UNIQUE.test(row[1]),
      });
    }
  }
  return columns;
}

/**
 * Reads the first `<Progression>` block of a page.
 *
 * @param {string} text - Page text
 * @returns {ProgressionReading | null} The reading, or null without a block
 */
export function progressionFromText(text: string): ProgressionReading | null {
  const lines = text.split('\n');
  const at = lines.findIndex((line) => /^<Progression\b/.test(line));
  if (at < 0) return null;
  const tag = readHostTag(lines, at);
  if (!tag) return null;
  const selfClosing = /\/>\s*$/.test(lines[tag.end]);
  let end = tag.end;
  if (!selfClosing) {
    end = lines.findIndex((line, i) => i > tag.end && /^<\/Progression>\s*$/.test(line));
    if (end < 0) end = lines.length;
  }
  const attr = (name: string): string | undefined => {
    const value = tag.attrs[name];
    return typeof value === 'string' ? value : undefined;
  };
  const casting = CASTING_KINDS.find((k) => k === attr('casting')?.trim().toLowerCase()) as CastingKind | undefined;
  const levels = Number(attr('levels'));
  const table = buildProgression<string>({
    casting,
    feats: parseLevels(attr('feats')),
    specialization: parseSpecialization(attr('specialization')),
    headings: pageFeatureHeadings(lines),
    columns: selfClosing ? [] : columnsOf(lines.slice(tag.end + 1, end)),
    levels: Number.isInteger(levels) && levels > 0 ? levels : undefined,
  });
  const features = table.rows.flatMap((row) =>
    row.features.map((cell) => ({ level: row.level, name: String(cell.value) })),
  );
  return {
    features,
    hasSpellSlots: casting !== undefined,
    headers: ['Level', 'Tier Bonus', 'Features', ...table.columns],
  };
}
