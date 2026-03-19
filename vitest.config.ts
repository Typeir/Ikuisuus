//@ts-ignore-file
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

//@ts-ignore
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  logLevel: 'warn',
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  future: {
    removeSsrLoadModule: 'warn',
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
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
    ],
    server: {
      deps: {
        inline: ['next-intl'],
      },
    },
    // Cast to `any` because CoverageV8Options in this Vitest version
    // doesn't include some top-level fields we use (e.g. `all`, thresholds).
    coverage: ({
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.config.{ts,js}',
        'src/**/index.{ts,tsx}',
      ],
      all: true,
      //@ts-ignore
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    } as any),
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
