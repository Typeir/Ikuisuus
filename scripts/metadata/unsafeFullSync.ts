/**
 * @fileoverview Reconciles local `.metadata.json` sidecars into PostgreSQL.
 * Deletes DB rows with no sidecar. Run after full `pre-init`, never against a
 * partial tree.
 *
 * @module scripts/metadata/unsafeFullSync
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { isContentType } from '@/lib/metadata/contentTypes';
import { syncMetadata } from '@/lib/metadata/syncService';
import { guardDeployWrites } from '../db/pg/deployGuard';

/**
 * Parsed command line arguments.
 *
 * @property {string} locale - Locale to reconcile
 * @property {string[] | undefined} types - Content types to reconcile, all when absent
 * @property {boolean} confirm - Whether `--yes` was supplied
 */
interface Args {
  locale: string;
  types: string[] | undefined;
  confirm: boolean;
}

/**
 * Reads `--locale`, `--types` and `--yes` from argv.
 *
 * @param {string[]} argv - Raw arguments, excluding node and script path
 * @returns {Args} Parsed arguments
 * @throws {Error} When `--types` names an unknown content type
 */
function parseArgs(argv: string[]): Args {
  const valueOf = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index === -1 ? undefined : argv[index + 1];
  };

  const rawTypes = valueOf('--types');
  const types = rawTypes
    ? rawTypes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;

  for (const type of types ?? []) {
    if (!isContentType(type)) {
      throw new Error(`Unknown content type: ${type}`);
    }
  }

  return {
    locale: valueOf('--locale') ?? 'en',
    types,
    confirm: argv.includes('--yes'),
  };
}

/**
 * Runs the reconcile and prints per-type counts.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const { locale, types, confirm } = parseArgs(process.argv.slice(2));

  if (!confirm) {
    process.stdout.write(
      [
        'This deletes DB rows that have no matching .metadata.json sidecar.',
        'Run `npm run pre-init` first so every sidecar exists, then re-run with --yes.',
        '',
      ].join('\n'),
    );
    process.exitCode = 1;
    return;
  }

  const results = await syncMetadata({
    locale,
    contentTypes: types,
    allowDeletion: true,
  });

  for (const [type, result] of Object.entries(results)) {
    process.stdout.write(
      `${type}: +${result.inserted} ~${result.updated} =${result.skipped} -${result.deleted}\n`,
    );
  }
}

guardDeployWrites('full metadata sync');

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
