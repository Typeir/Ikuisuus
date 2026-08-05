/**
 * @fileoverview Vitest Configuration
 * @description Root vitest config with inline projects for modularized test execution.
 * Each project runs in its own worker pool to prevent OOM crashes with 374+ test files.
 * Use `--project <name>` to run a single module, or `vitest run` for all projects.
 *
 * @module vitestConfig
 * @author Typeir
 * @version 1.1.0
 * @since 1.0.0
 */

/** @ts-expect-error — react-oxc plugin types are incomplete */
import react from '@vitejs/plugin-react-oxc';
import os from 'os';
import path from 'path';
import { defineConfig } from 'vitest/config';

const CI_MAX_WORKERS = 2;
const LOCAL_MIN_WORKERS = 2;
const LOCAL_MAX_WORKERS = 4;
const LOCAL_CPU_DIVISOR = 4;
const DEFAULT_MAX_OLD_SPACE_MB = 4096;

const detectedCpuCount = os.cpus().length;
const localWorkerCount = Math.min(
  LOCAL_MAX_WORKERS,
  Math.max(LOCAL_MIN_WORKERS, Math.floor(detectedCpuCount / LOCAL_CPU_DIVISOR)),
);
const defaultMaxWorkers = process.env.CI ? CI_MAX_WORKERS : localWorkerCount;

const parsedMaxWorkers = Number.parseInt(
  process.env.TEST_MAX_WORKERS ?? '',
  10,
);
const maxWorkers = Number.isNaN(parsedMaxWorkers)
  ? defaultMaxWorkers
  : Math.max(1, parsedMaxWorkers);

const parsedMaxOldSpaceMb = Number.parseInt(
  process.env.TEST_MAX_OLD_SPACE_MB ?? '',
  10,
);
const maxOldSpaceMb = Number.isNaN(parsedMaxOldSpaceMb)
  ? DEFAULT_MAX_OLD_SPACE_MB
  : Math.max(1024, parsedMaxOldSpaceMb);

/** Shared test settings inherited by all projects via `extends: true` */
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glsl'],
  clearScreen: false,
  logLevel: 'warn',
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: true,
      },
    },
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    pool: 'forks',
    maxWorkers,
    minWorkers: 1,
    maxForks: maxWorkers,
    minForks: 1,
    execArgv: [`--max-old-space-size=${maxOldSpaceMb}`],
    server: {
      deps: {
        inline: ['next-intl'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.config.{ts,js}',
        'src/**/index.{ts,tsx}',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    } as any,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit:components',
          include: ['tests/unit/src/lib/components/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:utils:a',
          include: ['tests/unit/src/lib/utils/[a-m]*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:utils:b',
          include: ['tests/unit/src/lib/utils/[n-z]*.test.{ts,tsx}'],
          exclude: ['tests/unit/src/lib/utils/repositoryWalk.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:utils:node',
          include: ['tests/unit/src/lib/utils/repositoryWalk.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:db:auth',
          include: [
            'tests/unit/src/lib/db/auth/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/adapters/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/postgres/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:db:orm',
          include: ['tests/unit/src/lib/db/orm/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:db:content:fs',
          include: [
            'tests/unit/src/lib/db/content/adapters/fs/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/content/adapters/github/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/content/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/content/schemas/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:db:content:pg',
          include: [
            'tests/unit/src/lib/db/content/adapters/pg/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/db/content/repositories/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:hooks',
          include: ['tests/unit/src/lib/hooks/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:debug',
          include: ['tests/unit/src/lib/debug/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:metadata',
          include: ['tests/unit/src/lib/metadata/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:api',
          include: ['tests/unit/src/app/api/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:app:pages',
          include: [
            'tests/unit/src/app/[locale]/ClientProviders.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/layout.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/page.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/not-found.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/library/**/*.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/embed/**/*.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/search/**/*.test.{ts,tsx}',
            'tests/unit/src/app/[locale]/[...rest]/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:app:utils',
          include: ['tests/unit/src/app/[locale]/utils/**/*.test.{ts,tsx}'],
        },
      },
      /* One project per feature module rather than one for all of them.
         `unit:modules` was 385 files against a 20-to-60 file median, so it was
         always the last runner still going, holding a fork open while competing
         for CPU with whatever started beside it — which is what made its heavier
         suites time out under load and pass in isolation. */
      {
        extends: true,
        test: {
          name: 'unit:modules:character-builder',
          include: [
            'tests/unit/src/modules/character-builder/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:modules:encounter-planner',
          include: [
            'tests/unit/src/modules/encounter-planner/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:modules:world-sim',
          include: ['tests/unit/src/modules/world-sim/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:modules:library',
          include: ['tests/unit/src/modules/library/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:modules:mdx-editor',
          include: ['tests/unit/src/modules/mdx-editor/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:modules:rest',
          include: [
            'tests/unit/src/modules/search/**/*.test.{ts,tsx}',
            'tests/unit/src/modules/navigation-sidebar/**/*.test.{ts,tsx}',
            'tests/unit/src/modules/metadata-tables/**/*.test.{ts,tsx}',
            'tests/unit/src/modules/tools-menu/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:md',
          include: [
            'tests/unit/src/lib/md/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/mdx/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/content/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/units/**/*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:scripts',
          include: ['tests/unit/scripts/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:other',
          include: [
            'tests/unit/src/lib/types/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/enums/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/context/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/services/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/security/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/logging/**/*.test.{ts,tsx}',
            'tests/unit/src/i18n/**/*.test.{ts,tsx}',
            'tests/unit/src/styles/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/seo/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/embed/**/*.test.{ts,tsx}',
            'tests/unit/src/middleware*.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@scripts': path.resolve(__dirname, './scripts'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
