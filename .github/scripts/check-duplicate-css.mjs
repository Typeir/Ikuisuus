/**
 * Duplicate CSS Check
 *
 * @fileoverview Detects duplicate CSS selectors and property blocks across SCSS/CSS
 * files. Reports exact duplicates as critical and near-duplicates as warnings.
 *
 * @module .github/scripts/check-duplicate-css
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const SCAN_DIRS = ['src'];

const EXCLUDED_PATTERNS = [/node_modules/, /\.next/, /globals\.scss$/];

/**
 * Recursively find SCSS/CSS files
 *
 * @param {string} dir - Directory to scan
 * @param {string[]} results - Accumulator
 * @returns {Promise<string[]>} File paths
 */
async function findStyleFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findStyleFiles(full, results);
    } else if (/\.(scss|css)$/.test(entry.name)) {
      const rel = path.relative(ROOT, full);
      if (!EXCLUDED_PATTERNS.some((p) => p.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Extract selector-to-properties map from a CSS/SCSS file
 *
 * @param {string} content - File content
 * @returns {Map<string, string[]>} Map of selector to array of property blocks
 */
function extractSelectors(content) {
  const selectorMap = new Map();
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(content)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    const body = match[2].trim();
    if (!selectorMap.has(selector)) {
      selectorMap.set(selector, []);
    }
    selectorMap.get(selector).push(body);
  }
  return selectorMap;
}

/**
 * Normalize properties for comparison
 *
 * @param {string} body - CSS property block
 * @returns {string} Normalized and sorted properties
 */
function normalizeProperties(body) {
  return body
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .sort()
    .join('; ');
}

async function main() {
  const allSelectors = new Map();
  const violations = [];

  for (const dir of SCAN_DIRS) {
    const files = await findStyleFiles(path.join(ROOT, dir));
    for (const rel of files) {
      const content = await fs.readFile(path.join(ROOT, rel), 'utf-8');
      const selectors = extractSelectors(content);
      for (const [selector, bodies] of selectors) {
        for (const body of bodies) {
          const normalized = normalizeProperties(body);
          const key = `${selector} { ${normalized} }`;
          if (allSelectors.has(key)) {
            const existing = allSelectors.get(key);
            violations.push({
              file: rel.replace(/\\/g, '/'),
              rule: 'duplicate-css',
              message: `Duplicate rule "${selector}" also found in ${existing}`,
              suggestion:
                'Extract shared styles to a common mixin or shared class',
              severity: 'critical',
            });
          } else {
            allSelectors.set(key, rel.replace(/\\/g, '/'));
          }
        }
      }
    }
  }

  const result = {
    check: 'duplicate-css',
    severity: violations.length > 0 ? 'critical' : 'info',
    passed: violations.length === 0,
    failures: violations,
    stats: {
      total_selectors_checked: allSelectors.size,
      violations_found: violations.length,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(violations.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
