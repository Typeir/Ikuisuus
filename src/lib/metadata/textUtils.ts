/**
 * @fileoverview Pure Text Processing Utilities
 * @description Common text manipulation functions used across metadata generators
 * and runtime services. No Node.js or filesystem dependencies.
 *
 * @module lib/metadata/textUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import path from 'path';

/**
 * Removes carriage returns and trims whitespace.
 *
 * @param {string} text - Input string to clean
 * @returns {string} Cleaned string
 */
export function clean(text: string): string {
  return (text || '').replace(/\r/g, '').trim();
}

/**
 * Removes markdown formatting like **bold**, _italic_, etc.
 *
 * @param {string} text - Input string with markdown
 * @returns {string} String without markdown formatting
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

/**
 * Converts text to kebab-case format.
 *
 * @param {string} text - Input string to convert
 * @returns {string} String in kebab-case format
 */
export function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts slug from file path by removing extensions.
 *
 * @param {string} filePath - Path to the file
 * @returns {string} Slug identifier
 */
export function filePathToSlug(filePath: string): string {
  return path
    .basename(filePath)
    .replace(/\.(?:sheet\.)?mdx$/i, '')
    .replace(/\..+$/, '');
}

/**
 * Splits raw text content into lines.
 *
 * @param {string} raw - Raw file content
 * @returns {string[]} Array of lines
 */
export function readLines(raw: string): string[] {
  return raw.split(/\r?\n/);
}
