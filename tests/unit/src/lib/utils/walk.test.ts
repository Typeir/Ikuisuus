/**
 * walk Utility Unit Tests
 *
 * @fileoverview Tests for directory tree traversal utility exports and structure.
 * Full integration testing with filesystem is handled by e2e tests.
 *
 * @module tests/unit/lib/utils/walk
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/walk Module under test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as WalkModule from '@/lib/utils/walk';
import fs from 'fs';
import path from 'path';

// Mock fs module
vi.mock('fs');

describe('walk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export walk function', () => {
      expect(WalkModule.walk).toBeDefined();
      expect(typeof WalkModule.walk).toBe('function');
    });

    it('should accept directory path as first parameter', () => {
      expect(WalkModule.walk.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('return type', () => {
    it('should return an array for non-existent path', () => {
      const originalError = console.error;
      console.error = vi.fn();
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = WalkModule.walk('/path/that/does/not/exist');
      expect(Array.isArray(result)).toBe(true);
      console.error = originalError;
    });

    it('should return empty array for non-existent directory', () => {
      const originalError = console.error;
      console.error = vi.fn();
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = WalkModule.walk('/definitely/not/a/real/path');
      expect(result).toEqual([]);
      console.error = originalError;
    });
  });

  describe('base path parameter', () => {
    it('should accept optional base path parameter', () => {
      const originalError = console.error;
      console.error = vi.fn();
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = WalkModule.walk('/nonexistent', 'some/base');
      expect(Array.isArray(result)).toBe(true);
      console.error = originalError;
    });
  });

  describe('.sheet.mdx file handling', () => {
    it('should preserve .sheet in path for .sheet.mdx files', () => {
      const testDir = '/test/monsters';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'abandoned-old-war-machine.sheet.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('abandoned-old-war-machine.sheet');
      expect(result[0].path).not.toContain('machinesheet');
    });

    it('should handle .sheet.mdx files with spaces in names', () => {
      const testDir = '/test/monsters';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'Ancient Red Dragon.sheet.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('ancient-red-dragon.sheet');
    });

    it('should handle .sheet.mdx files with special characters', () => {
      const testDir = '/test/monsters';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'Albedo, the Bleak Bloom.sheet.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('albedo-the-bleak-bloom.sheet');
      expect(result[0].name).toBe('Albedo, The Bleak Bloom');
    });

    it('should not add .sheet to regular .mdx files', () => {
      const testDir = '/test/items';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'magic-sword.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('magic-sword');
      expect(result[0].path).not.toContain('.sheet');
    });

    it('should handle mixed .sheet.mdx and .mdx files correctly', () => {
      const testDir = '/test/content';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'monster.sheet.mdx', isDirectory: () => false } as any,
        { name: 'item.mdx', isDirectory: () => false } as any,
        { name: 'spell.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(3);
      expect(result.find(r => r.name === 'Monster')?.path).toBe('monster.sheet');
      expect(result.find(r => r.name === 'Item')?.path).toBe('item');
      expect(result.find(r => r.name === 'Spell')?.path).toBe('spell');
    });
  });

  describe('path construction with base path', () => {
    it('should construct correct nested paths for .sheet.mdx files', () => {
      const testDir = '/test/monsters';
      const basePath = 'library/monsters';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'dragon.sheet.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir, basePath);

      expect(result).toHaveLength(1);
      // Path normalization is handled in walk.ts for cross-platform compatibility
      expect(result[0].path).toBe('library/monsters/dragon.sheet');
    });

    it('should handle deeply nested .sheet.mdx files', () => {
      const testDir = '/test/content';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      // First call - root directory
      vi.mocked(fs.statSync).mockReturnValueOnce({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValueOnce([
        { name: 'monsters', isDirectory: () => true } as any,
      ] as any);
      
      // Second call - monsters subdirectory
      vi.mocked(fs.statSync).mockReturnValueOnce({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValueOnce([
        { name: 'boss.sheet.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].children).toBeDefined();
      expect(result[0].children?.[0]?.path).toBe('monsters/boss.sheet');
    });
  });

  describe('edge cases and conventions', () => {
    it('should handle files with multiple dots correctly', () => {
      const testDir = '/test/content';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'v2.0.draft.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      // toKebabCase should remove all dots except .sheet
      expect(result[0].path).toBe('v20draft');
    });

    it('should deduplicate .sheet.mdx and .mdx files with same base name', () => {
      const testDir = '/test/content';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'dragon.sheet.mdx', isDirectory: () => false } as any,
        { name: 'dragon.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      // Should only have one entry (preferring .sheet.mdx)
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('dragon.sheet');
    });

    it('should ignore .hidden. files', () => {
      const testDir = '/test/content';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'visible.mdx', isDirectory: () => false } as any,
        { name: 'file.hidden.mdx', isDirectory: () => false } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Visible');
    });

    it('should ignore configured folders', () => {
      const testDir = '/test/content';
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'content.mdx', isDirectory: () => false } as any,
        { name: '.obsidian', isDirectory: () => true } as any,
        { name: 'node_modules', isDirectory: () => true } as any,
      ] as any);

      const result = WalkModule.walk(testDir);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Content');
    });
  });
});
