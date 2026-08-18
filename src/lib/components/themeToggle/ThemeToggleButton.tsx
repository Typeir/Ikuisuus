/**
 * @fileoverview The site's theme toggle control.
 * @description Single definition of the round Moon/Sun button used in the
 * sidebar header, the mobile title bar, and the preferences panel. Drives
 * theme through the persistent UI port, so every copy reads the same state.
 *
 * @module lib/components/themeToggle/ThemeToggleButton
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import {
  useThemeActions,
  useThemeState,
} from '@/lib/context/PersistentUiContext';
import { Theme } from '@/lib/enums/themes';
import cn from '@/lib/utils/classNameMerge';
import btn from '@/styles/buttons.module.scss';
import { Moon, Sun } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import styles from './themeToggle.module.scss';

/**
 * Props for {@link ThemeToggleButton}.
 *
 * @interface ThemeToggleButtonProps
 * @property {string} [className] - Extra class merged onto the button
 * @property {string} [ariaLabel='Toggle theme'] - Accessible label
 */
export interface ThemeToggleButtonProps {
  className?: string;
  ariaLabel?: string;
}

/**
 * Renders the theme toggle.
 *
 * @component
 * @param {ThemeToggleButtonProps} props - Component props
 * @param {string} [props.className] - Extra class merged onto the button
 * @param {string} [props.ariaLabel='Toggle theme'] - Accessible label
 * @returns {JSX.Element} The toggle button
 */
export function ThemeToggleButton({
  className,
  ariaLabel = 'Toggle theme',
}: ThemeToggleButtonProps): JSX.Element {
  const { theme } = useThemeState();
  const { setTheme } = useThemeActions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type='button'
      onClick={() => setTheme(theme === Theme.Dark ? Theme.Light : Theme.Dark)}
      className={cn(btn.tertiary, styles.themeToggle, className)}
      aria-label={ariaLabel}>
      {mounted ? (
        theme === Theme.Dark ? (
          <Moon size={16} aria-hidden='true' />
        ) : (
          <Sun size={16} aria-hidden='true' />
        )
      ) : (
        <span className={styles.ssrThemeIcon} aria-hidden='true' />
      )}
    </button>
  );
}

export default ThemeToggleButton;
