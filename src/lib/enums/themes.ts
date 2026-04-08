/**
 * @fileoverview Theme Enum - Available UI theme definitions
 * @description Defines the supported color themes for the application. Currently includes
 * Dark and Light themes. Used by ThemeSelector component, themeScript for initialization,
 * and CSS custom properties in globals.scss via data-theme attribute.
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
