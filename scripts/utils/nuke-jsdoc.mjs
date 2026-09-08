/**
 * @fileoverview Cuts every JSDoc block and stylesheet comment in the corpus to its first sentence.
 * @description A comment ends at its first terminator, at a spaced colon, or at the next comma past the word budget.
 * @see EXCLUDED_DIRS for the directories the nuker never enters.
 *
 * @module scripts/utils/nuke-jsdoc
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * File extensions the nuker parses.
 */
export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

/**
 * Stylesheet extensions the nuker parses.
 */
export const STYLE_EXTENSIONS = ['.scss', '.sass', '.css'];

/**
 * Words a first sentence may run before the next comma ends it.
 */
export const WORD_BUDGET = 12;

/**
 * Directory names the nuker never enters, source and tests alike.
 */
export const EXCLUDED_DIRS = ['world-sim', 'worldSim'];

/**
 * Tags whose text is kept whole.
 */
export const VERBATIM_TAGS = new Set(['example']);

const KNOWN_TAGS = new Set([
  'abstract', 'access', 'alias', 'async', 'augments', 'author', 'borrows', 'callback',
  'class', 'classdesc', 'component', 'const', 'constant', 'constructor', 'constructs',
  'copyright', 'default', 'defaultvalue', 'deprecated', 'description', 'desc', 'enum',
  'event', 'example', 'exports', 'extends', 'external', 'file', 'fileoverview', 'fires',
  'function', 'func', 'generator', 'global', 'hideconstructor', 'ignore', 'implements',
  'inheritdoc', 'inner', 'instance', 'interface', 'internal', 'kind', 'lends', 'license',
  'link', 'listens', 'member', 'memberof', 'method', 'mixes', 'mixin', 'module', 'name',
  'namespace', 'overload', 'override', 'overview', 'package', 'param', 'arg', 'argument',
  'private', 'prop', 'property', 'protected', 'public', 'readonly', 'remarks', 'requires',
  'return', 'returns', 'satisfies', 'see', 'since', 'static', 'summary', 'template',
  'this', 'throws', 'exception', 'todo', 'tutorial', 'type', 'typedef', 'variation',
  'version', 'yields', 'yield',
]);

const TERMINATORS = '.!?';
const HARD_BREAK = ':';
const CLOSERS = ')"\']';
const LIST_MARKER = /^[ \t]*(?:\d+\.|[-*+])[ \t]/;
const ABBREVIATION = /(?:^|[\s([])(?:e\.g|i\.e|cf|vs|viz|approx|et al)$/i;
const STAR_LINE = /^(\s*)\* ?(.*)$/;
const FENCE = /^\s*```/;
const LINE_OPENER = /^\/\/ ?/;
const COMMENTED_CODE = /[;{}]$/;
const URL_OPEN = /^url\($/i;
const IDENT_CHAR = /[\w-]/;
const RUN_GAP = /^\r?\n[ \t]*$/;
const PROSE_START = /^@\w+(?:\s+\{[^}]*\})?(?:\s+\[?[\w$.'"[\]=]+\]?\s+-)?\s*/;
const SCRIPT_KINDS = {
  '.ts': ts.ScriptKind.TS,
  '.mts': ts.ScriptKind.TS,
  '.cts': ts.ScriptKind.TS,
  '.tsx': ts.ScriptKind.TSX,
  '.js': ts.ScriptKind.JS,
  '.mjs': ts.ScriptKind.JS,
  '.cjs': ts.ScriptKind.JS,
  '.jsx': ts.ScriptKind.JSX,
};
const LITERAL_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.RegularExpressionLiteral,
  ts.SyntaxKind.JsxText,
]);

function scan(text) {
  const commas = [];
  const nothing = { end: -1, keep: true, commas: [] };
  let i = 0;
  let depth = 0;
  let lineStart = true;
  while (i < text.length) {
    if (lineStart) {
      lineStart = false;
      const marker = LIST_MARKER.exec(text.slice(i));
      if (marker) {
        i += marker[0].length;
        continue;
      }
    }
    const c = text[i];
    if (c === '\n') {
      lineStart = true;
      i += 1;
      continue;
    }
    if (c === '`') {
      let run = 0;
      while (text[i + run] === '`') run += 1;
      const close = text.indexOf('`'.repeat(run), i + run);
      if (close === -1) return nothing;
      i = close + run;
      continue;
    }
    if (c === '{' || c === '[') {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === '}' || c === ']') {
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    const spaced = /\s/.test(text[i + 1] ?? ' ');
    if (depth === 0 && spaced && c === HARD_BREAK) return { end: i, keep: false, commas };
    if (depth === 0 && spaced && c === ',') commas.push(i);
    if (depth === 0 && TERMINATORS.includes(c)) {
      let j = i;
      while (j < text.length && TERMINATORS.includes(text[j])) j += 1;
      const single = c === '.' && j - i === 1;
      while (j < text.length && CLOSERS.includes(text[j])) j += 1;
      const next = text[j];
      const ends = next === undefined || /\s/.test(next);
      if (ends && !(single && ABBREVIATION.test(text.slice(0, i)))) {
        return { end: j, keep: true, commas };
      }
      i = j;
      continue;
    }
    i += 1;
  }
  return { end: -1, keep: true, commas };
}

function budgetEnd(text, commas, words, from) {
  if (!words) return -1;
  for (const at of commas) {
    if (at > from && (text.slice(from, at).match(/\S+/g) ?? []).length >= words) return at;
  }
  return -1;
}

/**
 * Index just past the first sentence terminator, or -1 without one.
 *
 * @param {string} text - Prose, possibly multi-line
 * @returns {number} Cut index
 */
export function firstSentenceEnd(text) {
  return scan(text).end;
}

/**
 * Index of the first break, and whether the break character itself is kept.
 *
 * @param {string} text - Prose, possibly multi-line
 * @param {{ words?: number, from?: number }} [options] - Word budget and prose start
 * @returns {{ end: number, keep: boolean }} Cut index and break handling
 */
export function firstBreakEnd(text, options = {}) {
  const { words = WORD_BUDGET, from = 0 } = options;
  const { end, keep, commas } = scan(text);
  const budget = budgetEnd(text, commas, words, from);
  if (end === -1 && budget === -1) return { end: -1, keep: true };
  const best =
    end !== -1 && (budget === -1 || end < budget) ? { end, keep } : { end: budget, keep: false };
  if (best.end >= text.length) return best;
  const earlier = firstBreakEnd(text.slice(0, best.end).trimEnd(), options);
  return earlier.end === -1 ? best : earlier;
}

/**
 * Text up to and including its first sentence terminator.
 *
 * @param {string} text - Prose
 * @param {{ words?: number, from?: number }} [options] - Word budget and prose start
 * @returns {string} First sentence, or the text when it has no break
 */
export function firstSentence(text, options = {}) {
  const { end, keep } = firstBreakEnd(text, options);
  if (end === -1) return text;
  return keep ? text.slice(0, end) : text.slice(0, end).trimEnd();
}

function tagOf(line, inside) {
  const match = /^@([A-Za-z]\w*)/.exec(line);
  if (!match) return null;
  const tag = match[1].toLowerCase();
  if (VERBATIM_TAGS.has(inside)) return KNOWN_TAGS.has(tag) ? tag : null;
  return /^[a-z]/.test(match[1]) ? tag : null;
}

function splitSections(lines) {
  const sections = [];
  let current = { tag: null, lines: [] };
  let inFence = false;
  for (const line of lines) {
    if (FENCE.test(line)) inFence = !inFence;
    const tag = inFence ? null : tagOf(line, current.tag);
    if (tag) {
      sections.push(current);
      current = { tag, lines: [] };
    }
    current.lines.push(line);
  }
  sections.push(current);
  return sections;
}

function cutSections(sections, options) {
  const out = [];
  let changed = false;
  sections.forEach((section, index) => {
    const last = index === sections.length - 1;
    let lines = [...section.lines];
    let trailingBlank = false;
    while (lines.length && lines[lines.length - 1].trim() === '') {
      lines.pop();
      trailingBlank = true;
    }
    if (!VERBATIM_TAGS.has(section.tag)) {
      const text = lines.join('\n');
      const from = section.tag ? (PROSE_START.exec(text)?.[0].length ?? 0) : 0;
      const cut = firstSentence(text, { ...options, from });
      if (cut !== text) {
        changed = true;
        lines = cut.split('\n');
      }
    }
    out.push(...lines);
    if (trailingBlank && !last) out.push('');
  });
  return { lines: out, changed };
}

/**
 * The block with its description and every tag cut to one sentence.
 *
 * @param {string} block - Full comment text, opener through closer
 * @param {{ words?: number, from?: number }} [options] - Word budget and prose start
 * @returns {string} Cut block, or the input when nothing was cut
 */
export function truncateJsdoc(block, options = {}) {
  if (!/^\/\*\*(?!\/)/.test(block) || !block.endsWith('*/')) return block;
  const eol = block.includes('\r\n') ? '\r\n' : '\n';
  const raw = block.slice(3, -2).split(/\r?\n/);
  if (raw.length === 1) {
    const text = raw[0].trim();
    const cut = firstSentence(text, options);
    return cut === text ? block : `/** ${cut} */`;
  }
  const head = raw[0];
  const tail = raw[raw.length - 1];
  const closingInline = tail.trim() !== '';
  const body = closingInline ? [...raw.slice(1, -1), tail.trimEnd()] : raw.slice(1, -1);
  const parsed = body.map((line) => {
    if (line.trim() === '') return { indent: null, text: '' };
    const match = STAR_LINE.exec(line);
    return match ? { indent: match[1], text: match[2] } : null;
  });
  if (parsed.some((line) => line === null)) return block;
  const starIndent = (parsed.find((line) => line.indent !== null) ?? { indent: ' ' }).indent;
  const headInline = head.trim() !== '';
  const content = parsed.map((line) => line.text);
  if (headInline) content.unshift(head.replace(/^\s/, '').trimEnd());
  const { lines, changed } = cutSections(splitSections(content), options);
  if (!changed || lines.length === 0) return block;
  const starred = lines.map((line) => (line === '' ? `${starIndent}*` : `${starIndent}* ${line}`));
  const out = headInline ? [`/** ${lines[0]}`, ...starred.slice(1)] : ['/**', ...starred];
  if (closingInline) out[out.length - 1] += ' */';
  else out.push(`${tail}*/`);
  return out.join(eol);
}

function jsdocRanges(sourceFile, source) {
  const found = new Map();
  const literals = [];
  const add = (ranges) => {
    for (const range of ranges ?? []) {
      if (range.kind !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
      if (!source.startsWith('/**', range.pos) || source.startsWith('/**/', range.pos)) continue;
      found.set(range.pos, range.end);
    }
  };
  const visit = (node) => {
    if (LITERAL_KINDS.has(node.kind)) literals.push([node.getStart(sourceFile), node.end]);
    add(ts.getLeadingCommentRanges(source, node.getFullStart()));
    add(ts.getTrailingCommentRanges(source, node.getEnd()));
    if (ts.isJSDoc(node)) return;
    for (const child of node.getChildren(sourceFile)) visit(child);
  };
  visit(sourceFile);
  const insideLiteral = (pos, end) => literals.some(([from, to]) => pos < to && end > from);
  let lastEnd = 0;
  return [...found]
    .map(([pos, end]) => ({ pos, end }))
    .sort((a, b) => a.pos - b.pos)
    .filter(({ pos, end }) => {
      if (pos < lastEnd || insideLiteral(pos, end)) return false;
      lastEnd = end;
      return true;
    });
}

/**
 * Source with every JSDoc block cut to its first sentence.
 *
 * @param {string} source - File text
 * @param {string} [fileName] - Path, for the parser's script kind
 * @returns {{ text: string, changed: boolean, count: number }} Cut text and block count
 */
export function nukeSource(source, fileName = 'file.ts', options = {}) {
  const kind = SCRIPT_KINDS[extname(fileName)] ?? ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind);
  let text = '';
  let last = 0;
  let count = 0;
  for (const { pos, end } of jsdocRanges(sourceFile, source)) {
    const block = source.slice(pos, end);
    const cut = truncateJsdoc(block, options);
    if (cut !== block) count += 1;
    text += source.slice(last, pos) + cut;
    last = end;
  }
  text += source.slice(last);
  return { text, changed: count > 0, count };
}

function skipQuoted(source, index) {
  const quote = source[index];
  let i = index + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote || source[i] === '\n') return i + 1;
    i += 1;
  }
  return source.length;
}

function skipUrl(source, index) {
  let i = index;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'") {
      i = skipQuoted(source, i);
      continue;
    }
    if (c === ')') return i + 1;
    i += 1;
  }
  return source.length;
}

function styleComments(source, allowLine) {
  const out = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'") {
      i = skipQuoted(source, i);
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      const close = source.indexOf('*/', i + 2);
      const end = close === -1 ? source.length : close + 2;
      out.push({ pos: i, end, block: true });
      i = end;
      continue;
    }
    if (allowLine && c === '/' && source[i + 1] === '/') {
      const newline = source.indexOf('\n', i);
      let end = newline === -1 ? source.length : newline;
      if (source[end - 1] === '\r') end -= 1;
      out.push({ pos: i, end, block: false });
      i = end;
      continue;
    }
    if (URL_OPEN.test(source.slice(i, i + 4)) && !IDENT_CHAR.test(source[i - 1] ?? '')) {
      i = skipUrl(source, i + 4);
      continue;
    }
    i += 1;
  }
  return out;
}

function ownLineIndent(source, pos) {
  const start = source.lastIndexOf('\n', pos - 1) + 1;
  const prefix = source.slice(start, pos);
  return prefix.trim() === '' ? prefix : null;
}

function groupComments(comments, source) {
  const groups = [];
  for (const comment of comments) {
    const previous = groups[groups.length - 1];
    const last = previous?.[previous.length - 1];
    const joins =
      last &&
      !last.block &&
      !comment.block &&
      ownLineIndent(source, comment.pos) !== null &&
      RUN_GAP.test(source.slice(last.end, comment.pos)) &&
      ownLineIndent(source, last.pos) === ownLineIndent(source, comment.pos);
    if (joins) previous.push(comment);
    else groups.push([comment]);
  }
  return groups;
}

function eolOf(source) {
  return source.includes('\r\n') ? '\r\n' : '\n';
}

function cutLineRun(group, source, options) {
  const indent = ownLineIndent(source, group[0].pos) ?? '';
  const text = group
    .map(({ pos, end }) => source.slice(pos, end).replace(LINE_OPENER, '').trimEnd())
    .join('\n')
    .trim();
  if (text === '' || COMMENTED_CODE.test(text)) return null;
  const cut = firstSentence(text, options);
  if (cut === text) return null;
  return cut
    .split('\n')
    .map((line, index) => `${index === 0 ? '' : indent}//${line === '' ? '' : ` ${line}`}`)
    .join(eolOf(source));
}

function cutStyleBlock(comment, source, options) {
  const block = source.slice(comment.pos, comment.end);
  if (/^\/\*\*(?!\/)/.test(block)) {
    const cut = truncateJsdoc(block, options);
    return cut === block ? null : cut;
  }
  if (!block.endsWith('*/')) return null;
  const text = block
    .slice(2, -2)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join('\n')
    .trim();
  if (text === '' || COMMENTED_CODE.test(text)) return null;
  const cut = firstSentence(text, options);
  if (cut === text) return null;
  const indent = `${ownLineIndent(source, comment.pos) ?? ''}   `;
  const body = cut
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${indent}${line}`))
    .join(eolOf(source));
  return `/* ${body} */`;
}

/**
 * Stylesheet source with every comment cut to its first break.
 *
 * @param {string} source - File text
 * @param {string} [fileName] - Path, deciding whether `//` opens a comment
 * @returns {{ text: string, changed: boolean, count: number }} Cut text and comment count
 */
export function nukeStyleSource(source, fileName = 'file.scss', options = {}) {
  const groups = groupComments(styleComments(source, extname(fileName) !== '.css'), source);
  let text = '';
  let last = 0;
  let count = 0;
  for (const group of groups) {
    const cut = group[0].block
      ? cutStyleBlock(group[0], source, options)
      : cutLineRun(group, source, options);
    if (cut === null) continue;
    text += source.slice(last, group[0].pos) + cut;
    last = group[group.length - 1].end;
    count += 1;
  }
  text += source.slice(last);
  return { text, changed: count > 0, count };
}

/**
 * Whether a path sits under a directory the nuker never enters.
 *
 * @param {string} file - Repo-relative path
 * @returns {boolean} True when the file is off limits
 */
export function isExcluded(file) {
  if (file.startsWith('src/content/')) return true;
  return file.split('/').slice(0, -1).some((segment) => EXCLUDED_DIRS.includes(segment));
}

/**
 * Tracked and untracked source files git does not ignore, minus the content submodule and world sim.
 *
 * @param {string[]} [inputs] - Paths or directories; empty means the whole repo
 * @returns {string[]} Repo-relative files
 */
export function corpusFiles(inputs = []) {
  const out = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', '--', ...inputs], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split('\0').filter((file) => {
    const ext = extname(file);
    const known = SOURCE_EXTENSIONS.includes(ext) || STYLE_EXTENSIONS.includes(ext);
    return file && known && !isExcluded(file) && existsSync(file);
  });
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const quiet = args.includes('--quiet');
  const only =
    (args.includes('--styles') && STYLE_EXTENSIONS) ||
    (args.includes('--code') && SOURCE_EXTENSIONS) ||
    null;
  const words = Number(args.find((arg) => arg.startsWith('--words='))?.slice(8) ?? WORD_BUDGET);
  const inputs = args.filter((arg) => !arg.startsWith('--'));
  const files = corpusFiles(inputs).filter((file) => !only || only.includes(extname(file)));
  let blocks = 0;
  let changedFiles = 0;
  for (const file of files) {
    const nuke = STYLE_EXTENSIONS.includes(extname(file)) ? nukeStyleSource : nukeSource;
    const result = nuke(readFileSync(file, 'utf8'), file, { words });
    if (!result.changed) continue;
    blocks += result.count;
    changedFiles += 1;
    if (!quiet) console.log(`${file}: ${result.count}`);
    if (write) writeFileSync(file, result.text);
  }
  const mode = write ? 'written' : 'to cut (dry run, pass --write)';
  console.log(`${blocks} comments in ${changedFiles} of ${files.length} files ${mode}`);
}

if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  main();
}
