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

import {
    FILE_EXT_MD,
    FILE_EXT_MDX,
    FileExtension,
    FolderName,
    IGNORED_FOLDERS,
    REGEX_EXTENSION,
    REGEX_SHEET_SUFFIX,
    RegexPatterns,
} from '@/lib/enums/constants';
import { describe, expect, it } from 'vitest';

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
  it('should be an array of RegExp', () => {
    expect(Array.isArray(IGNORED_FOLDERS)).toBe(true);
    IGNORED_FOLDERS.forEach((r) => expect(r).toBeInstanceOf(RegExp));
  });

  it('should match dot-prefixed names', () => {
    expect(IGNORED_FOLDERS.some((r) => r.test('.obsidian'))).toBe(true);
    expect(IGNORED_FOLDERS.some((r) => r.test('.git'))).toBe(true);
    expect(IGNORED_FOLDERS.some((r) => r.test('.vscode'))).toBe(true);
    expect(IGNORED_FOLDERS.some((r) => r.test('.draft'))).toBe(true);
  });

  it('should match node_modules', () => {
    expect(IGNORED_FOLDERS.some((r) => r.test('node_modules'))).toBe(true);
  });

  it('should not match regular folder names', () => {
    expect(IGNORED_FOLDERS.some((r) => r.test('monsters'))).toBe(false);
    expect(IGNORED_FOLDERS.some((r) => r.test('spells'))).toBe(false);
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
