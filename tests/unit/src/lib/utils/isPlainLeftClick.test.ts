/**
 * @fileoverview isPlainLeftClick Unit Tests
 * @description Covers the modifier and button combinations that must be left
 * to the browser, so link interception never swallows "open in new tab".
 *
 * @module tests/unit/src/lib/utils/isPlainLeftClick
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  isPlainLeftClick,
  type ClickLike,
} from '@/lib/utils/isPlainLeftClick';
import { describe, expect, it } from 'vitest';

/**
 * Build a click descriptor with no modifiers on the primary button.
 *
 * @function makeClick
 * @param {Partial<ClickLike>} [overrides] - Fields to override
 * @returns {ClickLike} Click descriptor
 */
const makeClick = (overrides: Partial<ClickLike> = {}): ClickLike => ({
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  defaultPrevented: false,
  ...overrides,
});

describe('isPlainLeftClick', () => {
  it('accepts an unmodified primary-button click', () => {
    expect(isPlainLeftClick(makeClick())).toBe(true);
  });

  it('accepts a click with defaultPrevented omitted', () => {
    const { defaultPrevented: _omitted, ...rest } = makeClick();
    expect(isPlainLeftClick(rest)).toBe(true);
  });

  it.each([
    ['middle button', { button: 1 }],
    ['secondary button', { button: 2 }],
    ['meta held', { metaKey: true }],
    ['ctrl held', { ctrlKey: true }],
    ['shift held', { shiftKey: true }],
    ['alt held', { altKey: true }],
    ['already handled', { defaultPrevented: true }],
  ])('rejects %s', (_label, overrides) => {
    expect(isPlainLeftClick(makeClick(overrides))).toBe(false);
  });
});
