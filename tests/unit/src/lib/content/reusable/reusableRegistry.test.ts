/**
 * @fileoverview reusableRegistry Unit Tests
 * @description Tests discovery of opted-in content files, the PascalCase name
 * derivation, caching, and that non-participating files are never parsed.
 *
 * @module tests/unit/lib/content/reusable/reusableRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/content/reusable/reusableRegistry Module under test
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearReusableCache,
  componentNameFromPath,
  discoverReusables,
} from '@/lib/content/reusable/reusableRegistry';

let root: string;

/**
 * Writes a content file beneath the temporary root.
 *
 * @param {string} rel - Path relative to the root
 * @param {string} body - File contents
 * @returns {Promise<void>}
 */
async function write(rel: string, body: string): Promise<void> {
  const target = path.join(root, rel);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body, 'utf8');
}

describe('reusableRegistry', () => {
  beforeEach(async () => {
    clearReusableCache();
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'reusable-'));
  });

  afterEach(async () => {
    clearReusableCache();
    await fs.rm(root, { recursive: true, force: true });
  });

  describe('componentNameFromPath', () => {
    it('should convert a kebab-case filename', () => {
      expect(componentNameFromPath('spells/lesser-mooncleave.mdx')).toBe(
        'LesserMooncleave',
      );
    });

    it('should convert a single-word filename', () => {
      expect(componentNameFromPath('image.mdx')).toBe('Image');
    });

    it('should strip the content suffix rather than name it', () => {
      expect(componentNameFromPath('rubedo.sheet.mdx')).toBe('Rubedo');
      expect(componentNameFromPath('lesser-mooncleave.spell.mdx')).toBe(
        'LesserMooncleave',
      );
      expect(componentNameFromPath('selenic-boons.boon.mdx')).toBe(
        'SelenicBoons',
      );
    });
  });

  describe('discovery', () => {
    it('should find a file that opts in', async () => {
      await write('spells/lesser-mooncleave.mdx', '---\nreusable: true\n---\n\nbody');

      const found = await discoverReusables(root);

      expect(found.has('LesserMooncleave')).toBe(true);
    });

    it('should ignore a file that does not opt in', async () => {
      await write('spells/image.mdx', '---\ncontentType: spells\n---\n\n# Image');

      const found = await discoverReusables(root);

      expect(found.has('Image')).toBe(false);
    });

    it('should ignore a file with reusable set to false', async () => {
      await write('spells/x.mdx', '---\nreusable: false\n---\n\nbody');

      expect((await discoverReusables(root)).size).toBe(0);
    });

    it('should search nested directories', async () => {
      await write(
        'character-creation/bloodlines/shared-boons/selenic-boons.mdx',
        '---\nreusable: true\n---\n\nboons',
      );

      expect((await discoverReusables(root)).has('SelenicBoons')).toBe(true);
    });

    it('should ignore non-mdx files', async () => {
      await write('spells/notes.md', '---\nreusable: true\n---\n\nbody');

      expect((await discoverReusables(root)).size).toBe(0);
    });
  });

  describe('entry shape', () => {
    it('should carry the whole body when no regions are marked', async () => {
      await write(
        'spells/x.mdx',
        '---\nreusable: true\nheadingOffset: 0\n---\n\n# Title\n\nlede\n\n---\n\nTHE BODY',
      );

      const entry = (await discoverReusables(root)).get('X');

      expect(entry?.body).toBe('THE BODY');
      expect(entry?.regions).toEqual({});
    });

    it('should carry named regions when marked', async () => {
      await write(
        'spells/y.mdx',
        '---\nreusable: true\n---\n\n{/* reusable:start block */}\nREGION\n{/* reusable:end */}',
      );

      const entry = (await discoverReusables(root)).get('Y');

      expect(entry?.regions.block).toBe('REGION');
      expect(entry?.body).toBeNull();
    });

    it('should record the source path', async () => {
      await write('spells/z.mdx', '---\nreusable: true\n---\n\nbody');

      const entry = (await discoverReusables(root)).get('Z');

      expect(entry?.filePath).toContain('z.mdx');
    });
  });

  describe('caching', () => {
    it('should return the cached result on a second call', async () => {
      await write('spells/a.mdx', '---\nreusable: true\n---\n\nfirst');

      const first = await discoverReusables(root);
      await write('spells/b.mdx', '---\nreusable: true\n---\n\nsecond');
      const second = await discoverReusables(root);

      expect(second).toBe(first);
      expect(second.has('B')).toBe(false);
    });

    it('should rediscover after the cache is cleared', async () => {
      await write('spells/a.mdx', '---\nreusable: true\n---\n\nfirst');
      await discoverReusables(root);

      await write('spells/b.mdx', '---\nreusable: true\n---\n\nsecond');
      clearReusableCache();

      expect((await discoverReusables(root)).has('B')).toBe(true);
    });
  });
});
