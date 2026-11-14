/**
 * @fileoverview Fuzzy name score shared by browse search and the dev builder resolver.
 *
 * @module modules/library/application/use-cases/fuzzyScore
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { calculateSimilarity } from './findNearestRoute.levenshtein';

/**
 * Minimum score of a substring hit.
 *
 * @constant FUZZY_SUBSTRING_FLOOR
 * @type {number}
 */
export const FUZZY_SUBSTRING_FLOOR = 0.9;

/**
 * Scores a query against candidate fields; substring hits score at least {@link FUZZY_SUBSTRING_FLOOR}.
 *
 * @function scoreFuzzy
 * @param {string} query - Query; trimmed and lower-cased here
 * @param {string[]} fields - Candidate texts, e.g. slug and title
 * @returns {number} Best score in [0, 1]; 0 for an empty query
 */
export function scoreFuzzy(query: string, fields: string[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let best = 0;
  let substring = false;
  for (const raw of fields) {
    const field = String(raw ?? '').toLowerCase();
    best = Math.max(best, calculateSimilarity(q, field));
    if (field.includes(q)) substring = true;
  }
  return substring ? Math.max(best, FUZZY_SUBSTRING_FLOOR) : best;
}
