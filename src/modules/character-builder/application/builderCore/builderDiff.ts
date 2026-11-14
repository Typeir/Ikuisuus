/**
 * @fileoverview Leaf-level JSON diff for builder state and keyed diff for flags.
 *
 * @module modules/character-builder/application/builderCore/builderDiff
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import type { BuilderFlag, FlagDiff, StateChange } from './types';

/**
 * True for plain objects and arrays.
 *
 * @function isContainer
 * @param {unknown} value - Candidate
 * @returns {boolean} True when `value` is a non-null object
 */
function isContainer(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Appends a key to a path.
 *
 * @function joinPath
 * @param {string} base - Parent path
 * @param {string} key - Child key or array index
 * @param {boolean} isIndex - True for array indices
 * @returns {string} Joined path
 */
function joinPath(base: string, key: string, isIndex: boolean): string {
  if (isIndex) return `${base}[${key}]`;
  return base ? `${base}.${key}` : key;
}

/**
 * Collects changed leaves between two values into `out`.
 *
 * @function walk
 * @param {unknown} before - Old value
 * @param {unknown} after - New value
 * @param {string} path - Current path
 * @param {StateChange[]} out - Accumulator; mutated
 * @returns {void}
 */
function walk(
  before: unknown,
  after: unknown,
  path: string,
  out: StateChange[],
): void {
  if (Object.is(before, after)) return;
  const bothArrays = Array.isArray(before) && Array.isArray(after);
  const bothObjects =
    isContainer(before) &&
    isContainer(after) &&
    !Array.isArray(before) &&
    !Array.isArray(after);
  if (!bothArrays && !bothObjects) {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      out.push({ path, before, after });
    }
    return;
  }
  const a = before as Record<string, unknown>;
  const b = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    walk(a[key], b[key], joinPath(path, key, bothArrays), out);
  }
}

/**
 * Lists every changed leaf between two JSON-safe values.
 *
 * @function diffJson
 * @param {unknown} before - Old value
 * @param {unknown} after - New value
 * @returns {StateChange[]} Changes in key order; empty when equal
 */
export function diffJson(before: unknown, after: unknown): StateChange[] {
  const out: StateChange[] = [];
  walk(before, after, '', out);
  return out;
}

/**
 * Identity of a flag: its code.
 *
 * @function flagIdentity
 * @param {BuilderFlag} flag - Flag
 * @returns {string} Identity key
 */
function flagIdentity(flag: BuilderFlag): string {
  return flag.code;
}

/**
 * Splits two flag lists into added, removed, and changed flags.
 *
 * @function diffFlags
 * @param {BuilderFlag[]} before - Old flags
 * @param {BuilderFlag[]} after - New flags
 * @returns {FlagDiff} Flag delta
 */
export function diffFlags(before: BuilderFlag[], after: BuilderFlag[]): FlagDiff {
  const old = new Map(before.map((flag) => [flagIdentity(flag), flag]));
  const next = new Map(after.map((flag) => [flagIdentity(flag), flag]));
  return {
    added: after.filter((flag) => !old.has(flagIdentity(flag))),
    removed: before.filter((flag) => !next.has(flagIdentity(flag))),
    changed: after.filter((flag) => {
      const prior = old.get(flagIdentity(flag));
      return prior !== undefined && JSON.stringify(prior) !== JSON.stringify(flag);
    }),
  };
}
