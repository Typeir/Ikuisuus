/**
 * resolveContentFilePath Utility Unit Tests
 *
 * @fileoverview Comprehensive tests for content file path resolution with filesystem mocking.
 * Tests extension priority (.mdx, .sheet.mdx, .md), path resolution, and error handling.
 *
 * @module tests/unit/lib/utils/resolveContentFilePath
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/resolveContentFilePath Module under test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveContentFilePath } from '@/lib/utils/resolveContentFilePath';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises
vi.mock('fs/promises');

describe('resolveContentFilePath', () => {
  const mockRootDir = '/content/en';
  const mockSlugPath = 'monsters/albedo';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exports', () => {
    it('should export resolveContentFilePath function', () => {
      expect(resolveContentFilePath).toBeDefined();
      expect(typeof resolveContentFilePath).toBe('function');
    });
  });

  describe('extension priority', () => {
    it('should return .mdx file if it exists first', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('.mdx') && !filePath.includes('.sheet')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBe(path.join(mockRootDir, 'monsters/albedo.mdx'));
    });

    it('should return .sheet.mdx file if .mdx does not exist', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('.sheet.mdx')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBe(path.join(mockRootDir, 'monsters/albedo.sheet.mdx'));
    });

    it('should return .md file as last resort', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBe(path.join(mockRootDir, 'monsters/albedo.md'));
    });

    it('should prioritize .mdx over .sheet.mdx when both exist', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBe(path.join(mockRootDir, 'monsters/albedo.mdx'));
    });
  });

  describe('path resolution', () => {
    it('should handle nested slug paths', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        const normalizedPath = String(filePath).replace(/\\/g, '/');
        if (normalizedPath.endsWith('items/heirlooms/sunblade.mdx')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, 'items/heirlooms/sunblade');

      expect(result).toBe(path.join(mockRootDir, 'items', 'heirlooms', 'sunblade.mdx'));
    });

    it('should handle single-level slugs', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('main.mdx')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, 'main');

      expect(result).toBe(path.join(mockRootDir, 'main.mdx'));
    });

    it('should handle empty slug gracefully', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('.mdx') && !filePath.includes('monsters')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, '');

      expect(result).toBe(path.join(mockRootDir, '.mdx'));
    });
  });

  describe('error handling', () => {
    it('should return null when no variants exist', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const result = await resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBeNull();
    });

    it('should return null for non-existent paths', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const result = await resolveContentFilePath(
        '/definitely/not/real',
        'missing-file'
      );

      expect(result).toBeNull();
    });

    it('should handle filesystem errors gracefully', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Permission denied'));

      const result = await resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBeNull();
    });
  });

  describe('async behavior', () => {
    it('should return a Promise', () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = resolveContentFilePath(mockRootDir, mockSlugPath);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should call fs.access for each variant until found', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.endsWith('.sheet.mdx')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      await resolveContentFilePath(mockRootDir, mockSlugPath);

      // Should have called fs.access for .mdx (failed), then .sheet.mdx (succeeded)
      expect(fs.access).toHaveBeenCalledTimes(2);
      expect(fs.access).toHaveBeenNthCalledWith(1, path.join(mockRootDir, 'monsters/albedo.mdx'));
      expect(fs.access).toHaveBeenNthCalledWith(2, path.join(mockRootDir, 'monsters/albedo.sheet.mdx'));
    });

    it('should stop checking after finding first match', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await resolveContentFilePath(mockRootDir, mockSlugPath);

      // Should only check .mdx, then stop
      expect(fs.access).toHaveBeenCalledTimes(1);
    });
  });

  describe('special characters and edge cases', () => {
    it('should handle slugs with hyphens', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.includes('albedo-the-bleak-bloom')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, 'monsters/albedo-the-bleak-bloom');

      expect(result).toBe(path.join(mockRootDir, 'monsters/albedo-the-bleak-bloom.mdx'));
    });

    it('should handle slugs with numbers', async () => {
      vi.mocked(fs.access).mockImplementation(async (filePath: any) => {
        if (filePath.includes('spell-level-5')) {
          return Promise.resolve();
        }
        throw new Error('File not found');
      });

      const result = await resolveContentFilePath(mockRootDir, 'spells/spell-level-5');

      expect(result).toBe(path.join(mockRootDir, 'spells/spell-level-5.mdx'));
    });

    it('should construct correct absolute paths', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await resolveContentFilePath('/absolute/path/to/content', 'test-slug');

      // Normalize for cross-platform testing
      const normalizedResult = result?.replace(/\\/g, '/');
      expect(normalizedResult).toMatch(/^\/absolute\/path\/to\/content/);
      expect(path.isAbsolute(result!)).toBe(true);
    });
  });
});

