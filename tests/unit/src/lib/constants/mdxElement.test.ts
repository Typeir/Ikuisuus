/**
 * @fileoverview Unit tests for the MDX element attribute names.
 *
 * @module tests/unit/src/lib/constants/mdxElement.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

import { ELEMENT_NAME_ATTRIBUTE } from '@/lib/constants/mdxElement';
import { describe, expect, it } from 'vitest';

describe('mdxElement', () => {
  it('names the attribute as a data attribute, so it may sit on any element', () => {
    expect(ELEMENT_NAME_ATTRIBUTE.startsWith('data-')).toBe(true);
  });
});
