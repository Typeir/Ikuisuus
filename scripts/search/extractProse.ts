/**
 * @fileoverview MDX Prose Extractor
 * @description Strips MDX/JSX/frontmatter/imports/code-fences to produce
 * readable plain text for Pagefind full-text indexing.
 *
 * @module scripts/search/extractProse
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import matter from 'gray-matter';

/**
 * Removes YAML frontmatter from raw MDX content and returns the body.
 *
 * @param {string} raw - Raw file content
 * @returns {string} Body content without frontmatter
 */
function stripFrontmatter(raw: string): string {
  try {
    return matter(raw).content;
  } catch {
    return raw;
  }
}

/**
 * Strips MDX import and export blocks.
 *
 * @param {string} content - Body content
 * @returns {string} Content without import/export lines
 */
function stripMdxImports(content: string): string {
  return content
    .split('\n')
    .filter(
      (line) =>
        !/^\s*import\s/.test(line.trimStart()) &&
        !/^\s*export\s/.test(line.trimStart()),
    )
    .join('\n');
}

/**
 * Strips JSX elements and MDX gate comments (`{/* paw:... *​/}`).
 *
 * @param {string} content - Body content
 * @returns {string} Content without JSX
 */
function stripJsx(content: string): string {
  return (
    content
      // Remove self-closing JSX: <Component ... />
      .replace(/<[A-Z][^>]*\/>/g, '')
      // Remove opening JSX: <Component ...>
      .replace(/<[A-Z][^>]*>/g, '')
      // Remove closing JSX: </Component>
      .replace(/<\/[A-Z][^>]*>/g, '')
      // Remove paw gate comments: {/* paw:... */}
      .replace(/\{\/\*\s*paw:[\s\S]*?\*\/\}/g, '')
      // Remove remaining JSX comment expressions
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      // Remove JSX expression blocks: {expression}
      .replace(/\{(?!\/\*)[^}]*\}/g, '')
  );
}

/**
 * Strips Markdown code fences and inline code.
 *
 * @param {string} content - Body content
 * @returns {string} Content without code
 */
function stripCode(content: string): string {
  return (
    content
      // Remove fenced code blocks: ``` ... ```
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code: `code`
      .replace(/`{1,2}[^`]+`{1,2}/g, '')
  );
}

/**
 * Strips Markdown formatting syntax, leaving the text content.
 *
 * @param {string} content - Body content
 * @returns {string} Content with formatting stripped
 */
function stripMarkdownSyntax(content: string): string {
  return (
    content
      // Links: [text](url) → text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Images: ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Bold+italic: ***text***
      .replace(/\*{3}([^*]+)\*{3}/g, '$1')
      // Bold: **text**
      .replace(/\*{2}([^*]+)\*{2}/g, '$1')
      // Italic: *text*
      .replace(/\*([^*]+)\*/g, '$1')
      // Strikethrough: ~~text~~
      .replace(/~{2}([^~]+)~{2}/g, '$1')
      // Heading markers: ### text → text
      .replace(/^#{1,6}\s+/gm, '')
      // Blockquote: > text → text
      .replace(/^>\s?/gm, '')
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Unordered list markers: - * +
      .replace(/^[-*+]\s/gm, '')
      // Ordered list markers: 1. 2.
      .replace(/^\d+\.\s/gm, '')
      // Bold italic with underscore
      .replace(/_{3}([^_]+)_{3}/g, '$1')
      .replace(/_{2}([^_]+)_{2}/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
  );
}

/**
 * Collapses whitespace to single spaces and trims.
 *
 * @param {string} content - Body content
 * @returns {string} Cleaned prose string
 */
function collapseWhitespace(content: string): string {
  return content
    .replace(/\n+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Extracts readable plain-text prose from a raw MDX file for Pagefind indexing.
 *
 * Pipeline: frontmatter → imports → JSX → code → markdown syntax → whitespace.
 *
 * @param {string} raw - Raw MDX file content
 * @returns {string} Plain-text prose suitable for full-text search indexing
 */
export function extractProse(raw: string): string {
  let content = stripFrontmatter(raw);
  content = stripMdxImports(content);
  content = stripJsx(content);
  content = stripCode(content);
  content = stripMarkdownSyntax(content);
  return collapseWhitespace(content);
}
