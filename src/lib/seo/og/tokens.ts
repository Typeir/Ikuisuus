/**
 * @fileoverview OG image dark-theme color tokens as plain JS constants.
 *
 * @module lib/seo/og/tokens
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Design token map for OG image rendering.
 *
 * Values 1-to-1 with dark-theme CSS custom properties in
 * `src/app/[locale]/globals.scss`.
 *
 * @property {string} bg - Main background colour (`--color-bg`)
 * @property {string} bgSecondary - Secondary background (`--color-bg-secondary`)
 * @property {string} surface - Surface colour (`--color-surface`)
 * @property {string} primary - Primary green (`--color-primary`)
 * @property {string} actionable - Pale teal (`--color-actionable`)
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
  primary: '#7fc7a3',
  actionable: '#b2dfdb',
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
