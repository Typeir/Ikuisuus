/**
 * @fileoverview useOutsideClick Unit Tests
 * @description Tests outside/inside detection, multi-target support, and the
 * active flag.
 *
 * @module tests/unit/src/lib/hooks/useOutsideClick.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/hooks/useOutsideClick Module under test
 */

import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Creates a detached element attached to the document body.
 *
 * @returns {HTMLDivElement} The attached element
 */
function attachDiv(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

/**
 * Dispatches a bubbling pointerdown on a node.
 *
 * @param {Node} node - Dispatch target
 * @returns {void}
 */
function press(node: Node): void {
  node.dispatchEvent(new Event('pointerdown', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useOutsideClick', () => {
  it('fires on a press outside the target', () => {
    const inside = attachDiv();
    const outside = attachDiv();
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick({ current: inside }, onOutside));

    act(() => press(outside));

    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('ignores a press inside the target', () => {
    const inside = attachDiv();
    const child = document.createElement('span');
    inside.appendChild(child);
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick({ current: inside }, onOutside));

    act(() => press(child));

    expect(onOutside).not.toHaveBeenCalled();
  });

  it('treats every listed target as inside', () => {
    const a = attachDiv();
    const b = attachDiv();
    const outside = attachDiv();
    const onOutside = vi.fn();
    renderHook(() =>
      useOutsideClick([{ current: a }, { current: b }], onOutside),
    );

    act(() => press(b));
    expect(onOutside).not.toHaveBeenCalled();

    act(() => press(outside));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('stays detached while inactive', () => {
    const inside = attachDiv();
    const outside = attachDiv();
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick({ current: inside }, onOutside, false));

    act(() => press(outside));

    expect(onOutside).not.toHaveBeenCalled();
  });
});
