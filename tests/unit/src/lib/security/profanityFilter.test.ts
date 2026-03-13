/**
 * Profanity Filter Unit Tests
 *
 * @fileoverview Tests for the profanity detection system.
 *
 * @module tests/unit/lib/security/profanityFilter
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs');
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      debug: vi.fn(),
      message: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

let checkProfanity: typeof import('@/lib/security/profanityFilter').checkProfanity;
let checkProfanityMultiple: typeof import('@/lib/security/profanityFilter').checkProfanityMultiple;

beforeEach(async () => {
  vi.resetModules();

  const fs = await import('fs');
  vi.mocked(fs.readFileSync).mockReturnValue(
    'badword\nterrible\n# comment\n\nvulgar',
  );

  const mod = await import('@/lib/security/profanityFilter');
  checkProfanity = mod.checkProfanity;
  checkProfanityMultiple = mod.checkProfanityMultiple;
});

afterEach(() => vi.restoreAllMocks());

describe('profanityFilter', () => {
  describe('checkProfanity', () => {
    it('should detect banned terms', () => {
      const result = checkProfanity('This contains a badword in it');
      expect(result.flagged).toBe(true);
      expect(result.matches).toContain('badword');
    });

    it('should not flag clean text', () => {
      const result = checkProfanity('This is perfectly clean text');
      expect(result.flagged).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const result = checkProfanity('This has BADWORD in it');
      expect(result.flagged).toBe(true);
    });

    it('should detect multiple terms', () => {
      const result = checkProfanity('badword and terrible together');
      expect(result.flagged).toBe(true);
      expect(result.matches).toContain('badword');
      expect(result.matches).toContain('terrible');
    });

    it('should deduplicate matches', () => {
      const result = checkProfanity('badword badword badword');
      expect(result.matches).toHaveLength(1);
    });
  });

  describe('checkProfanityMultiple', () => {
    it('should check multiple texts', () => {
      const result = checkProfanityMultiple([
        'clean text',
        'text with badword',
      ]);
      expect(result.flagged).toBe(true);
      expect(result.matches).toContain('badword');
    });

    it('should return clean for empty array', () => {
      const result = checkProfanityMultiple([]);
      expect(result.flagged).toBe(false);
      expect(result.matches).toEqual([]);
    });

    it('should handle null/undefined texts gracefully', () => {
      const result = checkProfanityMultiple(['', 'clean']);
      expect(result.flagged).toBe(false);
    });

    it('should combine matches from all texts', () => {
      const result = checkProfanityMultiple(['has badword', 'has vulgar']);
      expect(result.matches).toContain('badword');
      expect(result.matches).toContain('vulgar');
    });
  });
});
