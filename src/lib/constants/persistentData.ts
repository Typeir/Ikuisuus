/**
 * @fileoverview Keys for persistent client-side storage and DOM data attributes.
 * @description Standard identifiers shared by localStorage operations and HTML data attributes.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { PersistentData } from '@/lib/constants/persistentData';
 *
 * localStorage.setItem(PersistentData.Theme, 'dark');
 * document.documentElement.setAttribute(PersistentData.Theme, 'dark');
 * ```
 * @module lib/constants/persistentData
 */

export enum PersistentData {
  Theme = 'data-theme',
}
