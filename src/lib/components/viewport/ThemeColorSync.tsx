/**
 * @fileoverview Keeps the UA chrome colour matched to the active palette.
 * @description Writes `<meta name="theme-color">` from the live `--color-bg`
 * token.
 * @module lib/components/viewport/ThemeColorSync
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import { useThemeState } from '@/lib/context/PersistentUiContext';
import { useEffect } from 'react';

/**
 * Name of the meta tag this component owns.
 *
 * @constant
 */
const THEME_COLOR_META = 'theme-color';

/**
 * Reads the resolved background colour off the document element.
 *
 * @returns {string} Computed `--color-bg`, or an empty string when unset
 */
const readBackgroundToken = (): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--color-bg')
    .trim();

/**
 * Syncs the `theme-color` meta tag to the active theme. Renders nothing.
 *
 * @component
 * @returns {null} No DOM of its own
 */
export function ThemeColorSync(): null {
  const { theme } = useThemeState();

  useEffect(() => {
    const color = readBackgroundToken();
    if (!color) return;

    let meta = document.querySelector<HTMLMetaElement>(
      `meta[name="${THEME_COLOR_META}"]`,
    );

    if (!meta) {
      meta = document.createElement('meta');
      meta.name = THEME_COLOR_META;
      document.head.appendChild(meta);
    }

    meta.content = color;
  }, [theme]);

  return null;
}

export default ThemeColorSync;
