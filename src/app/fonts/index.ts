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
 * the first letter of a heading.
 * @type {ReturnType<import('next/font/local').default>}
 */
export const empyrean = localFont({
  src: [{ path: '../../../public/fonts/EmpyreanInitialem.otf', weight: '400' }],
  variable: '--font-initialem',
  display: 'swap',
  fallback: ['serif'],
  preload: true,
});

/**
 * Stropica local font registration. Emphasis face for `strong` and `b`.
 * @type {ReturnType<import('next/font/local').default>}
 */
export const stropica = localFont({
  src: [{ path: '../../../public/fonts/Stropica.otf', weight: '400' }],
  variable: '--font-emphasis',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  declarations: [{ prop: 'size-adjust', value: '141%' }],
  adjustFontFallback: false,
  preload: true,
});

/**
 * Grand Cru local font registration. Heading face for `h1`–`h6`.
 *
 * @type {ReturnType<import('next/font/local').default>}
 */
export const grandCru = localFont({
  src: [{ path: '../../../public/fonts/GrandCru-LightS.otf', weight: '300' }],
  variable: '--font-headings',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
});

/**
 * Array of registered fonts for convenience imports.
 * @type {Array<ReturnType<import('next/font/local').default>>}
 */
export const fonts = [empyrean, stropica, grandCru];
