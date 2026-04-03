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
        
        if (allowed.includes(theme)) {
          document.documentElement.setAttribute('data-theme', theme);
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch (e) {
        try {
          document.documentElement.setAttribute('data-theme', 'dark');
        } catch (e2) {
        }
      }
    })();
  `;
};
