/**
 * @fileoverview setPx tests.
 * @module tests/unit/src/lib/utils/motion/setPx.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { setPx, setPxOrDrop } from '@/lib/utils/motion';
import { beforeEach, describe, expect, it } from 'vitest';

describe('setPx', () => {
  /** A fresh element to write properties on. */
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
  });

  it('should write a rounded pixel value the first time', () => {
    expect(setPx(el, '--x', 12.4)).toBe(true);
    expect(el.style.getPropertyValue('--x')).toBe('12px');
  });

  it('should ignore a change smaller than the slack', () => {
    setPx(el, '--x', 100);
    expect(setPx(el, '--x', 101)).toBe(false);
    expect(el.style.getPropertyValue('--x')).toBe('100px');
  });

  it('should write a change that reaches the slack', () => {
    setPx(el, '--x', 100);
    expect(setPx(el, '--x', 102)).toBe(true);
    expect(el.style.getPropertyValue('--x')).toBe('102px');
  });

  it('should hold still when a measurement oscillates by a pixel', () => {
    setPx(el, '--x', 400);
    for (const reading of [400.6, 399.4, 400.5, 399.5]) {
      setPx(el, '--x', reading);
    }
    expect(el.style.getPropertyValue('--x')).toBe('400px');
  });

  it('should take a wider slack when asked', () => {
    setPx(el, '--x', 100);
    expect(setPx(el, '--x', 105, 10)).toBe(false);
    expect(setPx(el, '--x', 115, 10)).toBe(true);
  });
});

describe('setPxOrDrop', () => {
  /** A fresh element to write properties on. */
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
  });

  it('should write a real measurement', () => {
    setPxOrDrop(el, '--x', 40);
    expect(el.style.getPropertyValue('--x')).toBe('40px');
  });

  it('should take the property away when there is nothing to measure', () => {
    setPxOrDrop(el, '--x', 40);
    setPxOrDrop(el, '--x', null);
    expect(el.style.getPropertyValue('--x')).toBe('');
  });

  it('should take the property away rather than write a zero', () => {
    setPxOrDrop(el, '--x', 40);
    setPxOrDrop(el, '--x', 0);
    expect(el.style.getPropertyValue('--x')).toBe('');
  });
});
