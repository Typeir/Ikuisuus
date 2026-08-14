/**
 * @fileoverview Extracts the first substantive prose paragraph from raw MDX
 * source for og:description and twitter:description meta values.
 *
 * @module lib/seo/extractDescription
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

const FRONTMATTER_BLOCK = /^---[\s\S]*?---\n?/;
const HEADING_LINE = /^#{1,6}\s+.+/;
const JSX_OPEN_TAG = /^<[A-Z]/;
const BLOCKQUOTE_LINE = /^>/;
const HR_LINE = /^---$/;
const ITALIC_ONLY_LINE = /^_[^_]+_\s*$/;
const BOLD_LIST_LINE = /^\s*[-*]\s+\*\*/;
const MAX_DESCRIPTION_LENGTH = 160;
const MIN_PARAGRAPH_LENGTH = 30;

/**
 * Removes the YAML frontmatter block from raw MDX content.
 *
 * @param {string} content - Raw MDX source with optional frontmatter.
 * @returns {string} Content string with the frontmatter block removed.
 */
function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_BLOCK, '');
}

/**
 * Determines whether a single line is structural rather than prose.
 *
 * @param {string} line - A single line of MDX text.
 * @returns {boolean} True when the line should be excluded from prose candidates.
 */
function isStructuralLine(line: string): boolean {
  return (
    HEADING_LINE.test(line) ||
    JSX_OPEN_TAG.test(line) ||
    BLOCKQUOTE_LINE.test(line) ||
    HR_LINE.test(line) ||
    ITALIC_ONLY_LINE.test(line) ||
    BOLD_LIST_LINE.test(line)
  );
}

/**
 * Normalises a paragraph by collapsing internal whitespace.
 *
 * @param {string} paragraph - Raw paragraph text from split MDX body.
 * @returns {string} Trimmed, single-space-separated paragraph string.
 */
function normaliseParagraph(paragraph: string): string {
  return paragraph.replace(/\s+/g, ' ').trim();
}

/**
 * Splits MDX body content into paragraph-level blocks, excluding blocks
 * whose every line is structural.
 *
 * @param {string} content - MDX content with frontmatter already removed.
 * @returns {string[]} Non-structural paragraph blocks.
 */
function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .filter((block) => !block.split('\n').every(isStructuralLine));
}

/**
 * Filters normalised paragraph candidates to substantive prose only.
 *
 * @param {string[]} paragraphs - Normalised paragraph strings.
 * @returns {string[]} Prose-only paragraphs above the minimum length.
 */
function filterProseParagraphs(paragraphs: string[]): string[] {
  return paragraphs
    .map(normaliseParagraph)
    .filter((p) => p.length >= MIN_PARAGRAPH_LENGTH && !p.startsWith('<'));
}

/**
 * Truncates a description string to the maximum allowed length, appending
 * an ellipsis when truncation occurs.
 *
 * @param {string} text - Description text to truncate.
 * @returns {string} Truncated description string.
 */
function truncateDescription(text: string): string {
  if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
  return `${text.slice(0, MAX_DESCRIPTION_LENGTH - 3)}...`;
}

/**
 * Extracts the first substantive prose paragraph from raw MDX source.
 *
 * @param {string} content - Raw MDX source string.
 * @returns {string | null} First prose paragraph or null if none is found.
 */
export function extractDescriptionFromMdx(content: string): string | null {
  const bodyContent = stripFrontmatter(content);
  const candidates = splitIntoParagraphs(bodyContent);
  const prose = filterProseParagraphs(candidates);
  const first = prose[0];
  if (!first) return null;
  return truncateDescription(first);
}
