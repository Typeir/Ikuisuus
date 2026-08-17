/**
 * @fileoverview useIkUiHandle Tests
 * @description window.ik.ui registration, live getters, validated setters.
 *
 * @module tests/unit/src/lib/context/useIkUiHandle
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useIkUiHandle } from '@/lib/context/useIkUiHandle';
import {
  DEFAULT_PERSISTENT_UI_STATE,
  PERSISTED_UI_ACTION_TYPES,
} from '@/lib/types/persistentUiState';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type IkWindow = Window & {
  ik?: { ui?: { aspectDisplay: string; aspectExpanded: boolean; theme: string } };
};

function Host({ dispatch }: { dispatch: ReturnType<typeof vi.fn> }) {
  useIkUiHandle(
    { ...DEFAULT_PERSISTENT_UI_STATE, aspectDisplay: 'glyph', theme: 'light' },
    dispatch,
  );
  return null;
}

afterEach(() => {
  delete (window as IkWindow).ik;
});

describe('useIkUiHandle', () => {
  it('should register live getters and unregister on unmount', () => {
    const { unmount } = render(<Host dispatch={vi.fn()} />);
    const ui = (window as IkWindow).ik?.ui;
    expect(ui?.aspectDisplay).toBe('glyph');
    expect(ui?.theme).toBe('light');
    unmount();
    expect((window as IkWindow).ik?.ui).toBeUndefined();
  });

  it('should dispatch on valid sets and ignore invalid ones', () => {
    const dispatch = vi.fn();
    render(<Host dispatch={dispatch} />);
    const ui = (window as IkWindow).ik!.ui!;

    ui.aspectDisplay = 'verbose';
    ui.aspectDisplay = 'nonsense';
    ui.aspectExpanded = true;
    ui.theme = 'dark';
    ui.theme = 'purple';

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(dispatch).toHaveBeenCalledWith({
      type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_DISPLAY,
      payload: { display: 'verbose' },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED,
      payload: { expanded: true },
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: PERSISTED_UI_ACTION_TYPES.SET_THEME,
      payload: { theme: 'dark' },
    });
  });
});
