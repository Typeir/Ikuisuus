/**
 * @fileoverview OG image design tokens.
 *
 * Mirrors the dark-theme CSS custom properties from `globals.scss` as plain
 * JavaScript constants. This file is the single source of truth for colors
 * used in satori-rendered OG images — satori does not run in a browser
 * context and cannot read CSS variables.
 *
 * @module lib/seo/og/tokens
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Design token map for OG image rendering.
 *
 * All values correspond 1-to-1 with dark-theme CSS custom properties
 * in `src/app/[locale]/globals.scss`.
 *
 * @property {string} bg - Main background colour (`--color-bg`)
 * @property {string} bgSecondary - Secondary background (`--color-bg-secondary`)
 * @property {string} surface - Surface colour (`--color-surface`)
 * @property {string} emphasis - Verdant teal accent (`--color-emphasis`)
 * @property {string} accent - Green accent (`--color-accent`)
 * @property {string} text - Primary text colour (`--color-text`)
 * @property {string} textMuted - Muted text colour (`--color-text-secondary`)
 * @property {string} border - Border colour (`--color-border`)
 */
export const OG_TOKENS = {
  bg: '#111217',
  bgSecondary: '#28303b',
  surface: '#1b1d23',
  emphasis: '#8acfd4',
  accent: '#8fd3a1',
  text: '#c8ccc7',
  textMuted: '#a1a1aa',
  border: '#2a2c35',
} as const;

/** Canvas width in pixels. */
export const OG_WIDTH = 1200;

/** Canvas height in pixels. */
export const OG_HEIGHT = 630;
