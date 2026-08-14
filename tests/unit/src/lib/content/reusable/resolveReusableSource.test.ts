/**
 * @fileoverview resolveReusableSource tests
 * @description Asserts that every PascalCase tag in authored content resolves
 * to a registered component or reusable region, and that each compile entry
 * point calls resolveReusableSource.
 *
 * @module tests/unit/lib/content/reusable/resolveReusableSource
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 */

import { resolveReusableSource } from '@/lib/content/reusable/resolveReusableSource';
import {
  clearReusableCache,
  discoverReusables,
} from '@/lib/content/reusable/reusableRegistry';
import { components } from '@/modules/library/presentation/components';
import fs from 'fs/promises';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';

const CONTENT_ROOT = path.join(process.cwd(), 'src/content');
const COMPILE_DIR = path.join(
  process.cwd(),
  'src/modules/library/infrastructure/compile',
);

/**
 * Recursively lists files with a given extension.
 *
 * @param {string} dir - Directory to walk
 * @param {string} ext - File extension to match
 * @returns {Promise<string[]>} Matching absolute paths
 */
async function listFiles(dir: string, ext: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return listFiles(resolved, ext);
      return resolved.endsWith(ext) ? [resolved] : [];
    }),
  );
  return nested.flat();
}

describe('resolveReusableSource', () => {
  afterEach(() => {
    clearReusableCache();
  });

  describe('behaviour', () => {
    it('should leave source without references unchanged', async () => {
      const source = 'plain prose with no components';
      expect(await resolveReusableSource(source)).toBe(source);
    });

    it('should leave a registered component tag alone', async () => {
      const source = '<Collapsible>text</Collapsible>';
      expect(await resolveReusableSource(source)).toContain('<Collapsible>');
    });

    it('should splice a reusable reference', async () => {
      const resolved = await resolveReusableSource('<LesserMooncleave />');
      expect(resolved).not.toContain('<LesserMooncleave />');
    });

    it('should be idempotent', async () => {
      const once = await resolveReusableSource('<LesserMooncleave />');
      const twice = await resolveReusableSource(once);
      expect(twice).toBe(once);
    });
  });

  describe('every component tag in content can resolve', () => {
    it('should not reference any component that is neither registered nor reusable', async () => {
      const files = await listFiles(CONTENT_ROOT, '.mdx');
      const reusables = await discoverReusables(CONTENT_ROOT);
      const registered = new Set(Object.keys(components));

      const unresolved = new Map<string, string>();

      for (const file of files) {
        const raw = await fs.readFile(file, 'utf8');
        for (const match of raw.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)) {
          const name = match[1];
          if (registered.has(name) || reusables.has(name)) continue;
          if (!unresolved.has(name)) {
            unresolved.set(name, path.relative(process.cwd(), file));
          }
        }
      }

      expect(
        Object.fromEntries(unresolved),
        'these tags resolve to nothing and throw when the page renders',
      ).toEqual({});
    });
  });

  describe('every compiler resolves reusables', () => {
    it('should call resolveReusableSource from each compile entry point', async () => {
      const compilers = (await listFiles(COMPILE_DIR, '.ts')).filter((file) =>
        /compile(Static|Dynamic)\.ts$/.test(file),
      );

      expect(compilers.length).toBeGreaterThanOrEqual(2);

      const missing: string[] = [];
      for (const file of compilers) {
        const raw = await fs.readFile(file, 'utf8');
        if (!raw.includes('resolveReusableSource')) {
          missing.push(path.relative(process.cwd(), file));
        }
      }

      expect(
        missing,
        'a compiler that skips this step renders reusable tags unresolved',
      ).toEqual([]);
    });
  });
});
