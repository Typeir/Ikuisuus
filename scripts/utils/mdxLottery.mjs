#!/usr/bin/env node

/**
 * @fileoverview MDX Lottery - Select a random MDX file from a directory
 * @description selects and outputs the name of a random .mdx file from a specified
 * directory and its subdirectories, with options to ignore certain directories.
 *
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires fs
 * @requires path
 *
 * @example
 * ```bash
 * # Select a random .mdx file from a directory
 * node scripts/utils/mdxLottery.mjs -- --root monsters --ignore dist --ignore build
 * ```
 */

import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @type {Set<string>}
 * @description Default directories to ignore when walking
 */
const DEFAULT_IGNORES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
]);

/**
 * @function isDir
 * @description Check if path is a directory
 * @param {string} p
 * @returns {boolean}
 */
const isDir = (p) => {
  try {
    return fsSync.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

/**
 * @typedef {Object} Args
 * @property {string} root
 * @property {string[]} patterns
 * @property {Set<string>} ignore
 */

/**
 * @function norm
 * @description
 * Normalize for path matching
 * - forward slashes
 * - lowercase
 */
const norm = (s) => s.replace(/\\/g, '/').toLowerCase();

/**
 * Recursive MDX walker with directory ignore
 * @param {string} dir
 * @param {Set<string>} ignore
 * @returns {Promise<string[]>}
 */
const walk = async (dir, ignore) => {
  /** @type {string[]} */
  const out = [];
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
 * @function parseArgs
 * @description Parse command line arguments
 * @param {string[]} argv
 */
const parseArgs = (argv) => {
  let root = '.';
  /** @type {string[]} */
  const patterns = [];
  /** @type {Set<string>} */
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

const main = async () => {
  const { root, patterns, ignore } = parseArgs(process.argv.slice(2));
  const rootAbs = path.resolve(root);

  const files = await walk(rootAbs, ignore);

  const pats = patterns.map(norm);
  console.log(pats.length);

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
    console.error(
      `No matching .mdx files under ${rootAbs}\nPatterns: ${patterns.join(', ')}`,
    );
    process.exit(1);
  }

  const idx = Math.floor(Math.random() * matches.length);
  process.stdout.write(path.basename(matches[idx]) + '\n');
};

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
