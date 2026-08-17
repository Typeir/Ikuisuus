/**
 * @fileoverview Frontmatter Aspects
 * @description Reads and rewrites the `aspects:` list in an MDX buffer's YAML
 * frontmatter without disturbing the rest of the document. Text-level and
 * order-preserving so the editor's undo stack sees one clean replacement.
 *
 * @module modules/mdx-editor/domain/frontmatterAspects
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;
const ASPECTS_BLOCK =
  /^aspects:[ \t]*(\[[^\]\n]*\][ \t]*)?\r?\n?((?:[ \t]+-[^\n]*\r?\n?)*)/m;

/**
 * Aspects listed in the buffer's frontmatter `aspects:` (block or flow list).
 *
 * @param {string} source - Full MDX buffer
 * @returns {string[]} Aspects in document order; empty when absent
 */
export function readFrontmatterAspects(source: string): string[] {
  const fm = FRONTMATTER.exec(source)?.[1];
  if (!fm) return [];
  const match = ASPECTS_BLOCK.exec(fm);
  if (!match) return [];
  if (match[1]) {
    return match[1]
      .replace(/^\[|\][ \t]*$/g, '')
      .split(',')
      .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  return (match[2] ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[ \t]+-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/**
 * Returns the buffer with its frontmatter `aspects:` replaced by `aspects`.
 * Writes a block list; removes the key when the list is empty; creates the
 * frontmatter block when the buffer has none.
 *
 * @param {string} source - Full MDX buffer
 * @param {string[]} aspects - Aspects to write, in order
 * @returns {string} Rewritten buffer
 */
export function writeFrontmatterAspects(
  source: string,
  aspects: string[],
): string {
  const block =
    aspects.length === 0
      ? ''
      : `aspects:\n${aspects.map((a) => `  - ${a}`).join('\n')}\n`;

  const fmMatch = FRONTMATTER.exec(source);
  if (!fmMatch) {
    return block ? `---\n${block}---\n\n${source}` : source;
  }

  const fm = fmMatch[1];
  const eol = fm.includes('\r\n') ? '\r\n' : '\n';
  const nextFm = ASPECTS_BLOCK.test(fm)
    ? fm.replace(ASPECTS_BLOCK, block.replace(/\n/g, eol))
    : fm + (fm.endsWith(eol) || fm === '' ? '' : eol) + block.replace(/\n/g, eol);
  const cleaned = nextFm.replace(new RegExp(`(${eol})+$`), '');
  return source.replace(
    FRONTMATTER,
    `---${eol}${cleaned}${eol}---${fmMatch[2] ?? eol}`,
  );
}
