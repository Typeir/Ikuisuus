/**
 * Theme Changed Event
 *
 * @fileoverview Dispatches `ik:theme-changed` on `window` whenever the
 * persisted theme changes, after mount.
 *
 * @module app/[locale]/utils/useThemeChangedEvent
 * @version 1.0.0
 * @author Typeir
 * @since 1.1.0
 */

'use client';

import { useThemeState } from '@/lib/context/PersistentUiContext';
import { useEffect, useState } from 'react';

/**
 * Broadcasts the current theme as a `CustomEvent` with `detail.theme`.
 * Skips the server-rendered pass so the first dispatch carries the hydrated
 * value.
 */
export function useThemeChangedEvent(): void {
  const { theme } = useThemeState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.dispatchEvent(
      new CustomEvent('ik:theme-changed', { detail: { theme } }),
    );
  }, [theme, mounted]);
}
