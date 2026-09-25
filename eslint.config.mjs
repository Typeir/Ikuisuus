/**
 * ESLint Flat Configuration
 *
 * @fileoverview Flat-config replacement for the removed `next lint` command.
 *
 * @module eslint.config
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-29
 */

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Installed React version, resolved the same way `settings.react.version:
 * 'detect'` would resolve it.
 */
const { version: reactVersion } = require('react/package.json');

/**
 * Paths excluded from linting.
 */
const ignores = [
  '.next/**',
  '.paw/**',
  '.vercel/**',
  'coverage/**',
  'dist/**',
  'node_modules/**',
  'public/**',
  '.ignore/**',
];

/**
 * React Compiler rules introduced by eslint-plugin-react-hooks 7.
 */
const reactCompilerBacklog = {
  'react-hooks/purity': 'warn',
  'react-hooks/refs': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/static-components': 'warn',
};

/**
 * Files allowed to call `fetch` directly.
 */
const rawFetchAllowed = [
  'src/lib/fetch/**',
  'src/lib/db/content/adapters/**',
  'src/lib/seo/og/**',
  'src/modules/mdx-editor/infrastructure/github/**',
  'src/app/api/corrections/read/route.ts',
];

/**
 * Bans bare `fetch` outside the files above.
 */
const noRawFetch = {
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.type='Identifier'][callee.name='fetch']",
      message: 'Use fetcher() from @/lib/fetch/fetcher rather than bare fetch.',
    },
  ],
};

/**
 * Files allowed to import `sharp` directly.
 */
const rawSharpAllowed = ['src/lib/raster/**'];

/**
 * Bans bare `sharp` outside the files above.
 */
const noRawSharp = {
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'sharp',
          message: 'Import from @/lib/raster rather than sharp.',
        },
      ],
    },
  ],
};

export default [
  { ignores },
  ...nextCoreWebVitals,
  {
    settings: { react: { version: reactVersion } },
    rules: reactCompilerBacklog,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: rawFetchAllowed,
    rules: noRawFetch,
  },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts', 'foundry/**/*.ts'],
    ignores: rawSharpAllowed,
    rules: noRawSharp,
  },
];
