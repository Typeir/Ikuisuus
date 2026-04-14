/**
 * @fileoverview Text Utilities Unit Tests
 * @description Tests for pure text processing functions used by metadata generators.
 *
 * @module tests/unit/lib/metadata/textUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    clean,
    filePathToSlug,
    readLines,
    stripMarkdown,
    toKebabCase,
} from '@scripts/metadata/textUtils';
import { describe, expect, it } from 'vitest';

describe('clean', () => {
  it('should remove carriage returns and trim whitespace', () => {
    expect(clean('  hello\r\nworld  ')).toBe('hello\nworld');
  });

  it('should handle empty string', () => {
    expect(clean('')).toBe('');
  });

  it('should handle falsy input', () => {
    expect(clean(undefined as unknown as string)).toBe('');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(clean('   test   ')).toBe('test');
  });
});

describe('stripMarkdown', () => {
  it('should remove bold markers', () => {
    expect(stripMarkdown('**bold text**')).toBe('bold text');
  });

  it('should remove italic markers', () => {
    expect(stripMarkdown('*italic text*')).toBe('italic text');
  });

  it('should remove underscore italic markers', () => {
    expect(stripMarkdown('_italic text_')).toBe('italic text');
  });

  it('should remove inline code markers', () => {
    expect(stripMarkdown('`code`')).toBe('code');
  });

  it('should handle multiple markers in one string', () => {
    expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic');
  });

  it('should return falsy values unchanged', () => {
    expect(stripMarkdown('')).toBe('');
  });
});

describe('toKebabCase', () => {
  it('should convert spaces to hyphens', () => {
    expect(toKebabCase('hello world')).toBe('hello-world');
  });

  it('should lowercase the result', () => {
    expect(toKebabCase('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(toKebabCase('Albedo, the Bleak Bloom')).toBe(
      'albedo-the-bleak-bloom',
    );
  });

  it('should strip leading/trailing hyphens', () => {
    expect(toKebabCase('  hello  ')).toBe('hello');
  });

  it('should collapse multiple non-alphanumeric chars', () => {
    expect(toKebabCase('a---b___c')).toBe('a-b-c');
  });
});

describe('filePathToSlug', () => {
  it('should extract slug from .mdx file', () => {
    expect(filePathToSlug('path/to/goblin.mdx')).toBe('goblin');
  });

  it('should extract slug from .sheet.mdx file', () => {
    expect(filePathToSlug('path/to/goblin.sheet.mdx')).toBe('goblin');
  });

  it('should handle case insensitive extensions', () => {
    expect(filePathToSlug('path/to/GOBLIN.MDX')).toBe('GOBLIN');
  });

  it('should extract only basename without directory', () => {
    expect(filePathToSlug('/long/nested/path/goblin.mdx')).toBe('goblin');
  });
});

describe('readLines', () => {
  it('should split by newlines', () => {
    expect(readLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('should handle Windows-style line endings', () => {
    expect(readLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
  });

  it('should return single-element array for no newlines', () => {
    expect(readLines('hello')).toEqual(['hello']);
  });

  it('should handle empty string', () => {
    expect(readLines('')).toEqual(['']);
  });
});
