/**
 * @fileoverview Local font registrations used by the app. Exports
 * optimized `next/font` instances and a list of fonts for convenience.
 * @module app/fonts/index
 * @author Typeir
 * @version 2.1.0
 * @since 1.0.0
 */
import localFont from 'next/font/local';

/**
 * Empyrean Initialem local font registration.
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
 * Array of registered fonts for convenience imports.
 * @type {Array<ReturnType<import('next/font/local').default>>}
 */
export const fonts = [empyrean];
