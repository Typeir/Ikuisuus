/**
 * Persistent UI State Initialization Script Generator
 *
 * @fileoverview Generates an inline JavaScript IIFE that runs before DOM render
 * to restore persistent UI state from storage. Reads from cookies first (SSR source
 * of truth), then falls back to sessionStorage and localStorage. Prevents flash of
 * incorrect state (FOUC) by setting data-theme attribute synchronously.
 *
 * CRITICAL: This script MUST be placed in <head> (not <body>) to run before
 * first paint. Combined with the CSS rule `html:not([data-theme]) body { visibility: hidden; }`,
 * this ensures zero FOUC for both dark and light themes.
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
 * Creates a self-executing script that:
 * 1. Reads theme from cookies (source of truth for SSR compatibility)
 * 2. Falls back to sessionStorage, then localStorage
 * 3. Sets data-theme attribute on document element
 *
 * This runs synchronously before React hydration to prevent FOUC.
 * Sidebar expansion is handled client-side by PersistentUiProvider
 * using a deterministic fallback chain (no bootstrap script needed).
 */
export function getPersistentUiInitScript(): string {
  return `
    (function() {
      try {
        var theme = 'dark';
        var stored = null;
        
        // Helper to read cookie by name
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
        
        // Priority: cookies → sessionStorage → localStorage
        stored = readCookie('${PERSISTENT_UI_STORAGE_KEY}');
        if (!stored && typeof sessionStorage !== 'undefined') {
          stored = sessionStorage.getItem('${PERSISTENT_UI_STORAGE_KEY}');
        }
        if (!stored && typeof localStorage !== 'undefined') {
          stored = localStorage.getItem('${PERSISTENT_UI_STORAGE_KEY}');
        }
        
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
        
        // Fallback to legacy theme key (same priority order)
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
