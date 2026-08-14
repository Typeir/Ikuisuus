/**
 * @fileoverview `ik run <name>` — registry-backed dispatcher for one-off scripts.
 * Spawns `npx tsx` (or `bash` for `.sh` files) with inherited stdio.
 *
 * @module multirepo/commands/run
 * @author Typeir

 * @version 1.0.0
 * @since 3.0.0
 */

import { log } from '@clack/prompts';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { CommandMeta } from '../../utils/cli-loader';
import { MAIN_REPO } from '../constants';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'run',
  description: 'Run a registered one-off script (use `ik run` to list)',
};

/**
 * Registry entry describing how to invoke a named one-off script.
 * @interface ScriptEntry
 * @property {string} description - Short help text shown in `ik run` output.
 * @property {'tsx' | 'bash'} runner - Which runner to invoke the script with.
 * @property {string} path - Relative path from repo root.
 * @property {string[]} [defaultArgs] - Args prepended before user args.
 */
interface ScriptEntry {
  description: string;
  runner: 'tsx' | 'bash';
  path: string;
  defaultArgs?: string[];
}

/** Name → script invocation descriptor. */
const REGISTRY: Record<string, ScriptEntry> = {
  'tree-size': {
    description: 'Print a size-sorted tree of a directory',
    runner: 'tsx',
    path: 'scripts/utils/treeSize.ts',
    defaultArgs: ['./src'],
  },
  'precompile-mdx': {
    description: 'Precompile MDX content for faster dev startup',
    runner: 'tsx',
    path: 'scripts/utils/precompileMdx.ts',
  },
  'mdxify-heading-images': {
    description: 'Convert heading images in MDX files',
    runner: 'tsx',
    path: 'scripts/utils/mdxifyHeadingImages.ts',
  },
  'test-metadata': {
    description: 'Sanity-check the metadata generation system',
    runner: 'tsx',
    path: 'scripts/utils/testMetadataSystem.ts',
  },
  lottery: {
    description: 'Pick a random MDX file for review',
    runner: 'tsx',
    path: 'scripts/utils/mdxLottery.ts',
  },
  'linkify:world:dry': {
    description: 'Preview world auto-linking (no writes)',
    runner: 'tsx',
    path: 'scripts/content/linkifyRunner.ts',
    defaultArgs: [
      '--links',
      'scripts/core/links.json',
      '--root',
      'src/content/en/world',
    ],
  },
  'linkify:world': {
    description: 'Apply world auto-linking with backup files',
    runner: 'tsx',
    path: 'scripts/content/linkifyRunner.ts',
    defaultArgs: [
      '--links',
      'scripts/core/links.json',
      '--root',
      'src/content/en/world',
      '--write',
      '--backup',
    ],
  },
  'scaffold:world:dry': {
    description: 'Preview scaffolded content for broken links',
    runner: 'tsx',
    path: 'scripts/content/scaffoldFromLinks.ts',
    defaultArgs: [
      '--links',
      'scripts/core/links.json',
      '--world-root',
      'src/content/en/world',
      '--dry',
    ],
  },
  'scaffold:world': {
    description: 'Scaffold placeholder MDX files for broken links',
    runner: 'tsx',
    path: 'scripts/content/scaffoldFromLinks.ts',
    defaultArgs: [
      '--links',
      'scripts/core/links.json',
      '--world-root',
      'src/content/en/world',
    ],
  },
  'generate-token': {
    description: 'Generate an auth token',
    runner: 'tsx',
    path: 'scripts/auth/generateToken.ts',
  },
  'seed-admin': {
    description: 'Seed the admin user into the filesystem store',
    runner: 'tsx',
    path: 'scripts/auth/seedAdmin.ts',
  },
  'seed-admin-pg': {
    description: 'Seed the admin user into Postgres',
    runner: 'tsx',
    path: 'scripts/auth/seedAdminPg.ts',
  },
  'extract-content-repo': {
    description: 'One-off migration: extract content repo from main',
    runner: 'bash',
    path: 'scripts/migration/extract-content-repo.sh',
  },
  'toggle-content-submodule': {
    description: 'One-off migration: toggle content submodule mode',
    runner: 'bash',
    path: 'scripts/migration/toggle-content-submodule.sh',
  },
  'generate-features': {
    description: 'Generate monster feature metadata',
    runner: 'tsx',
    path: 'scripts/metadata/generateFeatureMetadata.ts',
  },
};

/**
 * Prints the registry as a help table.
 * @returns {void}
 */
function printRegistry(): void {
  log.message('Available scripts (ik run <name> [args...]):');
  const pad = Math.max(...Object.keys(REGISTRY).map((k) => k.length));
  for (const [name, entry] of Object.entries(REGISTRY)) {
    log.message(`  ${name.padEnd(pad)}  ${entry.description}`);
  }
}

/**
 * Runs the named script with any extra args appended.
 * @param {string[]} args - `[scriptName, ...scriptArgs]`.
 * @returns {Promise<void>}
 */
export async function run(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    printRegistry();
    return;
  }

  const [name, ...userArgs] = args;
  const entry = REGISTRY[name!];
  if (!entry) {
    log.error(`Unknown script: ${name}`);
    printRegistry();
    process.exit(1);
  }

  const scriptPath = resolve(MAIN_REPO, entry.path);
  if (!existsSync(scriptPath)) {
    log.error(`Script file missing: ${entry.path}`);
    process.exit(1);
  }

  const finalArgs = [...(entry.defaultArgs ?? []), ...userArgs];
  const command = entry.runner === 'tsx' ? 'npx' : 'bash';
  const fullArgs =
    entry.runner === 'tsx'
      ? [
          'tsx',
          '--tsconfig',
          resolve(MAIN_REPO, 'tsconfig.scripts.json'),
          scriptPath,
          ...finalArgs,
        ]
      : [scriptPath, ...finalArgs];

  const result = spawnSync(command, fullArgs, {
    cwd: MAIN_REPO,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
