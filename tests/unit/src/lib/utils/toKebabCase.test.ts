/**
 * toKebabCase Utility Unit Tests
 *
 * @fileoverview Tests for the toKebabCase utility function that converts
 * strings to kebab-case format for URLs and filenames.
 */

import { toKebabCase } from '@/lib/utils/toKebabCase';
import { describe, expect, it } from 'vitest';

describe('toKebabCase', () => {
  it('should convert space-separated words to kebab-case', () => {
    expect(toKebabCase('Hello World')).toBe('hello-world');
    expect(toKebabCase('This is a test')).toBe('this-is-a-test');
  });

  it('should convert camelCase to kebab-case', () => {
    expect(toKebabCase('camelCase')).toBe('camel-case');
    expect(toKebabCase('myVariableName')).toBe('my-variable-name');
  });

  it('should convert PascalCase to kebab-case', () => {
    expect(toKebabCase('PascalCase')).toBe('pascal-case');
    expect(toKebabCase('MyComponentName')).toBe('my-component-name');
  });

  it('should handle snake_case input', () => {
    expect(toKebabCase('snake_case')).toBe('snake-case');
    expect(toKebabCase('my_variable_name')).toBe('my-variable-name');
  });

  it('should handle existing kebab-case input', () => {
    expect(toKebabCase('kebab-case')).toBe('kebab-case');
    expect(toKebabCase('already-kebab')).toBe('already-kebab');
  });

  it('should remove special characters', () => {
    expect(toKebabCase('hello@world')).toBe('helloworld');
    expect(toKebabCase('test!value#123')).toBe('testvalue123');
  });

  it('should preserve numbers', () => {
    expect(toKebabCase('Test123')).toBe('test123');
    expect(toKebabCase('Version 2.0')).toBe('version-20');
  });

  it('should handle multiple consecutive spaces', () => {
    expect(toKebabCase('hello   world')).toBe('hello-world');
    expect(toKebabCase('test  multiple  spaces')).toBe('test-multiple-spaces');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(toKebabCase('  hello world  ')).toBe('hello-world');
    expect(toKebabCase('\n test \t')).toBe('test');
  });

  it('should handle empty string', () => {
    expect(toKebabCase('')).toBe('');
    expect(toKebabCase('   ')).toBe('');
  });

  it('should handle single word', () => {
    expect(toKebabCase('hello')).toBe('hello');
    expect(toKebabCase('WORLD')).toBe('world');
  });

  it('should handle mixed case with numbers', () => {
    expect(toKebabCase('Level5Monster')).toBe('level5-monster');
    expect(toKebabCase('Attack2D6Fire')).toBe('attack2-d6-fire');
  });

  it('should handle D&D monster names', () => {
    expect(toKebabCase('Albedo, the Bleak Bloom')).toBe(
      'albedo-the-bleak-bloom',
    );
    expect(toKebabCase('Ancient Red Dragon')).toBe('ancient-red-dragon');
  });

  it('should preserve Unicode letters in slugs', () => {
    expect(toKebabCase('Väärät')).toBe('väärät');
    expect(toKebabCase('Crème Brûlée')).toBe('crème-brûlée');
  });

  it('should handle file extensions when stripped first (real-world usage)', () => {
    // Real usage: strip extension first, then kebab-case
    const fileWithExt = 'My File.mdx';
    const withoutExt = fileWithExt.replace(/\.mdx$/, '');
    expect(toKebabCase(withoutExt)).toBe('my-file');

    const componentFile = 'Component.tsx';
    const withoutTsx = componentFile.replace(/\.tsx$/, '');
    expect(toKebabCase(withoutTsx)).toBe('component');
  });

  it('should handle all caps with spaces', () => {
    expect(toKebabCase('ALL CAPS TEXT')).toBe('all-caps-text');
    expect(toKebabCase('AC HP CR')).toBe('ac-hp-cr');
  });

  it('should handle apostrophes and quotes', () => {
    expect(toKebabCase("Maximillien's Earthern Grasp")).toBe(
      'maximilliens-earthern-grasp',
    );
    expect(toKebabCase('"Quoted Text"')).toBe('quoted-text');
  });

  it('should handle parentheses', () => {
    expect(toKebabCase('Spell (Level 5)')).toBe('spell-level-5');
    expect(toKebabCase('Item (Rare, Attunement)')).toBe('item-rare-attunement');
  });

  describe('dot handling - critical for content suffix files', () => {
    it('should remove all dots from input', () => {
      expect(toKebabCase('Version 2.0')).toBe('version-20');
      expect(toKebabCase('test.value')).toBe('testvalue');
      expect(toKebabCase('a.b.c')).toBe('abc');
    });

    it('should remove dots which is why suffixes must be stripped before kebab-case', () => {
      const filename = 'abandoned-old-war-machine.sheet';
      expect(toKebabCase(filename)).toBe('abandoned-old-war-machinesheet');
    });

    it('should work correctly when suffix is removed before kebab-case', () => {
      const filename = 'Abandoned Old War Machine.sheet';
      const withoutSuffix = filename.replace(
        /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/,
        '',
      );
      const kebabBase = toKebabCase(withoutSuffix);

      expect(kebabBase).toBe('abandoned-old-war-machine');
    });

    it('should handle filenames with dots and content suffix', () => {
      const filename = 'Monster v2.0.sheet';
      const withoutSuffix = filename.replace(
        /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/,
        '',
      );
      const kebabBase = toKebabCase(withoutSuffix);

      expect(kebabBase).toBe('monster-v20');
    });
  });
});
