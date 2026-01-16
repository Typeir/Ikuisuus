/**
 * Walk-Sidebar Integration Tests
 *
 * @fileoverview Integration tests ensuring walk() utility generates correct
 * paths for sidebar navigation, with special attention to .sheet.mdx files
 * and project conventions for URL generation.
 *
 * @module tests/integration/lib/utils/walk-sidebar-integration
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires fs Node.js filesystem module
 * @requires @/lib/utils/walk Module under test
 * @requires @/lib/utils/toKebabCase Dependency
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { walk } from '@/lib/utils/walk';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('walk-sidebar integration', () => {
  let testDir: string;

  beforeAll(() => {
    // Create a temporary test directory structure
    testDir = path.join(tmpdir(), 'walk-test-' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('critical .sheet.mdx path generation', () => {
    it('should generate correct paths for .sheet.mdx files without concatenation', () => {
      // Create test structure
      const monstersDir = path.join(testDir, 'monsters');
      fs.mkdirSync(monstersDir, { recursive: true });
      
      // Create .sheet.mdx files
      fs.writeFileSync(path.join(monstersDir, 'abandoned-old-war-machine.sheet.mdx'), '# Test');
      fs.writeFileSync(path.join(monstersDir, 'ancient-red-dragon.sheet.mdx'), '# Test');
      fs.writeFileSync(path.join(monstersDir, 'albedo-the-bleak-bloom.sheet.mdx'), '# Test');

      const result = walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Monsters');
      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(3);

      const paths = result[0].children!.map(c => c.path);

      // CRITICAL: Paths must have .sheet preserved, not concatenated
      expect(paths).toContain('monsters/abandoned-old-war-machine.sheet');
      expect(paths).toContain('monsters/ancient-red-dragon.sheet');
      expect(paths).toContain('monsters/albedo-the-bleak-bloom.sheet');

      // CRITICAL: Must NOT have malformed paths
      expect(paths).not.toContain('monsters/abandoned-old-war-machinesheet');
      expect(paths.every(p => !p.includes('machinesheet'))).toBe(true);
      expect(paths.every(p => !p.includes('dragonsheet'))).toBe(true);
    });

    it('should handle .sheet.mdx files with spaces and special chars', () => {
      const monstersDir = path.join(testDir, 'monsters-special');
      fs.mkdirSync(monstersDir, { recursive: true });
      
      fs.writeFileSync(path.join(monstersDir, 'Albedo, the Bleak Bloom.sheet.mdx'), '# Test');
      fs.writeFileSync(path.join(monstersDir, 'Ancient Red Dragon.sheet.mdx'), '# Test');

      const result = walk(testDir);
      const monstersFolder = result.find(r => r.name === 'Monsters Special');

      expect(monstersFolder).toBeDefined();
      expect(monstersFolder?.children).toBeDefined();

      const paths = monstersFolder!.children!.map(c => c.path);

      // Should convert to kebab-case but preserve .sheet
      expect(paths).toContain('monsters-special/albedo-the-bleak-bloom.sheet');
      expect(paths).toContain('monsters-special/ancient-red-dragon.sheet');
    });

    it('should handle mixed .sheet.mdx and .mdx files correctly', () => {
      const mixedDir = path.join(testDir, 'mixed-content');
      fs.mkdirSync(mixedDir, { recursive: true });
      
      fs.writeFileSync(path.join(mixedDir, 'monster.sheet.mdx'), '# Monster');
      fs.writeFileSync(path.join(mixedDir, 'item.mdx'), '# Item');
      fs.writeFileSync(path.join(mixedDir, 'spell.mdx'), '# Spell');

      const result = walk(testDir);
      const mixedFolder = result.find(r => r.name === 'Mixed Content');

      expect(mixedFolder?.children).toHaveLength(3);

      const paths = mixedFolder!.children!.map(c => c.path);
      const names = mixedFolder!.children!.map(c => c.name);

      // .sheet.mdx should have .sheet in path
      expect(paths).toContain('mixed-content/monster.sheet');
      
      // Regular .mdx should NOT have .sheet
      expect(paths).toContain('mixed-content/item');
      expect(paths).toContain('mixed-content/spell');

      // Names should have .sheet removed for display
      expect(names).toContain('Monster');
      expect(names).toContain('Item');
      expect(names).toContain('Spell');
    });
  });

  describe('deduplication behavior with .sheet files', () => {
    it('should prefer .sheet.mdx over .mdx with same base name', () => {
      const dupDir = path.join(testDir, 'dedup-test');
      fs.mkdirSync(dupDir, { recursive: true });
      
      // Create both versions
      fs.writeFileSync(path.join(dupDir, 'dragon.sheet.mdx'), '# Sheet version');
      fs.writeFileSync(path.join(dupDir, 'dragon.mdx'), '# Regular version');

      const result = walk(testDir);
      const dupFolder = result.find(r => r.name === 'Dedup Test');

      // Should only have one entry (the .sheet.mdx version)
      expect(dupFolder?.children).toHaveLength(1);
      expect(dupFolder?.children?.[0].path).toBe('dedup-test/dragon.sheet');
      expect(dupFolder?.children?.[0].name).toBe('Dragon');
    });
  });

  describe('kebab-case convention enforcement', () => {
    it('should convert all paths to kebab-case', () => {
      const caseDir = path.join(testDir, 'Case Convention Test');
      fs.mkdirSync(caseDir, { recursive: true });
      
      fs.writeFileSync(path.join(caseDir, 'CamelCaseFile.mdx'), '# Test');
      fs.writeFileSync(path.join(caseDir, 'UPPERCASE FILE.mdx'), '# Test');
      fs.writeFileSync(path.join(caseDir, 'snake_case_file.mdx'), '# Test');

      const result = walk(testDir);
      const caseFolder = result.find(r => r.name === 'Case Convention Test');

      const paths = caseFolder!.children!.map(c => c.path);

      // All paths should be lowercase kebab-case
      expect(paths).toContain('case-convention-test/camel-case-file');
      expect(paths).toContain('case-convention-test/uppercase-file');
      expect(paths).toContain('case-convention-test/snake-case-file');

      // Should not have any uppercase or underscores
      paths.forEach(p => {
        expect(p).toBe(p.toLowerCase());
        expect(p).not.toContain('_');
        expect(p).not.toContain(' ');
      });
    });
  });

  describe('URL-ready path generation', () => {
    it('should generate paths that work as URLs without encoding', () => {
      const urlDir = path.join(testDir, 'url-ready');
      fs.mkdirSync(urlDir, { recursive: true });
      
      fs.writeFileSync(path.join(urlDir, 'test@file!name.mdx'), '# Test');
      fs.writeFileSync(path.join(urlDir, 'file with (parentheses).sheet.mdx'), '# Test');

      const result = walk(testDir);
      const urlFolder = result.find(r => r.name === 'Url Ready');

      const paths = urlFolder!.children!.map(c => c.path);

      // Should remove special characters
      paths.forEach(p => {
        expect(p).toMatch(/^[a-z0-9\-\/.]+$/);
      });

      // .sheet should be preserved even after special char removal
      const sheetPath = paths.find(p => p.includes('.sheet'));
      expect(sheetPath).toBeDefined();
      expect(sheetPath).toMatch(/\.sheet$/);
    });
  });

  describe('nested directory structure', () => {
    it('should maintain correct paths through multiple levels', () => {
      const deepDir = path.join(testDir, 'level1', 'level2', 'level3');
      fs.mkdirSync(deepDir, { recursive: true });
      
      fs.writeFileSync(path.join(deepDir, 'deep-file.sheet.mdx'), '# Deep');

      const result = walk(testDir);

      // Navigate to the deeply nested file
      const level1 = result.find(r => r.name === 'Level1');
      expect(level1).toBeDefined();
      
      const level2 = level1?.children?.find(c => c.name === 'Level2');
      expect(level2).toBeDefined();
      
      const level3 = level2?.children?.find(c => c.name === 'Level3');
      expect(level3).toBeDefined();
      
      const file = level3?.children?.find(c => c.name === 'Deep File');
      expect(file).toBeDefined();
      expect(file?.path).toBe('level1/level2/level3/deep-file.sheet');
    });
  });

  describe('regression prevention', () => {
    it('should never produce paths with consecutive dots except .sheet', () => {
      const regressDir = path.join(testDir, 'regression');
      fs.mkdirSync(regressDir, { recursive: true });
      
      fs.writeFileSync(path.join(regressDir, 'file.v2.0.mdx'), '# Version');
      fs.writeFileSync(path.join(regressDir, 'monster.sheet.mdx'), '# Monster');

      const result = walk(testDir);
      const regressFolder = result.find(r => r.name === 'Regression');

      const paths = regressFolder!.children!.map(c => c.path);

      // Should not have consecutive dots except for .sheet
      paths.forEach(p => {
        const withoutSheet = p.replace(/\.sheet$/, '');
        expect(withoutSheet).not.toContain('.');
      });

      // .sheet should still be present where expected
      expect(paths.some(p => p.endsWith('.sheet'))).toBe(true);
    });

    it('should match expected URL pattern for all paths', () => {
      const patternDir = path.join(testDir, 'url-pattern');
      fs.mkdirSync(patternDir, { recursive: true });
      
      fs.writeFileSync(path.join(patternDir, 'Test File.sheet.mdx'), '# Test');
      fs.writeFileSync(path.join(patternDir, 'Another File.mdx'), '# Test');

      const result = walk(testDir);
      const patternFolder = result.find(r => r.name === 'Url Pattern');

      const paths = patternFolder!.children!.map(c => c.path);

      // All paths should match expected pattern
      paths.forEach(p => {
        // Should be: folder/kebab-case-name or folder/kebab-case-name.sheet
        expect(p).toMatch(/^[a-z0-9\-\/]+(\.sheet)?$/);
      });
    });
  });
});
