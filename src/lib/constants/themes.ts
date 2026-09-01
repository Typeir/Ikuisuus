/**
 * @fileoverview Theme enum - supported UI color themes.
 * @description Enum of supported color themes: Dark and Light. Applied to the DOM via the
 * data-theme attribute for CSS custom properties in globals.scss.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { Theme } from '@/lib/constants/themes';
 *
 * const currentTheme: Theme = Theme.Dark;
 * document.documentElement.setAttribute('data-theme', currentTheme);
 * ```
 * @module lib/constants/themes
 */

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}
