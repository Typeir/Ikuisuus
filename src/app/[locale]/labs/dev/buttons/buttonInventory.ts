/**
 * @fileoverview Finds every class applied to a `<button>` element in the source tree.
 * @description Parses TSX for `<button>` open tags, reads the `className` expression,
 * and resolves each `styles.foo` reference back to the stylesheet it was imported
 * from. Membership comes from real `<button>` usage, so classes named `trigger` or
 * `chevron` are found and containers named `buttonRow` are not.
 *
 * @module app/[locale]/labs/dev/buttons/buttonInventory
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const SKIP_DIRS = new Set([
  'node_modules',
  'content',
  'compiled-content',
  'labs',
]);
const QUOTES = new Set(['"', String.fromCharCode(39), String.fromCharCode(96)]);

/**
 * One class applied to a `<button>` in a TSX file.
 *
 * @interface ButtonClassUse
 * @property {string} tsx - Repo-relative path of the file.
 * @property {number} line - 1-indexed line of the `<button>` tag.
 * @property {string} stylesheet - Absolute path of the stylesheet the class came from.
 * @property {string} className - Class name as authored.
 */
export interface ButtonClassUse {
  tsx: string;
  line: number;
  stylesheet: string;
  className: string;
}

const toPosix = (value: string) => value.split(path.sep).join('/');

/**
 * Maps a repo-relative path to the module that owns it.
 *
 * @function resolveModuleName
 * @param {string} relativePath - Path relative to the repo root, POSIX separators.
 * @returns {string} Owning module name.
 */
export function resolveModuleName(relativePath: string): string {
  const segments = relativePath.split('/');
  if (segments[0] !== 'src') return segments[0] ?? 'unknown';
  if (segments[1] === 'modules') return segments[2] ?? 'modules';
  return segments[1] ?? 'src';
}

/**
 * Extracts the text of every `<button>` open tag, brace- and quote-aware so that
 * `>` inside a JSX expression does not terminate the tag early.
 *
 * @function buttonTags
 * @param {string} source - TSX file contents.
 * @returns {Array<{ text: string; index: number }>} Tag text with its offset.
 */
export function buttonTags(
  source: string,
): Array<{ text: string; index: number }> {
  const tags: Array<{ text: string; index: number }> = [];
  let cursor = source.indexOf('<button');

  while (cursor !== -1) {
    let depth = 0;
    let quote: string | null = null;
    let end = cursor;

    for (; end < source.length; end += 1) {
      const char = source[end];
      if (quote) {
        if (char === quote) quote = null;
        continue;
      }
      if (QUOTES.has(char)) quote = char;
      else if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
      else if (char === '>' && depth === 0) break;
    }

    tags.push({ text: source.slice(cursor, end + 1), index: cursor });
    cursor = source.indexOf('<button', end + 1);
  }

  return tags;
}

/**
 * Reads `identifier.property` pairs out of a tag's `className` expression.
 *
 * @function classRefsFromTag
 * @param {string} tagText - Text of one `<button>` open tag.
 * @returns {Array<{ ident: string; prop: string }>} Referenced style bindings.
 */
export function classRefsFromTag(
  tagText: string,
): Array<{ ident: string; prop: string }> {
  const expression = tagText.match(
    /className=\{([\s\S]*?)\}\s*(?:[a-zA-Z-]+=|\/?>)/,
  );
  if (!expression) return [];
  return [
    ...expression[1].matchAll(/\b([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)/g),
  ].map((match) => ({ ident: match[1], prop: match[2] }));
}

/**
 * Maps default-imported stylesheet identifiers to absolute paths.
 *
 * @function resolveScssImports
 * @param {string} source - TSX file contents.
 * @param {string} fromFile - Absolute path of the importing file.
 * @returns {Record<string, string>} Identifier to absolute stylesheet path.
 */
export function resolveScssImports(
  source: string,
  fromFile: string,
): Record<string, string> {
  const imports: Record<string, string> = {};
  const pattern = /import\s+([A-Za-z_$][\w$]*)\s+from\s+'([^']+\.scss)'/g;

  for (const match of source.matchAll(pattern)) {
    const spec = match[2];
    const resolved = spec.startsWith('@/')
      ? path.join(SRC, spec.slice(2))
      : path.resolve(path.dirname(fromFile), spec);
    imports[match[1]] = toPosix(resolved);
  }

  return imports;
}

/**
 * Distinguishes a state modifier from a class that styles the button itself.
 *
 * @function isStateModifier
 * @param {Record<string, string>} decls - Resolved declarations.
 * @returns {boolean} True when the class only tweaks an existing button.
 */
export function isStateModifier(decls: Record<string, string>): boolean {
  const keys = Object.keys(decls);
  const structural = [
    'cursor',
    'padding',
    'border',
    'background',
    'background-color',
  ];
  if (!structural.some((key) => keys.includes(key))) return true;
  return (
    keys.length <= 3 && !keys.includes('cursor') && !keys.includes('padding')
  );
}

/**
 * Jaccard similarity over property/value pairs.
 *
 * @function similarity
 * @param {Record<string, string>} a - First declaration block.
 * @param {Record<string, string>} b - Second declaration block.
 * @returns {number} Overlap between 0 and 1.
 */
export function similarity(
  a: Record<string, string>,
  b: Record<string, string>,
): number {
  const setA = new Set(Object.entries(a).map(([k, v]) => k + ':' + v));
  const setB = new Set(Object.entries(b).map(([k, v]) => k + ':' + v));
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  for (const entry of setA) if (setB.has(entry)) shared += 1;
  return shared / (setA.size + setB.size - shared);
}

/**
 * Recursively collects `.tsx` files under a directory.
 *
 * @async
 * @function collectTsxFiles
 * @param {string} dir - Absolute directory to walk.
 * @returns {Promise<string[]>} Absolute file paths.
 */
async function collectTsxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      found.push(...(await collectTsxFiles(path.join(dir, entry.name))));
      continue;
    }
    if (entry.name.endsWith('.tsx')) found.push(path.join(dir, entry.name));
  }

  return found;
}

/**
 * Scans the source tree for every class applied to a `<button>`.
 *
 * @async
 * @function collectButtonClassUses
 * @returns {Promise<{ uses: ButtonClassUse[]; bareCount: number; tagCount: number }>}
 * Class uses plus counts for bare buttons and total tags.
 */
export async function collectButtonClassUses(): Promise<{
  uses: ButtonClassUse[];
  bareCount: number;
  tagCount: number;
}> {
  const files = await collectTsxFiles(SRC);
  const uses: ButtonClassUse[] = [];
  let bareCount = 0;
  let tagCount = 0;

  for (const file of files) {
    const source = await fs.readFile(file, 'utf-8');
    const imports = resolveScssImports(source, file);
    const relativePath = toPosix(path.relative(process.cwd(), file));

    for (const tag of buttonTags(source)) {
      tagCount += 1;
      const line = source.slice(0, tag.index).split('\n').length;
      const refs = classRefsFromTag(tag.text).filter(
        (ref) => imports[ref.ident],
      );
      if (!refs.length) {
        bareCount += 1;
        continue;
      }
      for (const ref of refs) {
        uses.push({
          tsx: relativePath,
          line,
          stylesheet: imports[ref.ident],
          className: ref.prop,
        });
      }
    }
  }

  return { uses, bareCount, tagCount };
}
