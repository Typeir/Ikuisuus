/**
 * Persistent UI State Initialization Script Generator
 *
 * @fileoverview Returns an inline JavaScript IIFE that restores persistent UI
 * state. Reads cookies first, then sessionStorage, then localStorage. Sets
 * data-theme attribute synchronously. Must be placed in <head> to run before
 * first paint; pairs with `html:not([data-theme]) body { visibility: hidden; }`.
 *
 * @module lib/utils/persistentUiScript
 * @version 1.2.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/types/persistentUiState
 *
 * @example
 * ```tsx
 * // In root layout.tsx - MUST be in <head>
 * import { getPersistentUiInitScript } from '@/lib/utils/persistentUiScript';
 *
 * <html>
 *   <head>
 *     <script dangerouslySetInnerHTML={{ __html: getPersistentUiInitScript() }} />
 *   </head>
 *   <body>
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
 * Returns an IIFE that reads theme from cookies, then sessionStorage, then
 * localStorage, and sets data-theme, data-aspect-display,
 * data-aspect-expanded, data-stream-text and data-section-decor on the
 * document element. aspectDisplay defaults to `compact`; both decorator flags
 * default to drawn. Runs synchronously before React hydration, so a reader who
 * turned a decorator off never sees it paint.
 */
export function getPersistentUiInitScript(): string {
  return `
    (function() {
      try {
        var theme = 'dark';
        var stored = null;
        
        function readCookie(name) {
          if (typeof document === 'undefined' || !document.cookie) return null;
          var encoded = encodeURIComponent(name);
          var cookies = document.cookie.split('; ');
          for (var i = 0; i < cookies.length; i++) {
            var parts = cookies[i].split('=');
            if (parts[0] === encoded) {
              try {
                return decodeURIComponent(parts[1] || '');
              } catch (e) {
                return parts[1] || '';
              }
            }
          }
          return null;
        }
        
        stored = readCookie('${PERSISTENT_UI_STORAGE_KEY}');
        if (!stored && typeof sessionStorage !== 'undefined') {
          stored = sessionStorage.getItem('${PERSISTENT_UI_STORAGE_KEY}');
        }
        if (!stored && typeof localStorage !== 'undefined') {
          stored = localStorage.getItem('${PERSISTENT_UI_STORAGE_KEY}');
        }
        
        var aspectDisplay = 'compact';
        var aspectExpanded = false;
        var streamText = true;
        var sectionDecor = true;

        if (stored) {
          try {
            var state = JSON.parse(stored);
            if (state.theme && (state.theme === 'dark' || state.theme === 'light')) {
              theme = state.theme;
            }
            if (state.aspectDisplay === 'compact' || state.aspectDisplay === 'verbose' || state.aspectDisplay === 'glyph') {
              aspectDisplay = state.aspectDisplay;
            }
            if (typeof state.aspectExpanded === 'boolean') {
              aspectExpanded = state.aspectExpanded;
            }
            if (typeof state.streamText === 'boolean') {
              streamText = state.streamText;
            }
            if (typeof state.sectionDecor === 'boolean') {
              sectionDecor = state.sectionDecor;
            }
          } catch (e) {
          }
        }

        document.documentElement.setAttribute('data-aspect-display', aspectDisplay);
        document.documentElement.setAttribute('data-aspect-expanded', aspectExpanded ? 'true' : 'false');
        document.documentElement.setAttribute('data-stream-text', streamText ? 'true' : 'false');
        document.documentElement.setAttribute('data-section-decor', sectionDecor ? 'true' : 'false');

        if (theme === 'dark') {
          var legacyTheme = readCookie('${LEGACY_THEME_KEY}');
          if (!legacyTheme && typeof sessionStorage !== 'undefined') {
            legacyTheme = sessionStorage.getItem('${LEGACY_THEME_KEY}');
          }
          if (!legacyTheme && typeof localStorage !== 'undefined') {
            legacyTheme = localStorage.getItem('${LEGACY_THEME_KEY}');
          }
          if (legacyTheme === 'dark' || legacyTheme === 'light') {
            theme = legacyTheme;
          }
        }
        
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
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
 * Returns the persistent UI initialization script for theme and UI state.
 */
export function getCombinedInitScript(): string {
  return getPersistentUiInitScript();
}
