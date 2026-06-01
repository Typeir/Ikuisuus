/**
 * @fileoverview Extracts the first non-empty paragraph from a heading block.
 * @module modules/library/infrastructure/content/extractFirstParagraph
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

/**
 * Returns the first non-empty paragraph from heading block text.
 *
 * @param {string} blockText - Heading block text including heading line.
 * @returns {string} First paragraph or empty string.
 */
export function extractFirstParagraph(blockText: string): string {
  const body = blockText.split('\n').slice(1).join('\n');

  return (
    body
      .split(/\n\n+/)
      .map((paragraph) => paragraph.trim())
      .find((paragraph) => paragraph.length > 0) ?? ''
  );
}
