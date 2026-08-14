/**
 * Aspect Vocabulary Check
 *
 * @fileoverview Validates every aspect emitted into generated metadata against the
 * closed vocabulary in `scripts/core/shared-data.json`. Reads generated
 * `*.metadata.json` sidecars.
 *
 * @module .github/scripts/check-aspects
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CheckFailure,
  CheckOptions,
  CheckResult,
} from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/** Path segments of the canonical vocabulary, relative to the project root. */
const SHARED_DATA_SEGMENTS = ['scripts', 'core', 'shared-data.json'] as const;

/** Path segments of the content root that holds generated metadata sidecars. */
const CONTENT_SEGMENTS = ['src', 'content'] as const;

/**
 * One aspect group as declared in shared data.
 *
 * @property {"*" | string[]} scope - Content types carrying the group, or `"*"` for all
 * @property {string[]} [values] - Literal value list
 * @property {string[]} [valuesFrom] - `section.key` paths to borrow values from
 * @property {boolean} [open] - Group accepts any value
 */
interface AspectGroup {
  scope: '*' | string[];
  values?: string[];
  valuesFrom?: string[];
  open?: boolean;
}

/**
 * The subset of shared data this check reads.
 *
 * @property {Record<string, AspectGroup>} aspects - The closed vocabulary
 */
interface SharedDataShape {
  aspects: Record<string, AspectGroup>;
  [section: string]: unknown;
}

/**
 * Splits an aspect on its last colon into a group and a value.
 *
 * @param {string} aspect - A full aspect token
 * @returns {{ group: string; value: string } | null} The pair, or null when unusable
 */
function parseAspect(
  aspect: string,
): { group: string; value: string } | null {
  const boundary = aspect.lastIndexOf(':');
  if (boundary <= 0 || boundary === aspect.length - 1) return null;
  return { group: aspect.slice(0, boundary), value: aspect.slice(boundary + 1) };
}

/**
 * Resolves a group's accepted values, following `valuesFrom` one level.
 *
 * Borrowed values are trimmed, lowercased, and spaces replaced with hyphens.
 *
 * @param {SharedDataShape} shared - Parsed shared data
 * @param {string} group - Group name without its trailing colon
 * @returns {Set<string>} Accepted values, empty for an open or unknown group
 */
function resolveValues(shared: SharedDataShape, group: string): Set<string> {
  const definition = shared.aspects[group];
  if (!definition || definition.open) return new Set();

  const values = [...(definition.values ?? [])];

  for (const reference of definition.valuesFrom ?? []) {
    const [section, key] = reference.split('.');
    const borrowed = key
      ? (shared[section] as Record<string, unknown> | undefined)?.[key]
      : shared.aspects[section]?.values;
    if (Array.isArray(borrowed)) {
      values.push(
        ...(borrowed as string[]).map((value) =>
          value.trim().toLowerCase().replace(/\s+/g, '-'),
        ),
      );
    }
  }

  return new Set(values);
}

/**
 * Recursively collects generated metadata sidecars.
 *
 * @param {string} dir - Directory to walk
 * @param {string[]} results - Accumulator
 * @returns {Promise<string[]>} Absolute paths of `*.metadata.json` files
 */
async function findMetadataFiles(
  dir: string,
  results: string[] = [],
): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      await findMetadataFiles(full, results);
    } else if (entry.name.endsWith('.metadata.json')) {
      results.push(full);
    }
  }

  return results;
}

/** Shape of an aspect token: kebab-case segments joined by colons. */
const ASPECT_TOKEN = /^[a-z][a-z0-9-]*(:[a-z0-9-]+)+$/;

/**
 * Pulls every aspect out of a parsed metadata document.
 *
 * Collects all string values in `tags` keys at any depth, skipping nested keys.
 *
 * @param {unknown} node - Any node of the parsed document
 * @param {Set<string>} found - Accumulator
 * @returns {Set<string>} Every aspect in the document
 */
function collectAspects(node: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    for (const item of node) collectAspects(item, found);
    return found;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'tags' && Array.isArray(value)) {
        for (const tag of value) {
          if (typeof tag === 'string' && ASPECT_TOKEN.test(tag)) found.add(tag);
        }
        continue;
      }
      collectAspects(value, found);
    }
  }
  return found;
}

/**
 * Execute the aspect-vocabulary check and return a structured result.
 *
 * @param {CheckOptions} [options] - Optional execution context from PAW gates
 * @returns {Promise<CheckResult>} Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;

  const sharedRaw = await fs.readFile(
    path.join(rootDir, ...SHARED_DATA_SEGMENTS),
    'utf-8',
  );
  const shared = JSON.parse(sharedRaw) as SharedDataShape;

  if (!shared.aspects) {
    throw new Error(
      'shared-data.json has no `aspects` key; the vocabulary this check validates against is missing.',
    );
  }

  const valuesByGroup = new Map<string, Set<string>>();
  for (const group of Object.keys(shared.aspects)) {
    valuesByGroup.set(group, resolveValues(shared, group));
  }

  const files = await findMetadataFiles(path.join(rootDir, ...CONTENT_SEGMENTS));
  const failures: CheckFailure[] = [];
  let aspectCount = 0;

  for (const absPath of files) {
    const relPath = path.relative(rootDir, absPath).replace(/\\/g, '/');

    let parsed: unknown;
    try {
      parsed = JSON.parse(await fs.readFile(absPath, 'utf-8'));
    } catch {
      continue;
    }

    const contentType =
      (parsed as { contentType?: string } | null)?.contentType ?? '';

    for (const aspect of collectAspects(parsed)) {
      const pair = parseAspect(aspect);
      if (!pair) continue;

      aspectCount++;

      const definition = shared.aspects[pair.group];
      if (!definition) {
        failures.push({
          file: relPath,
          rule: 'unknown-aspect-group',
          message: `${aspect} uses the undeclared group ${pair.group}`,
          suggestion: `Declare aspects.${pair.group} in shared-data.json, or emit an existing group`,
          severity: 'critical',
        });
        continue;
      }

      const accepted = valuesByGroup.get(pair.group);
      if (!definition.open && accepted && !accepted.has(pair.value)) {
        failures.push({
          file: relPath,
          rule: 'unknown-aspect-value',
          message: `${aspect} is not in the ${pair.group} vocabulary`,
          suggestion: `Add "${pair.value}" to aspects.${pair.group} in shared-data.json, or correct the emitted value`,
          severity: 'critical',
        });
        continue;
      }

      if (
        contentType &&
        definition.scope !== '*' &&
        !definition.scope.includes(contentType)
      ) {
        failures.push({
          file: relPath,
          rule: 'mis-scoped-aspect',
          message: `${aspect} is scoped to ${definition.scope.join(', ')} but appears on ${contentType}`,
          suggestion: `Widen aspects.${pair.group}.scope in shared-data.json, or stop emitting this aspect for ${contentType}`,
          severity: 'critical',
        });
      }
    }
  }

  const criticalCount = failures.filter(
    (failure) => failure.severity === 'critical',
  ).length;

  return {
    check: 'aspects',
    severity: criticalCount > 0 ? 'critical' : 'info',
    passed: failures.length === 0,
    failures,
    stats: {
      total_files_checked: files.length,
      aspects_validated: aspectCount,
      groups_in_vocabulary: Object.keys(shared.aspects).length,
      violations_found: failures.length,
      critical_violations: criticalCount,
    },
  };
}

/**
 * Standalone entry point.
 */
async function main(): Promise<void> {
  const result = await runCheck();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.stats.critical_violations > 0 ? 1 : 0);
}

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  main().catch((err: Error) => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
  });
}
