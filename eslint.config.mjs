/**
 * ESLint Flat Configuration
 *
 * @fileoverview Flat-config replacement for the removed `next lint` command.
 * Next 16 ships `@next/eslint-plugin-next` as flat config only, and ESLint 10
 * dropped `.eslintrc` support, so the previous `next/core-web-vitals` extends
 * is consumed here as a config array instead.
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
 *
 * eslint-plugin-react's auto-detection calls `context.getFilename()`, removed
 * in ESLint 10, so every rule that consults the React version throws. Passing
 * an explicit version skips detection entirely.
 */
const { version: reactVersion } = require('react/package.json');

/**
 * Paths excluded from linting.
 *
 * Mirrors the implicit exclusions `next lint` applied: build output, vendored
 * dependencies, generated artifacts and coverage reports.
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
 *
 * eslint-config-next 15 pulled eslint-plugin-react-hooks 5, which shipped only
 * `rules-of-hooks` and `exhaustive-deps`. Version 7 turns the React Compiler
 * diagnostics on as errors, and the existing tree trips three of them
 * (34 set-state-in-effect, 6 refs, 1 purity, 1 static-components). They are reported as warnings so
 * the lint gate keeps its pre-upgrade result while the findings stay visible;
 * every other new rule is left at its recommended severity.
 */
const reactCompilerBacklog = {
  'react-hooks/purity': 'warn',
  'react-hooks/refs': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/static-components': 'warn',
};

/**
 * Files allowed to call `fetch` directly.
 *
 * The fetcher is built on it, the content adapters need `cache` and `next`
 * options the fetcher does not expose, OG rendering fetches binary rather than
 * JSON, and the corrections read route calls the GitHub contents API directly
 * because it needs the `sha` the raw host does not return.
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
 *
 * Every call site otherwise repeats the same `res.ok` check and its own error
 * shape, and the ones that skip it swallow the status. `fetcher` throws a typed
 * `FetchError`.
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
];
