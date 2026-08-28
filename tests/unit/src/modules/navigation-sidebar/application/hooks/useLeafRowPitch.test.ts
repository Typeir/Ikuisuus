/**
 * @fileoverview useLeafRowPitch Tests
 * @description Covers the rem-to-px resolution of the virtualized row pitch
 * against the root font size, and the fallback when it cannot be measured.
 *
 * @module tests/unit/src/modules/navigation-sidebar/application/hooks/useLeafRowPitch
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering and queries
 * @requires @/modules/navigation-sidebar/application/hooks/useLeafRowPitch Module under test
 */

import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import {
  FALLBACK_ROOT_PX,
  LEAF_ROW_PITCH_REM,
  measureRootPx,
  useLeafRowPitch,
} from '@/modules/navigation-sidebar/application/hooks/useLeafRowPitch';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Wraps a hook render in the persistent UI provider.
 *
 * @param {{ children: ReactNode }} props - Hook subtree
 * @returns {React.ReactElement} Provider element
 */
function wrapper({ children }: { children: ReactNode }) {
  return createElement(PersistentUiProvider, { initialExpandedPaths: [] }, children);
}

describe('useLeafRowPitch', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.style.fontSize = '';
  });

  afterEach(() => {
    document.documentElement.style.fontSize = '';
  });

  it('resolves 1.5rem against the root font size', async () => {
    document.documentElement.style.fontSize = '14px';

    const { result } = renderHook(() => useLeafRowPitch(), { wrapper });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current).toBe(Math.round(14 * LEAF_ROW_PITCH_REM));
    expect(result.current).toBe(21);
  });

  it('rounds to whole px at a scaled root', async () => {
    document.documentElement.style.fontSize = '16.1px';

    const { result } = renderHook(() => useLeafRowPitch(), { wrapper });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(result.current).toBe(24);
  });

  it('falls back to the shipped base when the root cannot be measured', () => {
    expect(measureRootPx()).toBe(FALLBACK_ROOT_PX);
  });
});
