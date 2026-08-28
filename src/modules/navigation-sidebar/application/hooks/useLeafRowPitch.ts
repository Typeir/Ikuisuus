/**
 * @fileoverview Row pitch for the virtualized sidebar, resolved from the root font size
 * @description The static list spaces leaves by the `text-sm` line box (1.25rem)
 * plus the `space-y-1` gap (0.25rem). Virtualized rows are absolutely
 * positioned and never receive that margin, so the pitch must carry it — and
 * it must follow the root font size, which the reader's text-scale preference
 * multiplies at runtime. A px constant drifts the moment that multiplier moves.
 *
 * @module modules/navigation-sidebar/application/hooks/useLeafRowPitch
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

'use client';

import { usePersistentUiSelector } from '@/lib/context/PersistentUiContext';
import { FALLBACK_ROOT_PX, measureRootPx } from '@/lib/hooks/useRootPx';
import { useEffect, useState } from 'react';

/**
 * Leaf row pitch in rem: `text-sm` line-height (1.25rem) + `space-y-1` (0.25rem).
 *
 * @constant
 * @type {number}
 */
export const LEAF_ROW_PITCH_REM = 1.5;

export { FALLBACK_ROOT_PX, measureRootPx };

/**
 * Pixel pitch of one virtualized leaf row, tracking the root font size. The
 * text-scale preference is applied to the root by the provider's effect, which
 * runs after this component's effects, so the re-measure waits one frame.
 *
 * @returns {number} Row pitch in whole px
 */
export function useLeafRowPitch(): number {
  const textScale = usePersistentUiSelector((state) => state.textScale);
  const [rootPx, setRootPx] = useState(measureRootPx);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRootPx(measureRootPx()));
    return () => cancelAnimationFrame(frame);
  }, [textScale]);

  return Math.round(rootPx * LEAF_ROW_PITCH_REM);
}
