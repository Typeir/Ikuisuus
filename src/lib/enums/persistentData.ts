/**
 * @fileoverview Persistent Data Keys Enum - localStorage and data attribute identifiers
 * @description Defines standardized keys for persistent client-side data storage and DOM
 * attributes. Ensures consistency between localStorage operations and HTML data attributes.
 * Used by theme system for persistence across page loads and browser sessions.
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
