/**
 * @fileoverview Extracts heading-bounded blocks from MDX source.
 * @module modules/library/infrastructure/content/extractHeadingBlock
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

/**
 * Extracts a heading block from MDX content.
 *
 * @param {string} content - Raw MDX content.
 * @param {string} heading - Heading text to locate.
 * @returns {string | null} Full heading block or null when not found.
 */
export function extractHeadingBlock(
  content: string,
  heading: string,
): string | null {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const target = heading.trim().toLowerCase();

  let startIndex = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.+)$/.exec(lines[i]);

    if (!match) {
      continue;
    }

    if (match[2].trim().toLowerCase() === target) {
      startIndex = i;
      headingLevel = match[1].length;
      break;
    }
  }

  if (startIndex < 0) {
    return null;
  }

  let endIndex = lines.length - 1;

  for (let i = startIndex + 1; i < lines.length; i++) {
    const match = /^(#{1,6})\s+/.exec(lines[i]);

    if (match && match[1].length <= headingLevel) {
      endIndex = i - 1;
      break;
    }
  }

  while (endIndex > startIndex && lines[endIndex].trim() === '') {
    endIndex--;
  }

  return lines.slice(startIndex, endIndex + 1).join('\n');
}
