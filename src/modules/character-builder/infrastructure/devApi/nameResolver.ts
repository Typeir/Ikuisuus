/**
 * @fileoverview Fuzzy name resolution for dev builder payloads; always picks the best match.
 *
 * @module modules/character-builder/infrastructure/devApi/nameResolver
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { scoreFuzzy } from '@/modules/library/application/use-cases/fuzzyScore';
import type {
  Resolution,
  ResolutionCandidate,
} from '@/modules/character-builder/application/builderCore/types';

/**
 * Default score gap under which a runner-up marks a match ambiguous.
 *
 * @constant DEFAULT_AMBIGUITY_THRESHOLD
 * @type {number}
 */
export const DEFAULT_AMBIGUITY_THRESHOLD = 0.05;

/**
 * Minimum score for a candidate to match or be listed.
 *
 * @constant MIN_MATCH_SCORE
 * @type {number}
 */
export const MIN_MATCH_SCORE = 0.3;

/**
 * Maximum alternates returned per resolution.
 *
 * @constant MAX_ALTERNATES
 * @type {number}
 */
export const MAX_ALTERNATES = 5;

/**
 * How to read one candidate list.
 *
 * @interface CandidateReader
 * @template T
 * @property {(item: T) => string} slug - Candidate slug or key
 * @property {(item: T) => string} title - Candidate title
 * @property {(item: T) => string[]} [extra] - Extra texts to score, e.g. a camel-cased key
 */
export interface CandidateReader<T> {
  slug: (item: T) => string;
  title: (item: T) => string;
  extra?: (item: T) => string[];
}

/**
 * Resolution plus the picked item.
 *
 * @interface Resolved
 * @template T
 * @property {Resolution} resolution - Resolution report
 * @property {T | null} item - Picked item; null when nothing scored
 */
export interface Resolved<T> {
  resolution: Resolution;
  item: T | null;
}

/**
 * Scores one candidate; exact slug or title matches score 1.
 *
 * @function scoreCandidate
 * @template T
 * @param {string} query - Query text
 * @param {T} item - Candidate
 * @param {CandidateReader<T>} reader - Candidate reader
 * @returns {number} Score in [0, 1]
 */
function scoreCandidate<T>(
  query: string,
  item: T,
  reader: CandidateReader<T>,
): number {
  const q = query.trim().toLowerCase();
  const slug = reader.slug(item).toLowerCase();
  const title = reader.title(item).toLowerCase();
  if (q === slug || q === title) return 1;
  return scoreFuzzy(q, [slug, title, ...(reader.extra?.(item) ?? [])]);
}

/**
 * Resolves a name against candidates; picks the top score, reports alternates and ambiguity.
 *
 * @function resolveName
 * @template T
 * @param {string} field - Payload path for the report
 * @param {string} query - Name as sent
 * @param {T[]} items - Candidates
 * @param {CandidateReader<T>} reader - Candidate reader
 * @param {number} [threshold] - Ambiguity gap (default {@link DEFAULT_AMBIGUITY_THRESHOLD})
 * @returns {Resolved<T>} Report and picked item
 */
export function resolveName<T>(
  field: string,
  query: string,
  items: T[],
  reader: CandidateReader<T>,
  threshold: number = DEFAULT_AMBIGUITY_THRESHOLD,
): Resolved<T> {
  const ranked = items
    .map((item) => ({ item, score: scoreCandidate(query, item, reader) }))
    .filter((entry) => entry.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score);
  const toCandidate = (entry: { item: T; score: number }): ResolutionCandidate => ({
    slug: reader.slug(entry.item),
    title: reader.title(entry.item),
    similarity: Math.round(entry.score * 1000) / 1000,
  });
  const [top, ...rest] = ranked;
  const match = top ? toCandidate(top) : null;
  const alternates = rest.slice(0, MAX_ALTERNATES).map(toCandidate);
  const ambiguous =
    match !== null &&
    match.similarity < 1 &&
    alternates.length > 0 &&
    match.similarity - alternates[0].similarity <= threshold;
  return {
    resolution: { field, query, match, alternates, ambiguous },
    item: top ? top.item : null,
  };
}
