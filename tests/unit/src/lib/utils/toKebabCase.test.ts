/**
 * toKebabCase Utility Unit Tests
 * 
 * @fileoverview Tests for the toKebabCase utility function that converts
 * strings to kebab-case format for URLs and filenames.
 */

import { describe, it, expect } from 'vitest';
import { toKebabCase } from '@/lib/utils/toKebabCase';

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
    expect(toKebabCase('Albedo, the Bleak Bloom')).toBe('albedo-the-bleak-bloom');
    expect(toKebabCase('Ancient Red Dragon')).toBe('ancient-red-dragon');
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
    expect(toKebabCase("Hunter's Mark")).toBe('hunters-mark');
    expect(toKebabCase('"Quoted Text"')).toBe('quoted-text');
  });

  it('should handle parentheses', () => {
    expect(toKebabCase('Spell (Level 5)')).toBe('spell-level-5');
    expect(toKebabCase('Item (Rare, Attunement)')).toBe('item-rare-attunement');
  });

  describe('dot handling - critical for .sheet files', () => {
    it('should remove all dots from input', () => {
      expect(toKebabCase('Version 2.0')).toBe('version-20');
      expect(toKebabCase('test.value')).toBe('testvalue');
      expect(toKebabCase('a.b.c')).toBe('abc');
    });

    it('should remove dots which is why .sheet must be added back', () => {
      // This documents WHY walk.ts needs to handle .sheet specially
      const filename = 'abandoned-old-war-machine.sheet';
      expect(toKebabCase(filename)).toBe('abandoned-old-war-machinesheet');
      // ❌ Wrong! The .sheet got removed and concatenated
    });

    it('should work correctly when .sheet is removed before kebab-case', () => {
      // This is the CORRECT pattern used in walk.ts
      const filename = 'Abandoned Old War Machine.sheet';
      const withoutSheet = filename.replace(/\.sheet$/, '');
      const kebabBase = toKebabCase(withoutSheet);
      const finalPath = kebabBase + '.sheet';
      
      expect(finalPath).toBe('abandoned-old-war-machine.sheet');
      // ✅ Correct!
    });

    it('should handle filenames with dots and .sheet suffix', () => {
      const filename = 'Monster v2.0.sheet';
      const withoutSheet = filename.replace(/\.sheet$/, '');
      const kebabBase = toKebabCase(withoutSheet);
      const finalPath = kebabBase + '.sheet';
      
      expect(finalPath).toBe('monster-v20.sheet');
    });
  });
});
