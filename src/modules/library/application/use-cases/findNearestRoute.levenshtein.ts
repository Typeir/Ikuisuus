/**
 * @fileoverview String distance helpers for nearest-route matching.
 * @module modules/library/application/use-cases/findNearestRoute.levenshtein
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

/**
 * Calculates Levenshtein edit distance between two strings.
 *
 * @param {string} source - First string.
 * @param {string} target - Second string.
 * @returns {number} Number of edits required to transform source into target.
 */
export function levenshteinDistance(source: string, target: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= target.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= source.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= source.length; j++) {
      if (target.charAt(i - 1) === source.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[target.length][source.length];
}

/**
 * Converts Levenshtein distance to a normalized similarity score between 0 and 1.
 *
 * @param {string} source - First string.
 * @param {string} target - Second string.
 * @returns {number} Similarity score where 1 is exact match.
 */
export function calculateSimilarity(source: string, target: string): number {
  const distance = levenshteinDistance(
    source.toLowerCase(),
    target.toLowerCase(),
  );
  const maxLength = Math.max(source.length, target.length);

  if (maxLength === 0) {
    return 1;
  }

  return 1 - distance / maxLength;
}
