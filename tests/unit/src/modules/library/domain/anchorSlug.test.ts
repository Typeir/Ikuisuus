/**
 * @fileoverview anchorSlug Tests
 * @module tests/unit/src/modules/library/domain/anchorSlug
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import { describe, expect, it } from 'vitest';

describe('anchorSlug', () => {
  it('should lowercase, hyphenate and strip punctuation', () => {
    expect(anchorSlug('My Awesome Heading!')).toBe('my-awesome-heading');
    expect(anchorSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
    expect(anchorSlug('Quacke (Recharge 5–6)')).toBe('quacke-recharge-56');
    expect(anchorSlug('--Edge-- ')).toBe('edge');
  });
});
