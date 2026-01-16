/**
 * toTitleCase Utility Unit Tests
 *
 * @fileoverview Tests for kebab-case to Title Case string conversion utility.
 * Validates dash replacement, word capitalization, and multiple dash handling.
 *
 * @module tests/unit/lib/utils/toTitleCase
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/toTitleCase Module under test
 */

import { describe, it, expect } from 'vitest';
import { toTitleCase } from '@/lib/utils/toTitleCase';

describe('toTitleCase', () => {
  describe('basic conversion', () => {
    it('should convert single word to capitalized form', () => {
      expect(toTitleCase('dragon')).toBe('Dragon');
    });

    it('should convert hyphenated words to Title Case', () => {
      expect(toTitleCase('iron-snail-warrior')).toBe('Iron Snail Warrior');
    });

    it('should replace hyphens with spaces', () => {
      expect(toTitleCase('hello-world')).toBe('Hello World');
    });
  });

  describe('multiple hyphen handling', () => {
    it('should collapse multiple consecutive hyphens into single space', () => {
      expect(toTitleCase('items---heirlooms')).toBe('Items Heirlooms');
    });

    it('should handle double hyphens', () => {
      expect(toTitleCase('some--thing')).toBe('Some Thing');
    });

    it('should handle various hyphen counts consistently', () => {
      expect(toTitleCase('a-b--c---d----e')).toBe('A B C D E');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('should handle string with only hyphens', () => {
      expect(toTitleCase('---')).toBe(' ');
    });

    it('should preserve already capitalized words', () => {
      expect(toTitleCase('DRAGON-SLAYER')).toBe('DRAGON SLAYER');
    });

    it('should handle strings starting with hyphen', () => {
      expect(toTitleCase('-test')).toBe(' Test');
    });

    it('should handle strings ending with hyphen', () => {
      expect(toTitleCase('test-')).toBe('Test ');
    });
  });

  describe('special characters', () => {
    it('should capitalize after numbers', () => {
      expect(toTitleCase('level-5-spell')).toBe('Level 5 Spell');
    });

    it('should handle mixed content', () => {
      expect(toTitleCase('the-3rd-dragon')).toBe('The 3rd Dragon');
    });
  });
});
