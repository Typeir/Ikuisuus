/**
 * @fileoverview Local font registrations used by the app. Exports
 * optimized `next/font` instances and a list of fonts for convenience.
 * @module app/fonts/index
 * @author Typeir
 * @version 2.2.0
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
  variable: '--font-empyrean',
  display: 'swap',
  fallback: ['serif'],
  preload: true,
});

/**
 * Stropica local font registration. Heading face for `h1`–`h6`.
 *
 * `size-adjust: 141%` is the cap-height ratio between the previous heading
 * face (`system-ui`/Segoe UI, 0.70em) and Stropica (0.497em), so authored
 * `font-size` values render at their pre-swap optical size. `adjustFontFallback`
 * is off because Next derives fallback metrics from the unadjusted face.
 *
 * The DEMO cut has no punctuation glyphs; those resolve against `fallback`.
 * @type {ReturnType<import('next/font/local').default>}
 */
export const stropica = localFont({
  src: [{ path: '../../../public/fonts/Stropica.otf', weight: '400' }],
  variable: '--font-stropica',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  declarations: [{ prop: 'size-adjust', value: '141%' }],
  adjustFontFallback: false,
  preload: true,
});

/**
 * Grand Cru local font registration. Emphasis face for `strong` and `b`.
 *
 * Registered at its true weight of 300; no bold cut ships, so the browser
 * synthesizes the 700 those elements carry. Cap height already matches the
 * previous face, so no `size-adjust`.
 * @type {ReturnType<import('next/font/local').default>}
 */
export const grandCru = localFont({
  src: [{ path: '../../../public/fonts/GrandCru-LightS.otf', weight: '300' }],
  variable: '--font-grand-cru',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
});

/**
 * Array of registered fonts for convenience imports.
 * @type {Array<ReturnType<import('next/font/local').default>>}
 */
export const fonts = [empyrean, stropica, grandCru];
