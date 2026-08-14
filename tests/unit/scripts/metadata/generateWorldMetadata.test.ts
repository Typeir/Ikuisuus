/**
 * @fileoverview World Metadata Generator Unit Tests
 * @description Tests for `scripts/metadata/generateWorldMetadata.ts` — module
 * exports, parse function contract, and output shape validation against
 * real generated sidecar files.
 *
 * @module tests/unit/scripts/metadata/generateWorldMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import * as generatorModule from '@scripts/metadata/generateWorldMetadata';
import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('generateWorldMetadata', () => {
  describe('exports', () => {
    it('should export main and parseWorldFile', () => {
      expect(generatorModule.main).toBeTypeOf('function');
      expect(generatorModule.parseWorldFile).toBeTypeOf('function');
      expect(generatorModule.main.name).toBe('main');
      expect(generatorModule.parseWorldFile.name).toBe('parseWorldFile');
    });
  });

  describe('parseWorldFile — minimal record', () => {
    it('should return null for a non-existent file', async () => {
      const result = await generatorModule.parseWorldFile(
        path.resolve(
          process.cwd(),
          'src/content/en/world/does-not-exist.lore.mdx',
        ),
        null as never,
      );
      expect(result).toBeNull();
    });

    it('should produce a minimal record for a file without frontmatter', async () => {
      const filePath = path.resolve(
        process.cwd(),
        'src/content/en/world/gods-and-demigods/paivatar.lore.mdx',
      );
      const result = await generatorModule.parseWorldFile(
        filePath,
        null as never,
      );

      expect(result).not.toBeNull();
      const record = result as Record<string, unknown>;

      expect(record.slug).toBe('paivatar');
      expect(record.title).toBeTruthy();
      expect(typeof record.file).toBe('string');
      expect(record.link).toBe('/library/world/gods-and-demigods/paivatar');
      expect(record.indexVersion).toBe(1);
    });
  });

  describe('output sidecar files', () => {
    const metaDir = path.resolve(process.cwd(), '.meta/en/world');
    const srcDir = path.resolve(process.cwd(), 'src/content/en/world');
    const usesMetaTree = existsSync(metaDir);

    /**
     * Resolves the sidecar path for the active backend: pg writes under
     * `.meta/en/world`, fs alongside source in the world subfolder.
     *
     * @param {string} subdir - Source subfolder under `world/`
     * @param {string} name - Sidecar file name
     * @returns {string} Absolute path to the sidecar file
     */
    const sidecarPath = (subdir: string, name: string): string =>
      usesMetaTree ? path.join(metaDir, name) : path.join(srcDir, subdir, name);

    it('should emit a sidecar for a known lore file', async () => {
      const raw = await fs.readFile(
        sidecarPath('gods-and-demigods', 'paivatar.lore.metadata.json'),
        'utf-8',
      );
      const record = JSON.parse(raw);

      expect(record.slug).toBe('paivatar');
      expect(record.title).toBeTruthy();
      expect(record.file).toContain('paivatar.lore.mdx');
      expect(record.link).toContain('/library/world/');
      expect(record.indexVersion).toBe(1);
      expect(typeof record.versionHash).toBe('string');
    });

    it('should derive correct links for nested paths', async () => {
      const raw = await fs.readFile(
        sidecarPath('the-lands-of-damocles', 'thule.lore.metadata.json'),
        'utf-8',
      );
      const record = JSON.parse(raw);

      expect(record.link).toBe('/library/world/the-lands-of-damocles/thule');
    });

    it('should have at least one sidecar per lore file', async () => {
      const raw = await fs.readFile(
        sidecarPath('gods-and-demigods', 'dragon.lore.metadata.json'),
        'utf-8',
      );
      const record = JSON.parse(raw);

      expect(record.slug).toBe('dragon');
      expect(record.link).toBe('/library/world/gods-and-demigods/dragon');
    });
  });
});
