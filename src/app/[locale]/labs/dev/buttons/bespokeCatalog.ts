/**
 * @fileoverview Inventories the button classes that live outside `buttons.module.scss`.
 * @description Every class applied to a `<button>` from a module stylesheet, compiled
 * to its resolved declarations so mixin-produced styles are visible. Each entry is
 * scored against the canonical variants, and split by whether it was built on a
 * canonical mixin or hand-rolled from nothing.
 *
 * @module app/[locale]/labs/dev/buttons/bespokeCatalog
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_STYLESHEET,
  classMixins,
  findClassLine,
} from './buttonCatalog';
import {
  isStateModifier,
  resolveModuleName,
  similarity,
  type ButtonClassUse,
} from './buttonInventory';
import { baseDeclarations, compileScss, type CssRule } from './scssCompiler';

const BUTTON_MIXIN = /^(button-|icon-)/;

/**
 * A button class declared outside the canonical stylesheet.
 *
 * @interface BespokeButton
 * @property {string} id - Stable identifier used to scope the preview style.
 * @property {string} className - Class name as authored.
 * @property {string} module - Owning module of the stylesheet.
 * @property {string} stylesheet - Stylesheet path relative to the repo root.
 * @property {number} line - 1-indexed declaration line, 0 when not locatable.
 * @property {Record<string, string>} decls - Resolved base declarations.
 * @property {string[]} mixins - Every mixin the class includes.
 * @property {string[]} buttonMixins - Mixins from the canonical button/icon families.
 * @property {'mixin' | 'handrolled'} channel - How the class was built.
 * @property {{ name: string | null; score: number }} nearest - Closest canonical variant.
 * @property {Array<{ relativePath: string; line: number; module: string; file: string }>} usages - Call sites.
 * @property {boolean} isModifier - True when the class only tweaks an existing button.
 */
export interface BespokeButton {
  id: string;
  className: string;
  module: string;
  stylesheet: string;
  line: number;
  decls: Record<string, string>;
  mixins: string[];
  buttonMixins: string[];
  channel: 'mixin' | 'handrolled';
  nearest: { name: string | null; score: number };
  usages: Array<{
    relativePath: string;
    line: number;
    module: string;
    file: string;
  }>;
  isModifier: boolean;
}

/**
 * Groups class uses by the stylesheet and class they refer to.
 *
 * @function groupUses
 * @param {ButtonClassUse[]} uses - Raw class uses.
 * @returns {Map<string, ButtonClassUse[]>} Uses keyed by `stylesheet::className`.
 */
export function groupUses(
  uses: ButtonClassUse[],
): Map<string, ButtonClassUse[]> {
  const grouped = new Map<string, ButtonClassUse[]>();
  for (const use of uses) {
    if (use.stylesheet === CANONICAL_STYLESHEET) continue;
    const key = `${use.stylesheet}::${use.className}`;
    grouped.set(key, [...(grouped.get(key) ?? []), use]);
  }
  return grouped;
}

/**
 * Picks the canonical variant whose declarations overlap most.
 *
 * @function nearestCanonical
 * @param {Record<string, string>} decls - Resolved declarations to match.
 * @param {Record<string, Record<string, string>>} canonical - Canonical declarations.
 * @returns {{ name: string | null; score: number }} Best match and its score.
 */
export function nearestCanonical(
  decls: Record<string, string>,
  canonical: Record<string, Record<string, string>>,
): { name: string | null; score: number } {
  let best: { name: string | null; score: number } = { name: null, score: 0 };
  for (const [name, other] of Object.entries(canonical)) {
    const score = similarity(decls, other);
    if (score > best.score) best = { name, score };
  }
  return best;
}

/**
 * Builds the bespoke button inventory, compiling each stylesheet once.
 *
 * @async
 * @function loadBespokeButtons
 * @param {Record<string, Record<string, string>>} canonical - Canonical declarations
 * keyed by variant name, used for similarity scoring.
 * @param {ButtonClassUse[]} uses - Class uses from a single tree scan.
 * @returns {Promise<BespokeButton[]>} Entries sorted by call-site count.
 */
export async function loadBespokeButtons(
  canonical: Record<string, Record<string, string>>,
  uses: ButtonClassUse[],
): Promise<BespokeButton[]> {
  const grouped = groupUses(uses);

  const ruleCache = new Map<string, CssRule[]>();
  const sourceCache = new Map<string, string[]>();
  const entries: BespokeButton[] = [];
  let index = 0;

  for (const [key, group] of grouped) {
    const [stylesheet, className] = key.split('::');

    if (!ruleCache.has(stylesheet)) {
      ruleCache.set(stylesheet, await compileScss(stylesheet));
    }
    if (!sourceCache.has(stylesheet)) {
      const raw = await fs.readFile(stylesheet, 'utf-8').catch(() => '');
      sourceCache.set(stylesheet, raw.split(/\r?\n/));
    }

    const rules = ruleCache.get(stylesheet) ?? [];
    const lines = sourceCache.get(stylesheet) ?? [];
    const decls = baseDeclarations(rules, className);
    const mixins = classMixins(lines, className);
    const buttonMixins = mixins.filter((mixin) => BUTTON_MIXIN.test(mixin));
    const relativeSheet = path
      .relative(process.cwd(), stylesheet)
      .split(path.sep)
      .join('/');

    index += 1;
    entries.push({
      id: `bespoke-${index}`,
      className,
      module: resolveModuleName(relativeSheet),
      stylesheet: relativeSheet,
      line: findClassLine(lines, className),
      decls,
      mixins,
      buttonMixins,
      channel: buttonMixins.length ? 'mixin' : 'handrolled',
      nearest: nearestCanonical(decls, canonical),
      usages: group.map((use) => ({
        relativePath: use.tsx,
        line: use.line,
        module: resolveModuleName(use.tsx),
        file: use.tsx.split('/').pop() ?? use.tsx,
      })),
      isModifier: isStateModifier(decls),
    });
  }

  return entries.sort(
    (a, b) =>
      b.usages.length - a.usages.length ||
      Object.keys(b.decls).length - Object.keys(a.decls).length,
  );
}
