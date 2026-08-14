/**
 * Maps Tailwind prose CSS variables to theme color variables.
 *
 * @see https://tailwindcss.com/docs/typography-plugin
 * @see src/app/[locale]/globals.scss for theme color definitions
 * @fileoverview Module for src/styles/prose-theme.ts
 * @module src/styles/prose-theme
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { CSSRuleObject } from 'tailwindcss/types/config';

/**
 * Prose color mappings. Values reference CSS custom properties in globals.scss.
 */
const proseColorVariables = {
  '--tw-prose-body': 'var(--color-text)',
  '--tw-prose-headings': 'var(--color-text)',
  '--tw-prose-lead': 'var(--color-text)',
  '--tw-prose-links': 'var(--color-accent)',
  '--tw-prose-bold': 'var(--color-emphasis)',
  '--tw-prose-counters': 'var(--color-text)',
  '--tw-prose-bullets': 'var(--color-text)',
  '--tw-prose-hr': 'var(--color-surface)',
  '--tw-prose-quotes': 'var(--color-text)',
  '--tw-prose-quote-borders': 'var(--color-accent)',
  '--tw-prose-captions': 'var(--color-secondary)',
  '--tw-prose-code': 'var(--color-accent)',
  '--tw-prose-pre-code': 'var(--color-text)',
  '--tw-prose-pre-bg': 'var(--color-surface)',
  '--tw-prose-th-borders': 'var(--color-accent)',
  '--tw-prose-td-borders': 'var(--color-surface)',
} as const;

/**
 * Custom prose layout and element-specific styles. maxWidth set to 150ch.
 * Blockquote overrides set explicit colors for strong, b, and headings.
 */
const proseCustomStyles: CSSRuleObject = {
  maxWidth: '150ch',

  'blockquote strong': {
    color: 'var(--color-emphasis)',
  },
  'blockquote b': {
    color: 'var(--color-emphasis)',
  },
  'blockquote h1, blockquote h2, blockquote h3, blockquote h4, blockquote h5, blockquote h6':
    {
      color: 'var(--color-accent)',
    },
};

/**
 * Complete Tailwind prose theme configuration. Exported for tailwind.config.ts.
 */
export const proseTheme = {
  DEFAULT: {
    css: {
      ...proseColorVariables,
      ...proseCustomStyles,
    },
  },
  invert: {
    css: {
      /** prose-invert variant uses same theme color mappings. */
      ...proseColorVariables,
    },
  },
} as const;
