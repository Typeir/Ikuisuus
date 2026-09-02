/**
 * @fileoverview Local font registrations used by the app. Exports
 * optimized `next/font` instances and a list of fonts for convenience.
 * @module app/fonts/index
 * @author Typeir
 * @version 2.3.0
 * @since 1.0.0
 */
import localFont from 'next/font/local';

/**
 * Empyrean Initialem local font registration. Drop-cap face, applied only to
 * the first letter of a heading. Glyph ink rises to 1.48em above the baseline
 * but the face declares hhea ascent 0.8em, so platforms that honor hhea
 * (Android, macOS) size the inline background box short and
 * `background-clip: text` decapitates the glyph. The overrides pin every
 * platform to the winAscent/winDescent (1.48em/0em) rendering.
 * @type {ReturnType<import('next/font/local').default>}
 */
export const empyrean = localFont({
  src: [{ path: '../../../public/fonts/EmpyreanInitialem.otf', weight: '400' }],
  variable: '--font-initialem',
  display: 'swap',
  fallback: ['serif'],
  declarations: [
    { prop: 'ascent-override', value: '148%' },
    { prop: 'descent-override', value: '0%' },
    { prop: 'line-gap-override', value: '0%' },
  ],
  preload: true,
});

/**
 * Stropica local font registration, parked. Nothing references
 * `--font-stropica`, and a live `localFont()` call emits the file into the
 * build regardless. The file lives in `.ignore/fonts/`; move it back to
 * `public/fonts/`, uncomment, and add it to `fonts` to restore.
 */
/**
export const stropica = localFont({
  src: [{ path: '../../../public/fonts/Stropica.otf', weight: '400' }],
  variable: '--font-stropica',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  declarations: [{ prop: 'size-adjust', value: '141%' }],
  adjustFontFallback: false,
  preload: true,
});
*/

/**
 * Junicode 2 local font registration (variable Roman, SIL OFL). Exposed as
 * `--font-junicode`; the heading role in `_tokens.scss` resolves to it.
 * @type {ReturnType<import('next/font/local').default>}
 */
export const junicode = localFont({
  src: [
    {
      path: '../../../public/fonts/JunicodeVF-Roman.woff2',
      weight: '300 700',
      style: 'normal',
    },
  ],
  variable: '--font-junicode',
  display: 'swap',
  fallback: ['Times New Roman', 'Times', 'serif'],
  preload: true,
});

/**
 * Array of registered fonts for convenience imports.
 * @type {Array<ReturnType<import('next/font/local').default>>}
 */
export const fonts = [empyrean, junicode];
