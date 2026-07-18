/**
 * @fileoverview Migration script shared types
 * @description Type definitions for the dice expression migration pipeline.
 *
 * @module scripts/content/migration/types
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/** CLI flags parsed from process.argv. */
export interface CliFlags {
  dryRun: boolean;
  verbose: boolean;
  apply: boolean;
  singleFile: string | null;
  maxOutlierPct: number;
}

/** Parsed result from a shape match. */
export interface MatchResult {
  replacement: string;
  oldText: string;
}

/** A target shape that can be matched and normalized. */
export interface TargetShape {
  name: string;
  regex: RegExp;
  transform: (match: RegExpExecArray) => MatchResult | null;
}

/** An exclusion rule that prevents migration of matching lines. */
export interface ExclusionRule {
  name: string;
  test: (line: string, filePath: string) => boolean;
}

/** Shape-level counters for the report. */
export interface ShapeStats {
  matched: number;
  recalibrated: number;
  examples: string[];
}

/** Exclusion-level counters. */
export interface ExclusionStats {
  matched: number;
  examples: string[];
}

/** Outlier entry for reporting. */
export interface OutlierEntry {
  filePath: string;
  lineNum: number;
  line: string;
  reason: string;
}

/** Collected statistics during migration. */
export interface MigrationStats {
  shapes: Record<string, ShapeStats>;
  exclusions: Record<string, ExclusionStats>;
  outliers: OutlierEntry[];
  filesScanned: number;
  linesProcessed: number;
  totalExpressions: number;
}
