/**
 * Scaffolds MDX files from a links list.
 *
 * @fileoverview Creates placeholder MDX files for broken links.
 *
 * @module scaffoldFromLinks
 * @author Typeir
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
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { getArgOrFallback, getArgValue, hasFlag } from '../core/cliArgs';
import {
    type LinkSpec,
    readLinkSpecsFromFile,
    readLinkSpecsFromStdin,
} from './linkSpecs';

const log = createLogger({ script: 'scaffoldFromLinks' });

const normalizeSlashes = (p: string): string => p.replace(/\\/g, '/');

const main = async (): Promise<void> => {
  const linksPath = getArgValue('--links');
  const worldRootArg = getArgOrFallback('--world-root', 'src/content/en/world');
  const DRY = hasFlag('--dry');
  const FORCE = hasFlag('--force');

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
    specs = linksPath
      ? await readLinkSpecsFromFile(linksPath)
      : await readLinkSpecsFromStdin();
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
