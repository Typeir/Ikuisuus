/**
 * @fileoverview isMdFile Utility Unit Tests
 * @description Tests for the isMdFile utility that checks if a file path
 * corresponds to a raw Markdown file (.md extension).
 *
 * @module tests/unit/src/lib/md/isMdFile.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/isMdFile Utility under test
 */

import { describe, it, expect } from 'vitest';
import { isMdFile } from '@/lib/md/isMdFile';

describe('isMdFile', () => {
  describe('exports', () => {
    it('should export isMdFile function', () => {
      expect(isMdFile).toBeDefined();
      expect(typeof isMdFile).toBe('function');
    });
  });

  describe('valid .md files', () => {
    it('should return true for simple .md file', () => {
      expect(isMdFile('document.md')).toBe(true);
    });

    it('should return true for .md file with path', () => {
      expect(isMdFile('/path/to/document.md')).toBe(true);
    });

    it('should return true for .md file with spaces in name', () => {
      expect(isMdFile('my document.md')).toBe(true);
    });

    it('should return true for .md file with special characters', () => {
      expect(isMdFile('my-doc_v2.md')).toBe(true);
    });

    it('should return true for .md in nested path', () => {
      expect(isMdFile('src/content/en/rules/combat.md')).toBe(true);
    });
  });

  describe('invalid files', () => {
    it('should return false for .mdx files', () => {
      expect(isMdFile('component.mdx')).toBe(false);
    });

    it('should return false for .txt files', () => {
      expect(isMdFile('readme.txt')).toBe(false);
    });

    it('should return false for .js files', () => {
      expect(isMdFile('script.js')).toBe(false);
    });

    it('should return false for .tsx files', () => {
      expect(isMdFile('component.tsx')).toBe(false);
    });

    it('should return false for files without extension', () => {
      expect(isMdFile('README')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isMdFile('')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for .markdown extension', () => {
      expect(isMdFile('document.markdown')).toBe(false);
    });

    it('should return false for .MD uppercase', () => {
      expect(isMdFile('DOCUMENT.MD')).toBe(false);
    });

    it('should return false for .md in middle of filename', () => {
      expect(isMdFile('readme.md.bak')).toBe(false);
    });

    it('should return false for just .md', () => {
      expect(isMdFile('.md')).toBe(true);
    });

    it('should handle Windows paths', () => {
      expect(isMdFile('C:\\Users\\docs\\file.md')).toBe(true);
    });

    it('should handle URL-like paths', () => {
      expect(isMdFile('/api/content/file.md')).toBe(true);
    });
  });

  describe('case sensitivity', () => {
    it('should be case-sensitive (reject uppercase)', () => {
      expect(isMdFile('file.MD')).toBe(false);
      expect(isMdFile('file.Md')).toBe(false);
      expect(isMdFile('file.mD')).toBe(false);
    });

    it('should only accept lowercase .md', () => {
      expect(isMdFile('file.md')).toBe(true);
    });
  });
});
