/**
 * @fileoverview Constants Unit Tests
 * @description Tests for file extension constants, regex patterns, and folder name enums
 * used throughout the codebase for content processing.
 *
 * @module tests/unit/lib/enums/constants
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/enums/constants Constants under test
 */

import { describe, it, expect } from 'vitest';
import {
  FILE_EXT_MD,
  FILE_EXT_MDX,
  REGEX_EXTENSION,
  REGEX_SHEET_SUFFIX,
  IGNORED_FOLDERS,
  FileExtension,
  RegexPatterns,
  FolderName,
} from '@/lib/enums/constants';

describe('File Extension Constants', () => {
  describe('FILE_EXT_MD', () => {
    it('should be .md', () => {
      expect(FILE_EXT_MD).toBe('.md');
    });
  });

  describe('FILE_EXT_MDX', () => {
    it('should be .mdx', () => {
      expect(FILE_EXT_MDX).toBe('.mdx');
    });
  });
});

describe('REGEX_EXTENSION', () => {
  it('should match .md extension', () => {
    expect(REGEX_EXTENSION.test('file.md')).toBe(true);
    expect(REGEX_EXTENSION.test('document.md')).toBe(true);
  });

  it('should match .mdx extension', () => {
    expect(REGEX_EXTENSION.test('file.mdx')).toBe(true);
    expect(REGEX_EXTENSION.test('component.mdx')).toBe(true);
  });

  it('should not match other extensions', () => {
    expect(REGEX_EXTENSION.test('file.txt')).toBe(false);
    expect(REGEX_EXTENSION.test('file.js')).toBe(false);
    expect(REGEX_EXTENSION.test('file.tsx')).toBe(false);
  });

  it('should match at end of string', () => {
    expect('path/to/file.md'.match(REGEX_EXTENSION)).toBeTruthy();
    expect('file.md.bak'.match(REGEX_EXTENSION)).toBeFalsy();
  });
});

describe('REGEX_SHEET_SUFFIX', () => {
  it('should match .sheet suffix', () => {
    expect(REGEX_SHEET_SUFFIX.test('monster.sheet')).toBe(true);
  });

  it('should not match sheet without dot', () => {
    expect(REGEX_SHEET_SUFFIX.test('sheet')).toBe(false);
    expect(REGEX_SHEET_SUFFIX.test('monstersheet')).toBe(false);
  });
});

describe('IGNORED_FOLDERS', () => {
  it('should include .obsidian', () => {
    expect(IGNORED_FOLDERS).toContain('.obsidian');
  });

  it('should include .git', () => {
    expect(IGNORED_FOLDERS).toContain('.git');
  });

  it('should include node_modules', () => {
    expect(IGNORED_FOLDERS).toContain('node_modules');
  });

  it('should include .vscode', () => {
    expect(IGNORED_FOLDERS).toContain('.vscode');
  });

  it('should be readonly array', () => {
    expect(Array.isArray(IGNORED_FOLDERS)).toBe(true);
    expect(IGNORED_FOLDERS.length).toBe(4);
  });
});

describe('FileExtension enum', () => {
  it('should define MD extension', () => {
    expect(FileExtension.MD).toBe('.md');
  });

  it('should define MDX extension', () => {
    expect(FileExtension.MDX).toBe('.mdx');
  });

  it('should have only two extensions', () => {
    const extensions = Object.values(FileExtension);
    expect(extensions.length).toBe(2);
  });
});

describe('RegexPatterns', () => {
  it('should have Extension pattern', () => {
    expect(RegexPatterns.Extension).toBeDefined();
    expect(RegexPatterns.Extension instanceof RegExp).toBe(true);
  });

  it('should have SheetSuffix pattern', () => {
    expect(RegexPatterns.SheetSuffix).toBeDefined();
    expect(RegexPatterns.SheetSuffix instanceof RegExp).toBe(true);
  });

  it('should reference REGEX_SHEET_SUFFIX', () => {
    expect(RegexPatterns.SheetSuffix).toBe(REGEX_SHEET_SUFFIX);
  });
});

describe('FolderName enum', () => {
  it('should define Src folder', () => {
    expect(FolderName.Src).toBe('src');
  });

  it('should define Content folder', () => {
    expect(FolderName.Content).toBe('content');
  });
});
