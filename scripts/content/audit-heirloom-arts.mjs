/**
 * @fileoverview Contrasts heirloom weapon props against the weapon art and chassis system.
 */

import { globSync, readFileSync } from 'node:fs';
import { contrast, loadArtSystem, parseProps } from './heirloom-art-system.mjs';

/** Every heirloom entry. */
const HEIRLOOM_GLOB = 'src/content/en/items/heirlooms/*.heirloom.mdx';

/** Report order of severities. */
const SEVERITIES = ['error', 'warning', 'info'];

/**
 * Counts issues by severity across the report.
 *
 * @param {object[]} report - Per-file results.
 * @returns {{ error: number, warning: number, info: number }} Tallies.
 */
function countBySeverity(report) {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const item of report) for (const issue of item.issues) counts[issue.severity] += 1;
  return counts;
}

/**
 * Prints the human-readable report.
 *
 * @param {object[]} report - Per-file results.
 * @param {number} scanned - Total heirloom files.
 * @param {number} weapons - Files carrying a pattern.
 * @returns {void}
 */
function printReport(report, scanned, weapons) {
  const counts = countBySeverity(report);
  console.log(`heirlooms: ${scanned} scanned, ${weapons} weapons`);
  console.log(`issues: ${counts.error} error, ${counts.warning} warning, ${counts.info} info`);
  for (const severity of SEVERITIES) {
    const rows = report.filter((item) => item.issues.some((issue) => issue.severity === severity));
    if (rows.length === 0) continue;
    console.log(`\n== ${severity}`);
    for (const item of rows) {
      console.log(`  ${item.slug}`);
      for (const issue of item.issues) {
        if (issue.severity === severity) console.log(`    ${issue.code}: ${issue.detail}`);
      }
    }
  }
}

const system = loadArtSystem();
const files = globSync(HEIRLOOM_GLOB).sort();
const report = [];
let weapons = 0;

for (const file of files) {
  const props = parseProps(readFileSync(file, 'utf8'));
  if (!props?.pattern) continue;
  weapons += 1;
  const issues = contrast(props, system);
  if (issues.length === 0) continue;
  const slash = file.replace(/\\/g, '/');
  report.push({ file: slash, slug: slash.replace(/^.*\//, '').replace('.heirloom.mdx', ''), issues });
}

if (process.argv.includes('--json')) {
  const counts = countBySeverity(report);
  console.log(JSON.stringify({ scanned: files.length, weapons, counts, report }, null, 2));
} else {
  printReport(report, files.length, weapons);
}
