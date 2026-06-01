/**
 * Walk-Sidebar Integration Tests
 *
 * @fileoverview Integration tests ensuring walkTree() utility generates correct
 * paths for sidebar navigation, with special attention to .sheet.mdx files
 * and project conventions for URL generation. Uses a real filesystem via a
 * temporary directory and a lightweight DirectorySourceAdapter wrapper.
 *
 * @module tests/integration/lib/utils/walk-sidebar-integration
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires fs Node.js filesystem module
 * @requires @/modules/library/infrastructure/navigation/walk Module under test
 * @requires @/lib/db/content/directorySourceAdapter Adapter interface
 */

import type { DirectorySourceAdapter } from '@/lib/db/content/directorySourceAdapter';
import { walkTree } from '@/modules/library/infrastructure/navigation/walk';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Creates a DirectorySourceAdapter backed by a real filesystem directory.
 *
 * @param {string} baseDir - Absolute path to the root directory
 * @returns {DirectorySourceAdapter} Adapter that lists entries under baseDir
 */
function createTestAdapter(baseDir: string): DirectorySourceAdapter {
  return {
    async listEntries(_locale: string, relativePath: string) {
      const dir = path.join(baseDir, relativePath);
      try {
        const stats = fs.statSync(dir);
        if (!stats.isDirectory()) return [];
        return fs
          .readdirSync(dir, { withFileTypes: true })
          .map((e) => ({ name: e.name, isDirectory: e.isDirectory() }));
      } catch {
        return [];
      }
    },
  };
}

describe('walk-sidebar integration', () => {
  let testDir: string;
  let adapter: DirectorySourceAdapter;

  beforeAll(() => {
    testDir = path.join(tmpdir(), 'walk-test-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
    adapter = createTestAdapter(testDir);
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('critical .sheet.mdx path generation', () => {
    it('should generate correct paths for .sheet.mdx files without concatenation', async () => {
      const monstersDir = path.join(testDir, 'monsters');
      fs.mkdirSync(monstersDir, { recursive: true });

      fs.writeFileSync(
        path.join(monstersDir, 'abandoned-old-war-machine.sheet.mdx'),
        '# Test',
      );
      fs.writeFileSync(
        path.join(monstersDir, 'ancient-red-dragon.sheet.mdx'),
        '# Test',
      );
      fs.writeFileSync(
        path.join(monstersDir, 'albedo-the-bleak-bloom.sheet.mdx'),
        '# Test',
      );

      const result = await walkTree(adapter, 'en', '', '');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Monsters');
      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(3);

      const paths = result[0].children!.map((c) => c.path);

      expect(paths).toContain('monsters/abandoned-old-war-machine');
      expect(paths).toContain('monsters/ancient-red-dragon');
      expect(paths).toContain('monsters/albedo-the-bleak-bloom');

      expect(paths).not.toContain('monsters/abandoned-old-war-machinesheet');
      expect(paths.every((p) => !p.includes('machinesheet'))).toBe(true);
      expect(paths.every((p) => !p.includes('dragonsheet'))).toBe(true);
    });

    it('should handle .sheet.mdx files with spaces and special chars', async () => {
      const monstersDir = path.join(testDir, 'monsters-special');
      fs.mkdirSync(monstersDir, { recursive: true });

      fs.writeFileSync(
        path.join(monstersDir, 'Albedo, the Bleak Bloom.sheet.mdx'),
        '# Test',
      );
      fs.writeFileSync(
        path.join(monstersDir, 'Ancient Red Dragon.sheet.mdx'),
        '# Test',
      );

      const result = await walkTree(adapter, 'en', '', '');
      const monstersFolder = result.find((r) => r.name === 'Monsters Special');

      expect(monstersFolder).toBeDefined();
      expect(monstersFolder?.children).toBeDefined();

      const paths = monstersFolder!.children!.map((c) => c.path);

      expect(paths).toContain('monsters-special/albedo-the-bleak-bloom');
      expect(paths).toContain('monsters-special/ancient-red-dragon');
    });

    it('should handle mixed .sheet.mdx and .mdx files correctly', async () => {
      const mixedDir = path.join(testDir, 'mixed-content');
      fs.mkdirSync(mixedDir, { recursive: true });

      fs.writeFileSync(path.join(mixedDir, 'monster.sheet.mdx'), '# Monster');
      fs.writeFileSync(path.join(mixedDir, 'item.mdx'), '# Item');
      fs.writeFileSync(path.join(mixedDir, 'spell.mdx'), '# Spell');

      const result = await walkTree(adapter, 'en', '', '');
      const mixedFolder = result.find((r) => r.name === 'Mixed Content');

      expect(mixedFolder?.children).toHaveLength(3);

      const paths = mixedFolder!.children!.map((c) => c.path);
      const names = mixedFolder!.children!.map((c) => c.name);

      expect(paths).toContain('mixed-content/monster');
      expect(paths).toContain('mixed-content/item');
      expect(paths).toContain('mixed-content/spell');

      expect(names).toContain('Monster');
      expect(names).toContain('Item');
      expect(names).toContain('Spell');
    });
  });

  describe('deduplication behavior with .sheet files', () => {
    it('should prefer .sheet.mdx over .mdx with same base name', async () => {
      const dupDir = path.join(testDir, 'dedup-test');
      fs.mkdirSync(dupDir, { recursive: true });

      fs.writeFileSync(
        path.join(dupDir, 'dragon.sheet.mdx'),
        '# Sheet version',
      );
      fs.writeFileSync(path.join(dupDir, 'dragon.mdx'), '# Regular version');

      const result = await walkTree(adapter, 'en', '', '');
      const dupFolder = result.find((r) => r.name === 'Dedup Test');

      expect(dupFolder?.children).toHaveLength(1);
      expect(dupFolder?.children?.[0].path).toBe('dedup-test/dragon');
      expect(dupFolder?.children?.[0].name).toBe('Dragon');
    });
  });

  describe('kebab-case convention enforcement', () => {
    it('should convert all paths to kebab-case', async () => {
      const caseDir = path.join(testDir, 'Case Convention Test');
      fs.mkdirSync(caseDir, { recursive: true });

      fs.writeFileSync(path.join(caseDir, 'CamelCaseFile.mdx'), '# Test');
      fs.writeFileSync(path.join(caseDir, 'UPPERCASE FILE.mdx'), '# Test');
      fs.writeFileSync(path.join(caseDir, 'snake_case_file.mdx'), '# Test');

      const result = await walkTree(adapter, 'en', '', '');
      const caseFolder = result.find((r) => r.name === 'Case Convention Test');

      const paths = caseFolder!.children!.map((c) => c.path);

      expect(paths).toContain('case-convention-test/camel-case-file');
      expect(paths).toContain('case-convention-test/uppercase-file');
      expect(paths).toContain('case-convention-test/snake-case-file');

      paths.forEach((p) => {
        expect(p).toBe(p.toLowerCase());
        expect(p).not.toContain('_');
        expect(p).not.toContain(' ');
      });
    });
  });

  describe('URL-ready path generation', () => {
    it('should generate paths that work as URLs without encoding', async () => {
      const urlDir = path.join(testDir, 'url-ready');
      fs.mkdirSync(urlDir, { recursive: true });

      fs.writeFileSync(path.join(urlDir, 'test@file!name.mdx'), '# Test');
      fs.writeFileSync(
        path.join(urlDir, 'file with (parentheses).sheet.mdx'),
        '# Test',
      );

      const result = await walkTree(adapter, 'en', '', '');
      const urlFolder = result.find((r) => r.name === 'Url Ready');

      const paths = urlFolder!.children!.map((c) => c.path);

      paths.forEach((p) => {
        expect(p).toMatch(/^[a-z0-9\-\/.]+$/);
      });
    });

    it('should preserve unicode filenames in slugs', async () => {
      const unicodeDir = path.join(testDir, 'bloodlines');
      fs.mkdirSync(unicodeDir, { recursive: true });

      fs.writeFileSync(path.join(unicodeDir, 'väärät.mdx'), '# Väärät');

      const result = await walkTree(adapter, 'en', '', '');
      const bloodlinesFolder = result.find((r) => r.name === 'Bloodlines');

      expect(bloodlinesFolder).toBeDefined();

      const vaarat = bloodlinesFolder?.children?.find((c) =>
        c.path.endsWith('/väärät'),
      );
      expect(vaarat).toBeDefined();
      expect(vaarat?.name).toBe('Väärät');
      expect(vaarat?.path).toBe('bloodlines/väärät');
    });
  });

  describe('nested directory structure', () => {
    it('should maintain correct paths through multiple levels', async () => {
      const deepDir = path.join(testDir, 'level1', 'level2', 'level3');
      fs.mkdirSync(deepDir, { recursive: true });

      fs.writeFileSync(path.join(deepDir, 'deep-file.sheet.mdx'), '# Deep');

      const result = await walkTree(adapter, 'en', '', '');

      const level1 = result.find((r) => r.name === 'Level1');
      expect(level1).toBeDefined();

      const level2 = level1?.children?.find((c) => c.name === 'Level2');
      expect(level2).toBeDefined();

      const level3 = level2?.children?.find((c) => c.name === 'Level3');
      expect(level3).toBeDefined();

      const file = level3?.children?.find((c) => c.name === 'Deep File');
      expect(file).toBeDefined();
      expect(file?.path).toBe('level1/level2/level3/deep-file');
    });
  });

  describe('regression prevention', () => {
    it('should never produce paths with dots (suffixes are stripped)', async () => {
      const regressDir = path.join(testDir, 'regression');
      fs.mkdirSync(regressDir, { recursive: true });

      fs.writeFileSync(path.join(regressDir, 'file.v2.0.mdx'), '# Version');
      fs.writeFileSync(path.join(regressDir, 'monster.sheet.mdx'), '# Monster');

      const result = await walkTree(adapter, 'en', '', '');
      const regressFolder = result.find((r) => r.name === 'Regression');

      const paths = regressFolder!.children!.map((c) => c.path);

      paths.forEach((p) => {
        expect(p).not.toContain('.');
      });
    });

    it('should match expected URL pattern for all paths', async () => {
      const patternDir = path.join(testDir, 'url-pattern');
      fs.mkdirSync(patternDir, { recursive: true });

      fs.writeFileSync(path.join(patternDir, 'Test File.sheet.mdx'), '# Test');
      fs.writeFileSync(path.join(patternDir, 'Another File.mdx'), '# Test');

      const result = await walkTree(adapter, 'en', '', '');
      const patternFolder = result.find((r) => r.name === 'Url Pattern');

      const paths = patternFolder!.children!.map((c) => c.path);

      paths.forEach((p) => {
        expect(p).toMatch(/^[a-z0-9\-\/]+$/);
      });
    });
  });
});
