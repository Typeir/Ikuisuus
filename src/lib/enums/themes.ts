/**
 * @fileoverview Theme enum - supported UI color themes.
 * @description Enum of supported color themes: Dark and Light. Applied to the DOM via the
 * data-theme attribute for CSS custom properties in globals.scss.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure enum definition
 * 
 * @example
 * ```typescript
 * import { Theme } from '@/lib/enums/themes';
 * 
 * const currentTheme: Theme = Theme.Dark;
 * document.documentElement.setAttribute('data-theme', currentTheme);
 * ```
 * @module src/lib/enums/themes
 */

export enum Theme {
  Dark = 'dark',
  Light = 'light',
}

const THEMES: Theme[] = [Theme.Dark, Theme.Light];
