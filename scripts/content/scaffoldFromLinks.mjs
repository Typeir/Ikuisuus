#!/usr/bin/env node
/**
 * Scaffolds MDX files from a links list.
 *
 * For each entry like:
 *   { "term": "Blade of Damocles", "path": "/en/library/world/the-lands-of-damocles/blade-of-damocles" }
 * It creates (if missing):
 *   src/app/content/en/world/the-lands-of-damocles/blade-of-damocles.mdx
 * with the content:
 *   WIP
 *
 * Usage:
 *   node scripts/scaffold-from-links.mjs --links scripts/links.json --world-root src/app/content/en/world
 * Options:
 *   --links <file.json>   JSON array of {term, path}. If omitted, reads JSON from STDIN.
 *   --world-root <dir>    Destination root for /en/library/world/* (default: src/app/content/en/world)
 *   --dry                 Dry run (prints actions; no writes)
 *   --force               Overwrite existing files (default: skip existing)
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createLogger } from '../core/logger.mjs';

const log = createLogger({ script: 'scaffoldFromLinks' });

/** argv helpers */
const arg = (flag, fallback = null) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const has = (flag) => process.argv.includes(flag);

/** Load specs JSON from file or STDIN */
const loadSpecs = async (linksPath) => {
  const raw = linksPath
    ? await readFile(linksPath, 'utf8')
    : await new Promise((res, rej) => {
        const chunks = [];
        process.stdin.on('data', (c) => chunks.push(c));
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

  let data;
  try {
    data = JSON.parse(txt);
  } catch (e) {
    throw new Error('Invalid JSON: ' + e.message);
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
  return data;
};

const normalizeSlashes = (p) => p.replace(/\\/g, '/');

const main = async () => {
  const linksPath = arg('--links', null);
  const worldRootArg = arg('--world-root', 'src/app/content/en/world');
  const DRY = has('--dry');
  const FORCE = has('--force');

  const worldRoot = normalizeSlashes(worldRootArg);

  // Basic sanity: worldRoot directory must exist
  try {
    const st = await stat(worldRoot);
    if (!st.isDirectory()) throw new Error();
  } catch {
    log.error(
      `[scaffold] world root does not exist or is not a directory: ${worldRoot}`,
    );
    process.exit(1);
  }

  let specs;
  try {
    specs = await loadSpecs(linksPath);
  } catch (e) {
    log.error('[scaffold] ' + e.message);
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const { path: urlPath } of specs) {
    // Only handle /en/library/world/* — skip others silently
    const p = normalizeSlashes(urlPath);
    const prefix = '/en/library/world/';
    if (!p.startsWith(prefix)) {
      continue; // not a world page
    }

    // remainder after /en/library/world/
    const remainder = p.slice(prefix.length); // e.g. "the-lands-of-damocles/blade-of-damocles"
    if (!remainder || /\/$/.test(remainder)) {
      // trailing slash or empty remainder; skip
      continue;
    }

    const segments = remainder.split('/');
    const slug = segments.pop(); // last piece becomes filename
    const dirRel = segments.join('/'); // folder path relative to worldRoot
    const destDir = path.posix.join(worldRoot, dirRel);
    const destFile = path.posix.join(destDir, `${slug}.mdx`);

    // If file exists and not forcing, skip
    if (!FORCE && existsSync(destFile)) {
      skipped++;
      log.message(`SKIP (exists): ${destFile}`);
      continue;
    }

    // Generate title from slug (e.g., "crimson-order" → "Crimson Order")
    const title = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Generate category name from parent folder (e.g., "factions" → "Factions")
    const category =
      segments.length > 0
        ? segments[segments.length - 1]
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : 'World';

    // Generate placeholder content
    const placeholder = `# ${title}

*This page is a placeholder and needs content.*

## Overview

TODO: Add content here

## Related Content

- [Back to ${category}](../)
`;

    // Ensure directory
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

main().catch((err) => {
  log.error('Fatal error in scaffoldFromLinks', {
    error: err.message || String(err),
  });
  process.exit(1);
});
