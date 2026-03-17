#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json
/**
 * Scaffolds MDX files from a links list.
 *
 * @fileoverview Creates placeholder MDX files for broken links.
 *
 * @module scaffoldFromLinks
 * @version 1.0.0
 * @since 1.0.0
 *
 * Usage:
 *   npx tsx scripts/content/scaffoldFromLinks.ts --links scripts/core/links.json --world-root src/content/en/world
 * Options:
 *   --links file.json   JSON array of {term, path}. If omitted, reads JSON from STDIN.
 *   --world-root dir    Destination root for /en/library/world/* (default: src/content/en/world)
 *   --dry               Dry run (prints actions; no writes)
 *   --force             Overwrite existing files (default: skip existing)
 */

import { createLogger } from '@/lib/logging/logger';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const log = createLogger({ script: 'scaffoldFromLinks' });

/** Link specification entry */
interface LinkSpec {
  /** Term to scaffold */
  term: string;
  /** Target URL path */
  path: string;
}

/** Get a CLI argument value */
const arg = (flag: string, fallback: string | null = null): string | null => {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const has = (flag: string): boolean => process.argv.includes(flag);

/** Load specs JSON from file or STDIN */
const loadSpecs = async (linksPath: string | null): Promise<LinkSpec[]> => {
  const raw = linksPath
    ? await readFile(linksPath, 'utf8')
    : await new Promise<string>((res, rej) => {
        const chunks: Buffer[] = [];
        process.stdin.on('data', (c) => chunks.push(c as Buffer));
        process.stdin.on('end', () =>
          res(Buffer.concat(chunks).toString('utf8')),
        );
        process.stdin.on('error', rej);
      });

  const txt = (raw || '').trim();
  if (!txt)
    throw new Error(
      'No JSON provided. Use --links <file.json> or pipe JSON to STDIN.',
    );

  let data: unknown;
  try {
    data = JSON.parse(txt);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error('Invalid JSON: ' + message);
  }
  if (!Array.isArray(data))
    throw new Error('Expected a JSON array of { term, path }.');

  for (const [i, x] of data.entries()) {
    if (!x || typeof x.term !== 'string' || typeof x.path !== 'string') {
      throw new Error(
        `Bad spec at index ${i}: expected { term: string, path: string }`,
      );
    }
  }
  return data as LinkSpec[];
};

const normalizeSlashes = (p: string): string => p.replace(/\\/g, '/');

const main = async (): Promise<void> => {
  const linksPath = arg('--links', null);
  const worldRootArg = arg('--world-root', 'src/app/content/en/world')!;
  const DRY = has('--dry');
  const FORCE = has('--force');

  const worldRoot = normalizeSlashes(worldRootArg);

  try {
    const st = await stat(worldRoot);
    if (!st.isDirectory()) throw new Error();
  } catch {
    log.error(
      `[scaffold] world root does not exist or is not a directory: ${worldRoot}`,
    );
    process.exit(1);
  }

  let specs: LinkSpec[];
  try {
    specs = await loadSpecs(linksPath);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    log.error('[scaffold] ' + message);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const { path: urlPath } of specs) {
    const p = normalizeSlashes(urlPath);
    const prefix = '/en/library/world/';
    if (!p.startsWith(prefix)) {
      continue;
    }

    const remainder = p.slice(prefix.length);
    if (!remainder || /\/$/.test(remainder)) {
      continue;
    }

    const segments = remainder.split('/');
    const slug = segments.pop()!;
    const dirRel = segments.join('/');
    const destDir = path.posix.join(worldRoot, dirRel);
    const destFile = path.posix.join(destDir, `${slug}.mdx`);

    if (!FORCE && existsSync(destFile)) {
      skipped++;
      log.message(`SKIP (exists): ${destFile}`);
      continue;
    }

    const title = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const category =
      segments.length > 0
        ? segments[segments.length - 1]
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : 'World';

    const placeholder = `# ${title}

*This page is a placeholder and needs content.*

## Overview

TODO: Add content here

## Related Content

- [Back to ${category}](../)
`;

    if (!DRY) {
      await mkdir(destDir, { recursive: true });
      await writeFile(destFile, placeholder, 'utf8');
    }

    created++;
    log.message(`${DRY ? 'WOULD CREATE' : 'CREATED'}: ${destFile}`);
  }

  log.message(
    `[scaffold] ${DRY ? 'Dry run' : 'Done'} — ${created} file(s) ${
      DRY ? 'to create' : 'created'
    }, ${skipped} skipped.`,
  );
};

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('Fatal error in scaffoldFromLinks', { error: message });
  process.exit(1);
});
