/**
 * Persistent UI State Initialization Script Generator
 *
 * @fileoverview Generates an inline JavaScript IIFE that runs before DOM render
 * to restore persistent UI state from localStorage. Prevents flash of incorrect
 * state (FOUC) by setting data attributes synchronously on the document element.
 *
 * @module lib/utils/persistentUiScript
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/types/persistentUiState
 *
 * @example
 * ```tsx
 * // In root layout.tsx
 * import { getPersistentUiInitScript } from '@/lib/utils/persistentUiScript';
 *
 * <html>
 *   <body>
 *     <script dangerouslySetInnerHTML={{ __html: getPersistentUiInitScript() }} />
 *     {children}
 *   </body>
 * </html>
 * ```
 */

import {
    LEGACY_THEME_KEY,
    PERSISTENT_UI_STORAGE_KEY,
} from '../types/persistentUiState';

/**
 * Generates inline script for persistent UI state initialization
 *
 * @function getPersistentUiInitScript
 * @returns {string} Inline JavaScript IIFE string
 *
 * @description
 * Creates a self-executing script that:
 * 1. Reads theme from localStorage (unified state or legacy key)
 * 2. Sets data-theme attribute on document element
 *
 * This runs synchronously before React hydration to prevent FOUC.
 * Sidebar expansion is handled client-side by PersistentUiProvider
 * using a deterministic fallback chain (no bootstrap script needed).
 */
export function getPersistentUiInitScript(): string {
  return `
    (function() {
      try {
        // Read from localStorage only (no cookies)
        var stored = null;
        if (typeof localStorage !== 'undefined') {
          stored = localStorage.getItem('${PERSISTENT_UI_STORAGE_KEY}');
        }
        
        var theme = 'dark';
        
        // Try unified state
        if (stored) {
          try {
            var state = JSON.parse(stored);
            if (state.theme && (state.theme === 'dark' || state.theme === 'light')) {
              theme = state.theme;
            }
          } catch (e) {
            // JSON parse failed, continue to legacy
          }
        }
        
        // Fallback to legacy theme key
        if (theme === 'dark' && typeof localStorage !== 'undefined') {
          var legacyTheme = localStorage.getItem('${LEGACY_THEME_KEY}');
          if (legacyTheme === 'dark' || legacyTheme === 'light') {
            theme = legacyTheme;
          }
        }
        
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        // Fallback to dark theme on any error
        try {
          document.documentElement.setAttribute('data-theme', 'dark');
        } catch (e2) {}
      }
    })();
  `;
}

/**
 * Gets the combined initialization script for theme and UI state
 *
 * @function getCombinedInitScript
 * @returns {string} Combined initialization script
 *
 * @description
 * Provides theme initialization script that runs before React hydration.
 * Sidebar expansion is handled client-side by PersistentUiProvider.
 */
export function getCombinedInitScript(): string {
  return getPersistentUiInitScript();
}
