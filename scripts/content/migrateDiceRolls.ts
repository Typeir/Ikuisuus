/**
 * @fileoverview Dice Expression Migration Script (CLI)
 * @description CLI entry point that scans all MDX files, identifies dice
 * expressions, normalizes them to canonical `[% NdM + static type %]` form,
 * and wraps them. Dry-run-first safety with rich logging.
 *
 * @module scripts/content/migrateDiceRolls
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * Usage:
 *   npx tsx scripts/content/migrateDiceRolls.ts [--dry-run] [--verbose] [--file <path>] [--apply] [--max-outlier-pct 5]
 */

import {
    copyFileSync,
    existsSync,
    readdirSync,
    statSync,
    writeFileSync,
} from 'fs';
import { extname, relative, resolve } from 'path';
import { processFile } from './migration/processFile';
import { printReport } from './migration/report';
import { createStats } from './migration/stats';
import type { CliFlags, MigrationStats } from './migration/types';

/** Root content directory — all MDX files under here are scanned. */
const CONTENT_ROOT = resolve(__dirname, '..', '..', 'src', 'content');

/**
 * Recursively collects all .mdx file paths under a directory.
 *
 * @param {string} dir - Directory to scan
 * @returns {string[]} Array of absolute file paths
 */
function collectMdxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) results.push(...collectMdxFiles(full));
    else if (extname(entry) === '.mdx') results.push(full);
  }
  return results;
}

/**
 * Parses command-line arguments into a typed flags object.
 *
 * @param {string[]} argv - process.argv
 * @returns {CliFlags} Parsed flags
 */
function parseArgs(argv: string[]): CliFlags {
  const dryRun = !argv.includes('--apply');
  const verbose = argv.includes('--verbose');
  const apply = argv.includes('--apply');
  let singleFile: string | null = null;
  let maxOutlierPct = 5;

  const fileIdx = argv.indexOf('--file');
  if (fileIdx !== -1 && fileIdx + 1 < argv.length)
    singleFile = argv[fileIdx + 1];

  const pctIdx = argv.indexOf('--max-outlier-pct');
  if (pctIdx !== -1 && pctIdx + 1 < argv.length)
    maxOutlierPct = Number.parseFloat(argv[pctIdx + 1]) || 5;

  return { dryRun, verbose, apply, singleFile, maxOutlierPct };
}

/**
 * Processes a single file and writes the result if --apply.
 *
 * @param {string} abs - Absolute file path
 * @param {MigrationStats} stats - Running statistics
 * @param {CliFlags} flags - CLI flags
 */
function processAndMaybeWrite(
  abs: string,
  stats: MigrationStats,
  flags: CliFlags,
): void {
  const result = processFile(abs, stats, flags);
  if (result !== null && flags.apply) {
    const bakPath = abs + '.bak';
    if (!existsSync(bakPath)) copyFileSync(abs, bakPath);
    writeFileSync(abs, result, 'utf8');
  }
}

/**
 * Entry point.
 */
function main(): void {
  const flags = parseArgs(process.argv);

  if (flags.singleFile) {
    const abs = resolve(flags.singleFile);
    if (!existsSync(abs)) {
      process.stderr.write(`File not found: ${abs}\n`);
      process.exit(1);
    }
    process.stdout.write(`Single file mode: ${relative('.', abs)}\n`);
    const stats = createStats();
    stats.filesScanned = 1;
    processAndMaybeWrite(abs, stats, flags);
    if (flags.apply) process.stdout.write(`  Written: ${abs}\n`);
    printReport(stats, flags);
    return;
  }

  process.stdout.write(`Scanning: ${CONTENT_ROOT}\n`);
  const files = collectMdxFiles(CONTENT_ROOT);
  process.stdout.write(`Found ${files.length} .mdx files\n`);

  const stats = createStats();
  stats.filesScanned = files.length;

  let idx = 0;
  for (const fp of files) {
    idx++;
    processAndMaybeWrite(fp, stats, flags);
    if (flags.verbose && idx % 20 === 0) {
      process.stderr.write(`  Progress: ${idx}/${files.length} files\r`);
    }
  }
  if (flags.verbose)
    process.stderr.write(`  Progress: ${idx}/${files.length} files (done)\n`);
  printReport(stats, flags);
}

main();
