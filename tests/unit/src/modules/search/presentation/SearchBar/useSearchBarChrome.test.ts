/**
 * @fileoverview useSearchBarChrome Tests
 * @description Focus shortcut, outside click and dropdown room.
 *
 * @module tests/unit/src/modules/search/presentation/SearchBar/useSearchBarChrome
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  useDropdownRoom,
  useFocusShortcut,
  useOutsideClick,
} from '@/modules/search/presentation/SearchBar/useSearchBarChrome';
import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('useSearchBarChrome', () => {
  it('should focus the input on Ctrl-K', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    renderHook(() => useFocusShortcut({ current: input }));
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('should call onOutside for clicks outside wrapper and input', () => {
    const wrap = document.createElement('div');
    const input = document.createElement('input');
    const outside = document.createElement('button');
    document.body.append(wrap, input, outside);
    const onOutside = vi.fn();
    renderHook(() => useOutsideClick({ current: wrap }, { current: input }, onOutside));
    fireEvent.mouseDown(input);
    expect(onOutside).not.toHaveBeenCalled();
    fireEvent.mouseDown(outside);
    expect(onOutside).toHaveBeenCalledTimes(1);
    wrap.remove(); input.remove(); outside.remove();
  });

  it('should measure at least 160px of dropdown room while active', () => {
    const wrap = document.createElement('div');
    document.body.appendChild(wrap);
    const { result } = renderHook(() => useDropdownRoom({ current: wrap }, true));
    expect(result.current).toBeGreaterThanOrEqual(160);
    wrap.remove();
  });
});
