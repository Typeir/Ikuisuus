/**
 * @fileoverview Constants Unit Tests
 * @description Unit tests for file extension constants, regex patterns, and folder name enums.
 *
 * @module tests/unit/src/lib/constants/content.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/constants/content Constants under test
 */

import {
  CONTENT_SUFFIXES,
  FILE_EXT_MD,
  FILE_EXT_MDX,
  FileExtension,
  FolderName,
  IGNORED_FOLDERS,
  REGEX_CONTENT_SUFFIX,
  REGEX_EXTENSION,
  REGEX_SHEET_SUFFIX,
  RegexPatterns,
  isIndexFile,
  isNamedIndexFile,
  resolveIndexFile,
  stripContentSuffix,
} from '@/lib/constants/content';
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

  it('should reference REGEX_CONTENT_SUFFIX', () => {
    expect(RegexPatterns.ContentSuffix).toBe(REGEX_CONTENT_SUFFIX);
  });
});

describe('Content suffixes', () => {
  it('should include heirloom and trinket semantic suffixes', () => {
    expect(CONTENT_SUFFIXES).toContain('.heirloom');
    expect(CONTENT_SUFFIXES).toContain('.trinket');
  });

  it('should match heirloom and trinket suffixes', () => {
    expect(REGEX_CONTENT_SUFFIX.test('sunblade.heirloom')).toBe(true);
    expect(REGEX_CONTENT_SUFFIX.test('clockwork-bomb.trinket')).toBe(true);
  });
});

describe('stripContentSuffix', () => {
  it('should strip .sheet suffix', () => {
    expect(stripContentSuffix('ancient-red-dragon.sheet')).toBe(
      'ancient-red-dragon',
    );
  });

  it('should strip .heirloom suffix', () => {
    expect(stripContentSuffix('blackbone-crusher.heirloom')).toBe(
      'blackbone-crusher',
    );
  });

  it('should strip .trinket suffix', () => {
    expect(stripContentSuffix('clockwork-bomb.trinket')).toBe('clockwork-bomb');
  });

  it('should strip .specialization suffix', () => {
    expect(stripContentSuffix('battle-master.specialization')).toBe(
      'battle-master',
    );
  });

  it('should strip all recognized suffixes', () => {
    expect(stripContentSuffix('name.list')).toBe('name');
    expect(stripContentSuffix('name.bloodline')).toBe('name');
    expect(stripContentSuffix('name.lore')).toBe('name');
    expect(stripContentSuffix('name.spell')).toBe('name');
    expect(stripContentSuffix('name.feat')).toBe('name');
    expect(stripContentSuffix('name.tool')).toBe('name');
    expect(stripContentSuffix('name.rule')).toBe('name');
    expect(stripContentSuffix('name.boon')).toBe('name');
  });

  it('should not strip the retired .reference suffix', () => {
    expect(stripContentSuffix('name.reference')).toBe('name.reference');
  });

  it('should not modify strings without a suffix', () => {
    expect(stripContentSuffix('fireball')).toBe('fireball');
    expect(stripContentSuffix('ancient-red-dragon')).toBe('ancient-red-dragon');
  });

  it('should not strip unrecognized suffixes', () => {
    expect(stripContentSuffix('file.txt')).toBe('file.txt');
    expect(stripContentSuffix('file.unknown')).toBe('file.unknown');
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


describe('isNamedIndexFile', () => {
  it('matches a file whose stem equals its folder', () => {
    expect(isNamedIndexFile('bard.vocation.mdx', 'bard')).toBe(true);
    expect(isNamedIndexFile('bard.mdx', 'bard')).toBe(true);
    expect(isNamedIndexFile('bard.md', 'bard')).toBe(true);
  });

  it('rejects a sibling that is not the folder name', () => {
    expect(isNamedIndexFile('spells.list.mdx', 'bard')).toBe(false);
    expect(isNamedIndexFile('main.mdx', 'bard')).toBe(false);
  });

  it('rejects when there is no folder name', () => {
    expect(isNamedIndexFile('bard.vocation.mdx', '')).toBe(false);
  });
});

describe('isIndexFile', () => {
  it('accepts either convention', () => {
    expect(isIndexFile('bard.vocation.mdx', 'bard')).toBe(true);
    expect(isIndexFile('main.mdx', 'bard')).toBe(true);
  });

  it('rejects an ordinary sibling', () => {
    expect(isIndexFile('spells.list.mdx', 'bard')).toBe(false);
  });
});

describe('resolveIndexFile', () => {
  it('prefers the folder-named file over main', () => {
    expect(
      resolveIndexFile(['main.mdx', 'bard.vocation.mdx'], 'bard'),
    ).toBe('bard.vocation.mdx');
  });

  it('falls back to main when no folder-named file exists', () => {
    expect(resolveIndexFile(['main.mdx', 'spells.list.mdx'], 'bard')).toBe(
      'main.mdx',
    );
  });

  it('returns undefined when the folder has no index', () => {
    expect(
      resolveIndexFile(['spells.list.mdx', 'bane.spell.mdx'], 'bard'),
    ).toBeUndefined();
  });
});
