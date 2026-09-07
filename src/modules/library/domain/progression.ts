/**
 * @fileoverview Builds a vocation's progression table from what the page
 * declares: its feature headings, its feat and specialization levels, its
 * casting kind and its columns.
 * @module modules/library/domain/progression
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import { castingColumns, type CastingKind } from './castingTables';

/**
 * One row of a column: a value from a level on, or at that level alone.
 *
 * @property {number} [at] - Level the value starts at; unset means the level after the previous row, level 1 first
 * @property {T} value - Cell value
 * @property {boolean} [unique] - Print at this level only
 */
export interface ColumnEntry<T> {
  at?: number;
  value: T;
  unique?: boolean;
}

/**
 * A declared column: either one value per level from level 1, or rows.
 *
 * @property {string} label - Column heading
 * @property {readonly T[]} [values] - One value per level from level 1; the last carries forward
 * @property {readonly ColumnEntry<T>[]} [entries] - Rows, in order
 */
export interface ColumnSpec<T> {
  label: string;
  values?: readonly T[];
  entries?: readonly ColumnEntry<T>[];
}

/**
 * A feature heading on the page.
 *
 * @property {number} level - Level the feature is gained
 * @property {string} name - Heading text
 */
export interface FeatureHeading {
  level: number;
  name: string;
}

/**
 * Everything a progression table is built from.
 *
 * @property {CastingKind} [casting] - Casting kind, for the slot columns
 * @property {readonly number[]} [feats] - Levels that print a feat
 * @property {{ label: string; levels: readonly number[] }} [specialization] - Levels that print a specialization feature, under the vocation's word for it
 * @property {readonly FeatureHeading[]} headings - The page's feature headings
 * @property {readonly ColumnSpec<T>[]} columns - Declared columns; one labelled Features adds milestones to the features cell
 * @property {number} [levels] - Last level printed; unset means 20 or the last level anything declares
 */
export interface ProgressionSpec<T> {
  casting?: CastingKind;
  feats?: readonly number[];
  specialization?: { label: string; levels: readonly number[] };
  headings: readonly FeatureHeading[];
  columns: readonly ColumnSpec<T>[];
  levels?: number;
}

/**
 * What a features cell names, in print order.
 *
 * @property {'heading' | 'milestone' | 'feat' | 'specialization'} kind - Where the entry came from
 * @property {string | T} value - Heading text, milestone value, or the label for a feat or specialization feature
 */
export interface FeatureCell<T> {
  kind: 'heading' | 'milestone' | 'feat' | 'specialization';
  value: string | T;
}

/**
 * One printed row.
 *
 * @property {number} level - Level
 * @property {number} tierBonus - Tier bonus at that level
 * @property {FeatureCell<T>[]} features - Features cell
 * @property {(T | string | undefined)[]} cells - Declared column cells, then casting cells
 */
export interface ProgressionRow<T> {
  level: number;
  tierBonus: number;
  features: FeatureCell<T>[];
  cells: (T | string | undefined)[];
}

/**
 * A built table.
 *
 * @property {string[]} columns - Column labels after Level, Tier Bonus and Features
 * @property {ProgressionRow<T>[]} rows - One row per level
 */
export interface ProgressionTable<T> {
  columns: string[];
  rows: ProgressionRow<T>[];
}

/**
 * Words the table prints that the page does not write.
 *
 * @property {string} feat - The feat row label
 * @property {(label: string) => string} specialization - The specialization feature label from the vocation's word
 */
export interface ProgressionLabels {
  feat: string;
  specialization: (label: string) => string;
}

const DEFAULT_LEVELS = 20;
const FEATURES_LABEL = /^features$/i;

const DEFAULT_LABELS: ProgressionLabels = {
  feat: 'Feat',
  specialization: (label) => `${label} Feature`,
};

/**
 * Tier bonus at a level: one step per three, floor one.
 *
 * @param {number} level - Level
 * @returns {number} Bonus
 */
export function tierBonusAt(level: number): number {
  return Math.max(1, Math.ceil(level / 3));
}

/**
 * Levels from a written list such as `4, 8, 12`.
 *
 * @param {string | undefined} text - Written list
 * @returns {number[]} Levels, in order, unreadable entries dropped
 */
export function parseLevels(text: string | undefined): number[] {
  if (!text) return [];
  return text
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((level) => Number.isInteger(level) && level > 0);
}

/**
 * A specialization declaration such as `Id: 6, 10, 14`; without a label the
 * word is Specialization.
 *
 * @param {string | undefined} text - Written declaration
 * @returns {{ label: string; levels: number[] } | undefined} Label and levels, or undefined when nothing was written
 */
export function parseSpecialization(
  text: string | undefined,
): { label: string; levels: number[] } | undefined {
  if (!text || text.trim() === '') return undefined;
  const colon = text.indexOf(':');
  const label = colon >= 0 ? text.slice(0, colon).trim() : 'Specialization';
  const levels = parseLevels(colon >= 0 ? text.slice(colon + 1) : text);
  return { label: label || 'Specialization', levels };
}

/**
 * The value of a column at every level from 1 to `levels`.
 *
 * @param {ColumnSpec<T>} column - Column
 * @param {number} levels - Last level
 * @returns {(T | undefined)[]} One value per level; undefined where the column has none yet
 */
export function expandColumn<T>(column: ColumnSpec<T>, levels: number): (T | undefined)[] {
  const out: (T | undefined)[] = [];
  if (column.values) {
    for (let level = 1; level <= levels; level += 1) {
      const index = Math.min(level, column.values.length) - 1;
      out.push(index >= 0 ? column.values[index] : undefined);
    }
    return out;
  }
  const byLevel = new Map<number, ColumnEntry<T>>();
  let cursor = 0;
  for (const entry of column.entries ?? []) {
    cursor = entry.at ?? cursor + 1;
    byLevel.set(cursor, entry);
  }
  let carried: T | undefined;
  for (let level = 1; level <= levels; level += 1) {
    const entry = byLevel.get(level);
    if (entry?.unique) {
      out.push(entry.value);
      continue;
    }
    if (entry) carried = entry.value;
    out.push(carried);
  }
  return out;
}

/**
 * Last level a column declares.
 *
 * @param {ColumnSpec<T>} column - Column
 * @returns {number} Level, 0 for an empty column
 */
function columnExtent<T>(column: ColumnSpec<T>): number {
  if (column.values) return column.values.length;
  let cursor = 0;
  for (const entry of column.entries ?? []) cursor = entry.at ?? cursor + 1;
  return cursor;
}

/**
 * Last level the table prints: what was written, else the last level anything
 * declares, never below the default.
 *
 * @param {ProgressionSpec<T>} spec - Spec
 * @returns {number} Level
 */
export function lastLevel<T>(spec: ProgressionSpec<T>): number {
  if (spec.levels) return spec.levels;
  const declared = [
    ...spec.headings.map((h) => h.level),
    ...(spec.feats ?? []),
    ...(spec.specialization?.levels ?? []),
    ...spec.columns.map(columnExtent),
  ];
  return Math.max(DEFAULT_LEVELS, ...declared);
}

/**
 * Builds the table.
 *
 * @param {ProgressionSpec<T>} spec - Spec
 * @param {ProgressionLabels} [labels] - Printed words; English by default
 * @returns {ProgressionTable<T>} Table
 */
export function buildProgression<T>(
  spec: ProgressionSpec<T>,
  labels: ProgressionLabels = DEFAULT_LABELS,
): ProgressionTable<T> {
  const levels = lastLevel(spec);
  const featureColumn = spec.columns.find((c) => FEATURES_LABEL.test(c.label));
  const declared = spec.columns.filter((c) => !FEATURES_LABEL.test(c.label));
  const declaredCells = declared.map((c) => expandColumn(c, levels));
  const milestones = featureColumn
    ? expandColumn({ ...featureColumn, entries: featureColumn.entries?.map((e) => ({ ...e, unique: true })) }, levels)
    : [];
  const casting = spec.casting ? castingColumns(spec.casting, levels) : { columns: [], cells: [] };
  const feats = new Set(spec.feats ?? []);
  const specialization = new Set(spec.specialization?.levels ?? []);

  const rows: ProgressionRow<T>[] = [];
  for (let level = 1; level <= levels; level += 1) {
    const features: FeatureCell<T>[] = spec.headings
      .filter((h) => h.level === level)
      .map((h) => ({ kind: 'heading', value: h.name }));
    const milestone = milestones[level - 1];
    if (milestone !== undefined && milestone !== '') {
      features.push({ kind: 'milestone', value: milestone });
    }
    const namesFeat = features.some(
      (f) => typeof f.value === 'string' && f.value.trim().toLowerCase() === labels.feat.toLowerCase(),
    );
    if (feats.has(level) && !namesFeat) features.push({ kind: 'feat', value: labels.feat });
    if (specialization.has(level) && spec.specialization) {
      features.push({ kind: 'specialization', value: labels.specialization(spec.specialization.label) });
    }
    rows.push({
      level,
      tierBonus: tierBonusAt(level),
      features,
      cells: [...declaredCells.map((column) => column[level - 1]), ...(casting.cells[level - 1] ?? [])],
    });
  }
  return { columns: [...declared.map((c) => c.label), ...casting.columns], rows };
}

/**
 * A features cell as one line of text, the way a markdown table writes it.
 *
 * @param {FeatureCell<T>[]} features - Cell
 * @param {(value: T) => string} [text] - How a milestone value prints; String by default
 * @returns {string} Names joined by commas, or a dash for none
 */
export function featuresText<T>(
  features: FeatureCell<T>[],
  text: (value: T) => string = String,
): string {
  const names = features.map((f) => (typeof f.value === 'string' ? f.value : text(f.value)));
  return names.length ? names.join(', ') : '—';
}

/**
 * Items of a comma-separated attribute value, trimmed; empty items stay as
 * empty cells, and an empty or missing value is no list at all.
 *
 * @param {string} [text] - Attribute value
 * @returns {string[]} Items
 */
export function splitList(text?: string): string[] {
  if (text === undefined || text.trim() === '') return [];
  return text.split(',').map((item) => item.trim());
}
