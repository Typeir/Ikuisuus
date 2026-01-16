/**
 * @fileoverview Theme Initialization Script Generator - FOUC prevention for theme system
 * @description Generates an inline JavaScript IIFE that runs before DOM render to apply
 * the user's theme preference from localStorage. Prevents flash of unstyled content (FOUC)
 * by setting data-theme attribute on <html> element synchronously. Returns 'dark' as
 * fallback for invalid or missing theme values.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires @/lib/enums/persistentData
 * @requires @/lib/enums/themes
 * 
 * @example
 * ```tsx
 * // In root layout.tsx
 * import { getThemeInitScript } from '@/lib/utils/themeScript';
 * 
 * <html>
 *   <body>
 *     <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
 *     {children}
 *   </body>
 * </html>
 * ```
 */

import { PersistentData } from '../enums/persistentData';
import { Theme } from '../enums/themes';

export const getThemeInitScript = () => {
  const themeValues = Object.values(Theme)
    .map((t) => `'${t}'`)
    .join(', ');

  return `
    (function() {
      try {
        var theme = localStorage.getItem('${PersistentData.Theme}');
        var allowed = [${themeValues}];
        
        // Apply stored theme or detect system preference
        if (allowed.includes(theme)) {
          document.documentElement.setAttribute('data-theme', theme);
        } else {
          // Default to dark theme - let users change if they prefer light
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch (e) {
        // Fallback to dark theme if any errors (to match CSS :root defaults)
        try {
          document.documentElement.setAttribute('data-theme', 'dark');
        } catch (e2) {
          // If even this fails, at least we tried
        }
      }
    })();
  `;
};
