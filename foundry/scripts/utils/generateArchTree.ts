/**
 * @fileoverview CLI utility to generate a repository architecture tree.
 * @module foundry/scripts/utils/generateArchTree
 * @description
 * Generates an ASCII tree of the repository and writes it to
 * `.ignore/architecture-tree.md` (or a path supplied as the second arg).
 * Implements TypeScript types and JSDoc to satisfy project PAW gates.
 * @author Typeir
 * @version 1.0.0
 * @since 2026-04-28
 */

import type { Dirent } from 'fs';
import fs from 'fs/promises';
import path from 'path';

const rootArg: string = process.argv[2]
  ? path.resolve(process.argv[2])
  : process.cwd();
const outArg: string =
  process.argv[3] ??
  path.join(process.cwd(), '.ignore', 'architecture-tree.md');
const maxDepth: number = process.argv[4] ? Number(process.argv[4]) : Infinity;

const EXCLUDE_PATTERNS: string[] = [
  'node_modules',
  '.next',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'temp',
  'public/full-size',
];

const norm = (p: string): string => p.split(path.sep).join('/');

/**
 * Returns true when a path (relative to the root) matches an exclusion.
 *
 * @param {string|undefined} rel - Relative path
 * @returns {boolean}
 */
function isExcluded(rel: string | undefined): boolean {
  if (!rel) return false;
  const r = norm(rel);
  return EXCLUDE_PATTERNS.some((pat) => r === pat || r.startsWith(`${pat}/`));
}

const lines: string[] = [];

/**
 * Walk directory tree and append ASCII lines to the `lines` buffer.
 *
 * @param {string} dir - Directory to walk
 * @param {string} prefix - Current ASCII prefix
 * @param {number} depth - Current recursion depth
 * @returns {Promise<void>}
 */
async function walk(dir: string, prefix = '', depth = 0): Promise<void> {
  let entries: Dirent[];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    return;
  }

  entries = entries
    .filter((e) => {
      const rel = norm(path.relative(rootArg, path.join(dir, e.name)));
      return !isExcluded(rel);
    })
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const isLast = i === entries.length - 1;
    const name = e.isDirectory() ? `${e.name}/` : e.name;
    lines.push(prefix + (isLast ? '└── ' : '├── ') + name);

    if (e.isDirectory() && depth + 1 <= maxDepth) {
      await walk(
        path.join(dir, e.name),
        prefix + (isLast ? '    ' : '│   '),
        depth + 1,
      );
    }
  }
}

/**
 * Main entrypoint.
 */
async function run(): Promise<void> {
  const rootName = path.basename(rootArg);
  lines.push(rootName + '/');
  await walk(rootArg, '', 0);
  const md = `# Project architecture tree\n\nGenerated: ${new Date().toISOString()}\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`;
  await fs.mkdir(path.dirname(outArg), { recursive: true });
  await fs.writeFile(outArg, md, 'utf8');
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
