/**
 * @fileoverview Generates a theme initialization script.
 * @description Returns an inline IIFE string that reads Theme from localStorage and sets the
 * data-theme attribute on <html> to the stored value if it is in Theme; otherwise sets it
 * to 'dark'. Falls back to 'dark' on localStorage access errors.
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
 * @module src/lib/utils/themeScript
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
