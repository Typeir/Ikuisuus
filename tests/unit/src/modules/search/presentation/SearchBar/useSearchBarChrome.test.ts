/**
 * @fileoverview useSearchBarChrome Tests
 * @description Focus shortcut behaviour.
 *
 * @module tests/unit/src/modules/search/presentation/SearchBar/useSearchBarChrome.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useFocusShortcut } from '@/modules/search/presentation/SearchBar/useSearchBarChrome';
import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useSearchBarChrome', () => {
  it('should focus the input on Ctrl-K', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    renderHook(() => useFocusShortcut({ current: input }));
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(document.activeElement).toBe(input);
    input.remove();
  });
});
