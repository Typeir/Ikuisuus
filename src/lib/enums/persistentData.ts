/**
 * @fileoverview Keys for persistent client-side storage and DOM data attributes.
 * @description Standard identifiers shared by localStorage operations and HTML data attributes.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure enum definition
 * 
 * @example
 * ```typescript
 * import { PersistentData } from '@/lib/enums/persistentData';
 * 
 * localStorage.setItem(PersistentData.Theme, 'dark');
 * document.documentElement.setAttribute(PersistentData.Theme, 'dark');
 * ```
 * @module src/lib/enums/persistentData
 */

export enum PersistentData {
  Theme = 'data-theme',
}
