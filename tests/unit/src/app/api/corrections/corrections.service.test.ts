/**
 * corrections.service Unit Tests
 *
 * @fileoverview Tests for corrections service helper functions,
 * focusing on buildBranchName which must produce valid ASCII branch names
 * even when the file path contains non-ASCII Unicode characters.
 *
 * @module tests/unit/app/api/corrections/corrections.service
 */

import { buildBranchName } from '@/app/api/corrections/corrections.service';
import { describe, expect, it } from 'vitest';

describe('buildBranchName', () => {
  it('should produce an ASCII-only branch name for a standard slug', () => {
    const result = buildBranchName('en/monsters/aboleth.sheet.mdx', false);
    expect(result).toMatch(
      /^corrections\/en\/monsters\/aboleth-sheet-mdx-\d+$/,
    );
    expect(result).toMatch(/^[\x00-\x7F]+$/);
  });

  it('should strip diacritics from Finnish characters', () => {
    const result = buildBranchName(
      'en/character-creation/bloodlines/väärät.mdx',
      false,
    );
    expect(result).toContain('vaarat');
    expect(result).toMatch(/^[\x00-\x7F]+$/);
  });

  it('should strip diacritics from other Latin-extended characters', () => {
    const result = buildBranchName('en/world/ötzi-the-wanderer.mdx', false);
    expect(result).toContain('otzi');
    expect(result).toMatch(/^[\x00-\x7F]+$/);
  });

  it('should use "new" prefix for new-file mode', () => {
    const result = buildBranchName('en/spells/fireball.mdx', true);
    expect(result).toMatch(/^new\//);
  });

  it('should use "corrections" prefix for edit mode', () => {
    const result = buildBranchName('en/spells/fireball.mdx', false);
    expect(result).toMatch(/^corrections\//);
  });

  it('should append a numeric timestamp suffix', () => {
    const before = Date.now();
    const result = buildBranchName('en/test.mdx', false);
    const after = Date.now();
    const match = result.match(/-(\d+)$/);
    expect(match).not.toBeNull();
    const ts = Number(match![1]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('should replace remaining special characters with hyphens', () => {
    const result = buildBranchName('en/items/sword & shield.mdx', false);
    expect(result).not.toContain(' ');
    expect(result).not.toContain('&');
    expect(result).toMatch(/^[\x00-\x7F]+$/);
  });
});
