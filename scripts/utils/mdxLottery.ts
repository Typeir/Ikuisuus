#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * @fileoverview CLI that prints a random .mdx file name.
 * @description Walks a directory recursively for .mdx files, optionally filters
 * by substring patterns, picks one at random, and writes its basename to stdout.
 *
 * @version 1.1.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/mdxLottery.ts -- --root monsters --ignore dist --ignore build
 * ```
 */

import { walkDirectory } from '@/lib/utils/getMatchingFiles';
import { createLogger } from '@/lib/logging/logger';
import fsSync from 'node:fs';
import path from 'node:path';

const log = createLogger({ script: 'mdxLottery' });

/** Directories ignored by default when walking. */
const DEFAULT_IGNORES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
]);

/**
 * Read-only path existence check.
 *
 * @param p - Path to check
 * @returns True if the path is a directory, false if stat fails
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
 * Normalize for path matching.
 *
 * @param s - Input string
 * @returns The string with backslashes replaced by forward slashes, lowercased
 */
const norm = (s: string): string => s.replace(/\\/g, '/').toLowerCase();

/**
 * Recursive walker collecting .mdx files.
 *
 * @param dir - Directory to walk
 * @param ignore - Set of directory names to skip
 * @returns Array of absolute file paths
 */
const walk = async (dir: string, ignore: Set<string>): Promise<string[]> => {
  const out: string[] = [];
  await walkDirectory(dir, /\.mdx$/, out);
  if (ignore.size === 0) return out;
  return out.filter((abs) => {
    const rel = path.relative(dir, abs);
    return !rel.split(/[\\/]/).some((seg) => ignore.has(seg));
  });
};

/**
 * Parse command line arguments.
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
