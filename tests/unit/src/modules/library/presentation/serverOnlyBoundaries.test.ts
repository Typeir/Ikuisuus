/**
 * @fileoverview Server-Only Import Boundary Tests
 * @description Fails when a barrel that client components import can reach the
 * ORM.
 *
 * This has broken the build twice. `MonsterAspects` was re-exported from the
 * component barrel that the MDX map imports; later `LibraryContent` reached the
 * metadata repository through `resolveAndCompileContent`. Both dragged MikroORM
 * and its native sqlite driver into the browser and surfaced as
 * `Can't resolve 'better-sqlite3'` — a module trace fifteen frames deep that
 * names neither the barrel nor the offending edge.
 *
 * A static walk of the import graph catches it at the boundary instead, naming
 * the path that crosses it.
 *
 * @module tests/unit/src/modules/library/presentation/serverOnlyBoundaries
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 *
 * @requires vitest Testing framework
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(process.cwd(), 'src');

/** Barrels reachable from client components, which must stay server-free. */
const CLIENT_REACHABLE = [
  'modules/library/presentation/index.ts',
  'modules/library/presentation/components/index.tsx',
  'modules/library/presentation/components/Aspects/index.ts',
];

/** Modules that pull the ORM, and so must never be reachable from the above. */
const SERVER_ONLY = [
  'lib/db/orm/',
  'lib/db/content/adapters/pg/',
  'lib/db/content/repositories/',
];

/**
 * Resolves an import specifier to a file inside `src`, if it points to one.
 *
 * @param {string} specifier - The raw import specifier
 * @param {string} fromFile - Absolute path of the importing file
 * @returns {string | null} Absolute path, or null when outside `src`
 */
function resolveInSrc(specifier: string, fromFile: string): string | null {
  let base: string;

  if (specifier.startsWith('@/')) base = path.join(SRC, specifier.slice(2));
  else if (specifier.startsWith('.'))
    base = path.resolve(path.dirname(fromFile), specifier);
  else return null;

  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (existsSync(candidate) && candidate.match(/\.tsx?$/)) return candidate;
  }

  return null;
}

/**
 * Walks the import graph and returns the first path that reaches a server-only
 * module, so the failure names the edge rather than the symptom.
 *
 * Type-only imports are ignored: they are erased at compile time and cannot
 * pull a runtime dependency into the bundle.
 *
 * @param {string} entry - Absolute path of the entry file
 * @returns {string[] | null} The offending import chain, or null when clean
 */
function findServerOnlyPath(entry: string): string[] | null {
  const seen = new Set<string>();
  const stack: Array<{ file: string; trail: string[] }> = [
    { file: entry, trail: [path.relative(SRC, entry).replace(/\\/g, '/')] },
  ];

  while (stack.length) {
    const { file, trail } = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);

    const relative = path.relative(SRC, file).replace(/\\/g, '/');
    if (SERVER_ONLY.some((prefix) => relative.startsWith(prefix))) return trail;

    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const imports = [
      ...source.matchAll(/^\s*import\s+(?!type\s)[\s\S]*?from\s+'([^']+)'/gm),
      ...source.matchAll(/^\s*export\s+(?!type\s)[\s\S]*?from\s+'([^']+)'/gm),
    ];

    for (const match of imports) {
      const next = resolveInSrc(match[1], file);
      if (!next || seen.has(next)) continue;
      stack.push({
        file: next,
        trail: [...trail, path.relative(SRC, next).replace(/\\/g, '/')],
      });
    }
  }

  return null;
}

describe('client-reachable barrels stay free of the ORM', () => {
  it.each(CLIENT_REACHABLE)('%s does not reach a server-only module', (rel) => {
    const entry = path.join(SRC, rel);
    expect(existsSync(entry)).toBe(true);

    const offending = findServerOnlyPath(entry);

    expect(
      offending,
      offending
        ? `Server-only module reachable from a client barrel:\n  ${offending.join('\n  → ')}`
        : undefined,
    ).toBeNull();
  });
});
