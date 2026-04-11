/**
 * @fileoverview Vitest Configuration
 * @description Root vitest config with inline projects for modularized test execution.
 * Each project runs in its own worker pool to prevent OOM crashes with 374+ test files.
 * Use `--project <name>` to run a single module, or `vitest run` for all projects.
 */

/** @ts-expect-error — react-oxc plugin types are incomplete */
import react from '@vitejs/plugin-react-oxc';
import path from 'path';
import { defineConfig } from 'vitest/config';

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
    maxWorkers: 1,
    execArgv: ['--max-old-space-size=8192'],
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
          name: 'unit:utils',
          include: ['tests/unit/src/lib/utils/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:db',
          include: ['tests/unit/src/lib/db/**/*.test.{ts,tsx}'],
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
          name: 'unit:app',
          include: ['tests/unit/src/app/[locale]/**/*.test.{ts,tsx}'],
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
            'tests/unit/src/lib/md/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/mdx/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/services/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/security/**/*.test.{ts,tsx}',
            'tests/unit/src/lib/logging/**/*.test.{ts,tsx}',
            'tests/unit/src/i18n/**/*.test.{ts,tsx}',
            'tests/unit/src/styles/**/*.test.{ts,tsx}',
            'tests/unit/src/middleware*.test.{ts,tsx}',
            'tests/unit/scripts/**/*.test.{ts,tsx}',
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
    },
  },
});
