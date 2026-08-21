/**
 * Incipient → Delayed rename
 *
 * @fileoverview One-off corpus sweep renaming the `incipient` effect timing to
 * `delayed`, preserving capitalisation. Covers content prose, the aspect
 * vocabulary in shared-data, and generated sidecars.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/renameIncipientToDelayed.ts
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/content/renameIncipientToDelayed.ts --apply
 *
 * @module scripts/content/renameIncipientToDelayed
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Files and directories the sweep walks. */
const TARGETS = ['src/content/en', 'scripts/core/shared-data.json'];

/** Extensions the sweep rewrites. */
const EXTENSIONS = new Set(['.mdx', '.md', '.json']);

/**
 * Matches the word in any capitalisation. Underscore is a word character, so
 * `\b` never fires inside markdown emphasis such as `[_incipient effect_]`; the
 * boundary is spelled out as "not a letter or digit" instead.
 */
const PATTERN = /(?<![a-z0-9])incipient(?![a-z0-9])/gi;

/**
 * Replaces a match while preserving its capitalisation.
 *
 * @param {string} match - The matched text
 * @returns {string} Replacement with matching case
 */
function replacement(match: string): string {
  if (match === match.toUpperCase()) return 'DELAYED';
  if (match[0] === match[0].toUpperCase()) return 'Delayed';
  return 'delayed';
}

/**
 * Recursively lists files beneath a path, or yields the path itself when it is
 * a file.
 *
 * @param {string} target - File or directory path
 * @returns {Promise<string[]>} Absolute file paths
 */
async function collect(target: string): Promise<string[]> {
  const stat = await fs.stat(target);
  if (stat.isFile()) return [target];

  const entries = await fs.readdir(target, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) return collect(full);
      return EXTENSIONS.has(path.extname(entry.name))
        ? Promise.resolve([full])
        : Promise.resolve([]);
    }),
  );
  return nested.flat();
}

/**
 * Rewrites every occurrence across the target set.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const files = (await Promise.all(TARGETS.map(collect))).flat();

  let changedFiles = 0;
  let occurrences = 0;

  for (const file of files) {
    const before = await fs.readFile(file, 'utf8');
    const matches = before.match(PATTERN);
    if (!matches) continue;

    changedFiles += 1;
    occurrences += matches.length;

    if (apply) {
      await fs.writeFile(file, before.replace(PATTERN, replacement), 'utf8');
    } else {
      process.stdout.write(
        `${path.relative(process.cwd(), file)}  (${matches.length})\n`,
      );
    }
  }

  process.stdout.write(
    `${apply ? 'rewrote' : 'would rewrite'} ${occurrences} occurrence(s) in ${changedFiles} file(s)\n`,
  );
  if (!apply) process.stdout.write('re-run with --apply to write\n');
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
