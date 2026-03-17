#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * @fileoverview MDX Lottery - Select a random MDX file from a directory
 * @description Selects and outputs the name of a random .mdx file from a specified
 * directory and its subdirectories, with options to ignore certain directories.
 *
 * @version 1.1.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/mdxLottery.ts -- --root monsters --ignore dist --ignore build
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const log = createLogger({ script: 'mdxLottery' });

/** Default directories to ignore when walking */
const DEFAULT_IGNORES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
]);

/**
 * Check if path is a directory
 *
 * @param p - Path to check
 * @returns True if the path is a directory
 */
const isDir = (p: string): boolean => {
  try {
    return fsSync.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/** Parsed CLI arguments */
interface Args {
  /** Root directory */
  root: string;
  /** Filter patterns */
  patterns: string[];
  /** Directory names to ignore */
  ignore: Set<string>;
}

/**
 * Normalize for path matching — forward slashes, lowercase
 *
 * @param s - Input string
 * @returns Normalized string
 */
const norm = (s: string): string => s.replace(/\\/g, '/').toLowerCase();

/**
 * Recursive MDX walker with directory ignore
 *
 * @param dir - Directory to walk
 * @param ignore - Set of directory names to skip
 * @returns Array of absolute file paths
 */
const walk = async (dir: string, ignore: Set<string>): Promise<string[]> => {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const e of entries) {
    if (e.isDirectory()) {
      if (ignore.has(e.name)) continue;
      out.push(...(await walk(path.join(dir, e.name), ignore)));
      continue;
    }

    if (e.isFile() && e.name.endsWith('.mdx')) {
      out.push(path.join(dir, e.name));
    }
  }

  return out;
};

/**
 * Parse command line arguments
 *
 * @param argv - Raw CLI arguments
 * @returns Parsed args
 */
const parseArgs = (argv: string[]): Args => {
  let root = '.';
  const patterns: string[] = [];
  const ignore = new Set(DEFAULT_IGNORES);

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === '--root') {
      root = argv[++i];
      continue;
    }

    if (a === '--ignore') {
      ignore.add(argv[++i]);
      continue;
    }

    patterns.push(a);
  }

  if (!isDir(root)) {
    throw new Error(`Root is not a directory: ${root}`);
  }

  return { root, patterns, ignore };
};

const main = async (): Promise<void> => {
  const { root, patterns, ignore } = parseArgs(process.argv.slice(2));
  const rootAbs = path.resolve(root);

  const files = await walk(rootAbs, ignore);

  const pats = patterns.map(norm);
  log.message(String(pats.length));

  const matches =
    pats.length === 0
      ? files
      : files.filter((abs) => {
          const rel = path.relative(rootAbs, abs);
          const a = norm(abs);
          const r = norm(rel);
          return pats.some((p) => a.includes(p) || r.includes(p));
        });

  if (matches.length === 0) {
    log.error(
      `No matching .mdx files under ${rootAbs}\nPatterns: ${patterns.join(', ')}`,
    );
    process.exit(1);
  }

  const idx = Math.floor(Math.random() * matches.length);
  process.stdout.write(path.basename(matches[idx]) + '\n');
};

main().catch((err: unknown) => {
  const message =
    err instanceof Error ? ((err as Error).stack ?? String(err)) : String(err);
  log.error('Fatal error in mdxLottery', { error: message });
  process.exit(1);
});
