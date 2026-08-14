/**
 * @fileoverview Theme Selector Component
 * @description Client-side component that cycles through available themes
 * (dark/light). Uses rangeWrap to wrap the theme index within bounds.
 * Invokes onThemeChange with the next theme on click.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires @/lib/enums/themes
 * @requires @/lib/utils/rangeWrap
 * @requires ./themeSelector.module.scss
 *
 * @example
 * ```tsx
 * import { ThemeSelector } from '@/lib/components/themeSelector/themeSelector';
 *
 * <ThemeSelector
 *   defaultTheme={Theme.Dark}
 *   onThemeChange={(newTheme) => console.log('Theme changed:', newTheme)}
 * />
 * ```
 * @module src/lib/components/themeSelector/themeSelector
 */
'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { Theme } from '../../enums/themes';
import { rangeWrap } from '../../utils/rangeWrap';
import styles from './themeSelector.module.scss';

const THEMES: Theme[] = Object.values(Theme);

/**
 * Props for the ThemeSelector component.
 *
 * @typedef {Object} ThemeSelectorProps
 * @property {(newTheme: Theme) => void} [onThemeChange] - Optional callback triggered when the theme changes.
 * @property {Theme} defaultTheme - default theme value
 */
export type ThemeSelectorProps = {
  onThemeChange?: (newTheme: Theme) => void;
  defaultTheme?: Theme;
};

/**
 * React client component that cycles through predefined themes via a button.
 *
 * Increments the current theme index with wrap-around and calls onThemeChange
 * with the next theme.
 *
 * @param {ThemeSelectorProps} props - The component props.
 * @property {Theme} props.onThemeChange - callback for when theme changes
 * @property {string} props.defaultTheme - default theme value
 * @returns {JSX.Element} A themed UI selector button and heading.
 */
export const ThemeSelector = ({
  defaultTheme,
  onThemeChange = () => {},
}: ThemeSelectorProps): JSX.Element => {
  const [themeIndex, setThemeIndex] = useState(
    rangeWrap(THEMES.indexOf(defaultTheme ?? THEMES[0]), 0, THEMES.length - 1),
  );

  return (
    <div className='flex flex-col items-start gap-2 mb-4'>
      <button
        onClick={() => {
          const newTheme = rangeWrap(themeIndex + 1, 0, THEMES.length - 1);
          setThemeIndex(newTheme);
          onThemeChange(THEMES[newTheme]);
        }}
        className={`${styles['theme-toggle']} text-lg font-medium`}>
        Theme:
      </button>
    </div>
  );
};
