/**
 * @fileoverview Migration report printer
 * @description Formats and prints the migration summary to the logger.
 *
 * @module scripts/content/migration/report
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import type { CliFlags, MigrationStats } from './types';

const log = createLogger({ component: 'DiceMigration' });

/**
 * Prints the full migration report.
 *
 * @param {MigrationStats} stats - Collected statistics
 * @param {CliFlags} flags - CLI flags
 */
export function printReport(stats: MigrationStats, flags: CliFlags): void {
  const mode = flags.dryRun ? 'DRY RUN' : 'APPLIED';
  log.message(`\n===== DICE MIGRATION: ${mode} =====`);
  log.message(`Files scanned:   ${stats.filesScanned}`);
  log.message(`Lines processed: ${stats.linesProcessed.toLocaleString()}`);
  log.message(`Expressions:     ${stats.totalExpressions}`);

  log.message(`\n--- Migrated by Shape ---`);
  const shapeEntries = Object.entries(stats.shapes).sort(
    (a, b) => b[1].matched - a[1].matched,
  );
  for (const [name, s] of shapeEntries) {
    if (s.matched === 0) continue;
    log.message(`  ${name.padEnd(22)} ${String(s.matched).padStart(5)}`);
    if (flags.verbose) for (const ex of s.examples.slice(0, 3)) log.message(ex);
  }
  const totalMig = shapeEntries.reduce((sum, [, s]) => sum + s.matched, 0);
  log.message(`  ${'─'.repeat(35)}`);
  log.message(`  TOTAL migrated:     ${totalMig}`);

  log.message(`\n--- Excluded ---`);
  const exclEntries = Object.entries(stats.exclusions).sort(
    (a, b) => b[1].matched - a[1].matched,
  );
  for (const [name, s] of exclEntries) {
    if (s.matched === 0) continue;
    log.message(`  ${name.padEnd(26)} ${String(s.matched).padStart(5)}`);
    if (flags.verbose) for (const ex of s.examples.slice(0, 2)) log.message(ex);
  }
  const totalExcl = exclEntries.reduce((sum, [, s]) => sum + s.matched, 0);
  log.message(`  ${'─'.repeat(35)}`);
  log.message(`  TOTAL excluded:     ${totalExcl}`);

  log.message(`\n--- Outliers ---`);
  if (stats.outliers.length === 0) {
    log.message('  (none)');
  } else {
    for (const o of stats.outliers) {
      log.message(`  [${o.reason}] ${o.filePath}:${o.lineNum} — "${o.line}"`);
    }
  }
  const totalExpr = totalMig + totalExcl + stats.outliers.length;
  const pct =
    totalExpr > 0
      ? ((stats.outliers.length / totalExpr) * 100).toFixed(1)
      : '0.0';
  log.message(`  ─────────────────────────────`);
  log.message(`  TOTAL outliers:     ${stats.outliers.length}  (${pct}%)`);

  log.message(`\n--- Judgment ---`);
  const pctNum = Number.parseFloat(pct);
  if (pctNum <= flags.maxOutlierPct) {
    log.message(
      `  Outlier rate: ${pct}% — BELOW ${flags.maxOutlierPct}% threshold.`,
    );
    if (flags.dryRun) log.message('  Safe to proceed with --apply.');
  } else {
    log.message(
      `  Outlier rate: ${pct}% — ABOVE ${flags.maxOutlierPct}% threshold!`,
    );
    log.message('  Investigate outliers before proceeding with --apply.');
  }
  log.message('');
}
