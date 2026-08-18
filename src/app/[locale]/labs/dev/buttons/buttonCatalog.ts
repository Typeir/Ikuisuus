/**
 * @fileoverview Derives the canonical button catalogue from source at render time.
 * @description Parses `src/styles/buttons.module.scss` for variant names, doc comments
 * and group headers, then counts reach through both distribution channels: direct
 * `btn.<variant>` references in TSX, and bespoke classes that `@include` a mixin only
 * that variant uses. Nothing is hardcoded, so the catalogue cannot drift.
 *
 * @module app/[locale]/labs/dev/buttons/buttonCatalog
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveModuleName, type ButtonClassUse } from './buttonInventory';
import { baseDeclarations, compileScss } from './scssCompiler';

const SRC = path.join(process.cwd(), 'src');
export const CANONICAL_STYLESHEET = path
  .join(SRC, 'styles', 'buttons.module.scss')
  .split(path.sep)
  .join('/');

/**
 * One `btn.<variant>` call site.
 *
 * @interface ButtonUsage
 * @property {string} module - Owning module, e.g. `character-builder`.
 * @property {string} file - File basename.
 * @property {string} relativePath - Path relative to the repo root.
 * @property {number} line - 1-indexed line number.
 */
export interface ButtonUsage {
  module: string;
  file: string;
  relativePath: string;
  line: number;
}

/**
 * A canonical button variant declared in `buttons.module.scss`.
 *
 * @interface ButtonVariant
 * @property {string} name - Class name as authored.
 * @property {string} doc - Doc comment text, empty when the class carries none.
 * @property {string} group - Section header the class sits under.
 * @property {string[]} mixins - Mixins the class includes.
 * @property {string[]} signatureMixins - Mixins no other canonical class uses.
 * @property {ButtonUsage[]} usages - Direct `btn.<name>` call sites.
 * @property {string[]} mixinConsumers - Bespoke classes reaching it via a signature mixin.
 * @property {Record<string, string>} decls - Resolved declarations.
 */
export interface ButtonVariant {
  name: string;
  doc: string;
  group: string;
  mixins: string[];
  signatureMixins: string[];
  usages: ButtonUsage[];
  mixinConsumers: string[];
  decls: Record<string, string>;
}

/**
 * Finds the line a class block opens on, using plain string comparison so no
 * escaping is involved.
 *
 * @function findClassLine
 * @param {string[]} lines - Stylesheet split into lines.
 * @param {string} className - Class to locate, without the leading dot.
 * @returns {number} 1-indexed line, or 0 when not found.
 */
export function findClassLine(lines: string[], className: string): number {
  const target = `.${className}`;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed.startsWith(target)) continue;
    const after = trimmed.slice(target.length);
    const bounded = after === '' || '{ ,:'.includes(after.charAt(0));
    if (bounded && trimmed.includes('{')) return index + 1;
  }
  return 0;
}

/**
 * Collects the `@include` names inside a class block, tracking brace depth.
 *
 * @function classMixins
 * @param {string[]} lines - Stylesheet split into lines.
 * @param {string} className - Class to inspect, without the leading dot.
 * @returns {string[]} Unique mixin names in source order.
 */
export function classMixins(lines: string[], className: string): string[] {
  const start = findClassLine(lines, className) - 1;
  if (start < 0) return [];
  const mixins: string[] = [];
  let depth = 0;

  for (let index = start; index < lines.length; index += 1) {
    for (const char of lines[index]) {
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
    }
    const include = lines[index].match(/@include\s+([A-Za-z][\w-]*)/);
    if (include) mixins.push(include[1]);
    if (depth <= 0 && index >= start) break;
  }

  return [...new Set(mixins)];
}

/**
 * Extracts variant names, doc comments and group headers from stylesheet source.
 * Declaration order is preserved so the page mirrors the file.
 *
 * @function parseVariants
 * @param {string} scss - Contents of `buttons.module.scss`.
 * @returns {Array<{ name: string; doc: string; group: string }>} Parsed variants.
 */
export function parseVariants(
  scss: string,
): Array<{ name: string; doc: string; group: string }> {
  const variants: Array<{ name: string; doc: string; group: string }> = [];
  const lines = scss.split(/\r?\n/);
  let group = 'Ungrouped';
  let doc: string[] = [];
  let inDoc = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const groupMatch = trimmed.match(/^\/\*\s*[─-]+\s*(.+?)\s*[─-]+\s*\*\/$/);
    if (groupMatch) {
      group = groupMatch[1].trim();
      continue;
    }

    if (trimmed.startsWith('/**')) {
      inDoc = true;
      doc = [];
      const single = trimmed.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
      if (single) {
        doc = single[1] ? [single[1]] : [];
        inDoc = false;
      } else {
        const head = trimmed.replace(/^\/\*\*/, '').trim();
        if (head) doc.push(head);
      }
      continue;
    }

    if (inDoc) {
      if (trimmed.endsWith('*/')) {
        inDoc = false;
        const tail = trimmed.replace(/\*\/$/, '').replace(/^\*/, '').trim();
        if (tail) doc.push(tail);
        continue;
      }
      const body = trimmed.replace(/^\*/, '').trim();
      if (body) doc.push(body);
      continue;
    }

    const classMatch = trimmed.match(/^\.([A-Za-z][A-Za-z0-9]*)\s*\{$/);
    if (classMatch) {
      variants.push({ name: classMatch[1], doc: doc.join(' '), group });
      doc = [];
    }
  }

  return variants;
}

/**
 * Marks button-family mixins used by exactly one canonical variant, so a bespoke
 * class including one can be attributed to that variant unambiguously. Generic
 * helpers such as `disabled-state` are excluded, and a mixin shared by several
 * variants (`icon-transparent`) attributes to none rather than over-counting.
 *
 * @function signatureMixins
 * @param {Record<string, string[]>} mixinsByVariant - Mixins per canonical variant.
 * @returns {Record<string, string>} Mixin name to the variant that owns it.
 */
export function signatureMixins(
  mixinsByVariant: Record<string, string[]>,
): Record<string, string> {
  const owners: Record<string, string[]> = {};
  for (const [variant, mixins] of Object.entries(mixinsByVariant)) {
    for (const mixin of mixins) {
      if (!/^(button-|icon-)/.test(mixin)) continue;
      (owners[mixin] ??= []).push(variant);
    }
  }
  return Object.fromEntries(
    Object.entries(owners)
      .filter(([, variants]) => variants.length === 1)
      .map(([mixin, variants]) => [mixin, variants[0]]),
  );
}

/**
 * Compiles the canonical stylesheet and returns each variant's declarations.
 * Used to score bespoke classes before the full catalogue is assembled.
 *
 * @async
 * @function loadCanonicalDeclarations
 * @returns {Promise<Record<string, Record<string, string>>>} Declarations by variant.
 */
export async function loadCanonicalDeclarations(): Promise<
  Record<string, Record<string, string>>
> {
  const scss = await fs.readFile(CANONICAL_STYLESHEET, 'utf-8');
  const rules = await compileScss(CANONICAL_STYLESHEET);
  return Object.fromEntries(
    parseVariants(scss).map((variant) => [
      variant.name,
      baseDeclarations(rules, variant.name),
    ]),
  );
}

/**
 * Loads canonical variants with usage counts from both distribution channels.
 *
 * @async
 * @function loadCanonicalVariants
 * @param {Array<{ className: string; mixins: string[]; scss: string }>} bespoke -
 * Bespoke classes, used to attribute mixin-channel reach.
 * @param {ButtonClassUse[]} uses - Class uses from a single tree scan.
 * @returns {Promise<ButtonVariant[]>} Variants in stylesheet declaration order.
 */
export async function loadCanonicalVariants(
  bespoke: Array<{ className: string; mixins: string[]; scss: string }>,
  uses: ButtonClassUse[],
): Promise<ButtonVariant[]> {
  const scss = await fs.readFile(CANONICAL_STYLESHEET, 'utf-8');
  const lines = scss.split(/\r?\n/);
  const parsed = parseVariants(scss);
  const rules = await compileScss(CANONICAL_STYLESHEET);

  const mixinsByVariant = Object.fromEntries(
    parsed.map((variant) => [variant.name, classMixins(lines, variant.name)]),
  );
  const owners = signatureMixins(mixinsByVariant);

  const direct: Record<string, ButtonUsage[]> = {};
  for (const use of uses) {
    if (use.stylesheet !== CANONICAL_STYLESHEET) continue;
    (direct[use.className] ??= []).push({
      module: resolveModuleName(use.tsx),
      file: use.tsx.split('/').pop() ?? use.tsx,
      relativePath: use.tsx,
      line: use.line,
    });
  }

  return parsed.map((variant) => ({
    ...variant,
    mixins: mixinsByVariant[variant.name] ?? [],
    signatureMixins: Object.entries(owners)
      .filter(([, owner]) => owner === variant.name)
      .map(([mixin]) => mixin),
    usages: direct[variant.name] ?? [],
    mixinConsumers: bespoke
      .filter((entry) =>
        entry.mixins.some((mixin) => owners[mixin] === variant.name),
      )
      .map((entry) => `${entry.className} (${entry.scss})`),
    decls: baseDeclarations(rules, variant.name),
  }));
}
