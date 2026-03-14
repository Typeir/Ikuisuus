/**
 * Tailwind Typography Prose Theme Configuration
 * 
 * Maps Tailwind prose CSS variables to our dynamic theme color variables.
 * This allows prose content to automatically adapt to dark/light themes
 * without requiring !important declarations or SCSS overrides.
 * 
 * @see https://tailwindcss.com/docs/typography-plugin
 * @see src/app/[locale]/globals.scss for theme color definitions
 */

import type { CSSRuleObject } from 'tailwindcss/types/config';

/**
 * Theme color mappings for Tailwind prose plugin
 * All values reference CSS custom properties defined in globals.scss
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
 * Custom prose layout and element-specific styles.
 * maxWidth increased for readability.
 * Blockquote overrides prevent color cascade to children (strong, headings).
 */
const proseCustomStyles: CSSRuleObject = {
  maxWidth: '125ch',
  
  'blockquote strong': {
    color: 'var(--color-emphasis)',
  },
  'blockquote b': {
    color: 'var(--color-emphasis)',
  },
  'blockquote h1, blockquote h2, blockquote h3, blockquote h4, blockquote h5, blockquote h6': {
    color: 'var(--color-accent)',
  },
};

/**
 * Complete Tailwind prose theme configuration
 * Exported for use in tailwind.config.ts
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
      /** prose-invert variant uses same theme mappings for light/dark consistency */
      ...proseColorVariables,
    },
  },
} as const;
