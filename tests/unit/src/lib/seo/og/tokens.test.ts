/**
 * @fileoverview Unit tests for OG design tokens.
 *
 * Validates that the token map contains the expected keys and that all values
 * are non-empty hex colour strings.
 *
 * @module tests/unit/src/lib/seo/og/tokens.test
 */

import { OG_HEIGHT, OG_TOKENS, OG_WIDTH } from '@/lib/seo/og/tokens';
import { describe, expect, it } from 'vitest';

describe('OG_TOKENS', () => {
  it('exports all required colour tokens', () => {
    const requiredKeys = [
      'bg',
      'bgSecondary',
      'surface',
      'emphasis',
      'accent',
      'text',
      'textMuted',
      'border',
    ] as const;

    for (const key of requiredKeys) {
      expect(OG_TOKENS[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('exports correct canvas dimensions', () => {
    expect(OG_WIDTH).toBe(1200);
    expect(OG_HEIGHT).toBe(630);
  });

  it('emphasis token is the verdant teal colour', () => {
    expect(OG_TOKENS.emphasis).toBe('#8acfd4');
  });
});
