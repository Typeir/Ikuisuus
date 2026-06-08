/**
 * @fileoverview Unit tests for stripContentPrefix.
 * @module tests/unit/src/modules/library/infrastructure/content/stripContentPrefix
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { stripContentPrefix } from '@/modules/library/infrastructure/content/stripContentPrefix';
import { describe, expect, it } from 'vitest';

describe('stripContentPrefix', () => {
  it('removes source content prefix', () => {
    expect(stripContentPrefix('src/content/en/spells/fireball.mdx')).toBe(
      'spells/fireball.mdx',
    );
  });
});
