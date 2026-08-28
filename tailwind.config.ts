/**
 * Root Tailwind configuration for the Library of Ikuisuus project.
 * @fileoverview Tailwind CSS config with project content paths and theme extensions.
 * @module tailwind.config
 * @author Typeir
 * @version 1
 * @since 1
 */
import type { Config } from 'tailwindcss';
import { proseTheme } from './src/styles/prose-theme';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-initialem)', 'ui-serif', 'Georgia'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: proseTheme,
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
