/**
 * @fileoverview Migration statistics tracking
 * @description Creates and mutates MigrationStats during processing.
 *
 * @module scripts/content/migration/stats
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { MigrationStats } from './types';

/** Creates a fresh stats object with zeroed counters. */
export function createStats(): MigrationStats {
  return {
    shapes: {},
    exclusions: {},
    outliers: [],
    filesScanned: 0,
    linesProcessed: 0,
    totalExpressions: 0,
  };
}

/** Ensures a shape stats entry exists. */
export function ensureShapeStats(s: MigrationStats, name: string): void {
  if (!s.shapes[name])
    s.shapes[name] = { matched: 0, recalibrated: 0, examples: [] };
}

/** Ensures an exclusion stats entry exists. */
export function ensureExclusionStats(s: MigrationStats, name: string): void {
  if (!s.exclusions[name]) s.exclusions[name] = { matched: 0, examples: [] };
}
