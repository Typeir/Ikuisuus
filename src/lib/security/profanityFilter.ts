/**
 * @fileoverview Profanity Filter
 * @description Server-side profanity detection for user-submitted content.
 * Loads a banned-terms list from `banned-terms.txt` at startup and checks
 * strings against it using word-boundary-aware regex matching. Returns match
 * details so callers can decide how to respond (reject, ban, audit, etc.).
 *
 * To update the word list, edit `src/lib/security/banned-terms.txt` — no code
 * changes required.
 *
 * @module lib/security/profanityFilter
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { logger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

const log = logger.child({ module: 'ProfanityFilter' });

/**
 * Result returned from a profanity check.
 *
 * @property {boolean} flagged - True if profanity was detected
 * @property {string[]} matches - The matched terms (lowercased)
 */
export interface ProfanityCheckResult {
  /** True if profanity was detected */
  flagged: boolean;
  /** The matched terms (lowercased) */
  matches: string[];
}

/**
 * Loads banned terms from the `banned-terms.txt` file co-located with this module.
 * Skips blank lines and comment lines (starting with #). Results are cached
 * in `cachedTerms` so the file is only read once per process lifetime.
 *
 * @returns {string[]} Array of trimmed, non-empty banned terms
 */
const loadBannedTerms = (): string[] => {
  const filePath = path.resolve(__dirname, 'banned-terms.txt');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    log.error(
      'Failed to load banned-terms.txt — profanity filter will be empty',
      {
        error: error instanceof Error ? error.message : String(error),
        filePath,
      },
    );
    return [];
  }
};

/** Cached terms loaded once at module init. */
let cachedTerms: string[] | null = null;

/**
 * Returns the banned terms, loading from disk on first call.
 *
 * @returns {string[]} Banned terms array
 */
const getBannedTerms = (): string[] => {
  if (!cachedTerms) {
    cachedTerms = loadBannedTerms();
    log.debug(
      `Loaded ${cachedTerms.length} banned terms from banned-terms.txt`,
    );
  }
  return cachedTerms;
};

/**
 * Compiled regex built from the banned terms list.
 * Uses word boundaries (\b) and case-insensitive matching.
 * Lazily compiled on first use and cached.
 */
let cachedRegex: RegExp | null = null;

/**
 * Returns the profanity-matching regex, building it on first call.
 *
 * @returns {RegExp} Compiled regex with global + case-insensitive flags
 */
const getProfanityRegex = (): RegExp => {
  if (!cachedRegex) {
    const terms = getBannedTerms();
    if (terms.length === 0) {
      cachedRegex = /(?!)/gi;
      return cachedRegex;
    }
    const escaped = terms.map((term) =>
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    cachedRegex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  }
  return cachedRegex;
};

/**
 * Checks a string for profanity.
 *
 * @param {string} text - The text to scan
 * @returns {ProfanityCheckResult} Result with flagged status and matched terms
 *
 * @example
 * ```ts
 * const result = checkProfanity('This is clean text');
 * // { flagged: false, matches: [] }
 * ```
 */
export const checkProfanity = (text: string): ProfanityCheckResult => {
  const regex = getProfanityRegex();
  regex.lastIndex = 0;

  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0].toLowerCase());
  }

  const unique = Array.from(new Set(matches));

  if (unique.length > 0) {
    log.message('Profanity detected', {
      level: 'warn',
      matchCount: unique.length,
      terms: unique,
    });
  }

  return {
    flagged: unique.length > 0,
    matches: unique,
  };
};

/**
 * Checks multiple strings for profanity and returns a combined result.
 *
 * @param {string[]} texts - Array of strings to scan
 * @returns {ProfanityCheckResult} Combined result across all inputs
 */
export const checkProfanityMultiple = (
  texts: string[],
): ProfanityCheckResult => {
  const allMatches: string[] = [];

  for (const text of texts) {
    if (text) {
      const result = checkProfanity(text);
      allMatches.push(...result.matches);
    }
  }

  const unique = Array.from(new Set(allMatches));
  return {
    flagged: unique.length > 0,
    matches: unique,
  };
};
