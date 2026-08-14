/**
 * @fileoverview Vitest Global Setup
 * @description Mocks logger, next-intl, SVG imports, and filters stderr/console output.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * Mock logger globally to suppress all logging output during tests.
 * Preserves all exports.
 */
vi.mock('@/lib/logging/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logging/logger')>();

  const mockLogger = {
    debug: vi.fn(),
    message: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    child: vi.fn(function (this: unknown) {
      return this;
    }),
    getMinLevel: vi.fn(() => actual.LogLevel.MESSAGE),
    setMinLevel: vi.fn(),
    enableStderrForErrors: vi.fn(),
    disableStderrForErrors: vi.fn(),
  };

  return {
    ...actual,
    logger: mockLogger,
  };
});

/** Mock next-intl navigation module that requires Next.js runtime */
vi.mock('next-intl/navigation', () => ({
  createNavigation: vi.fn(() => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    getPathname: vi.fn(() => '/'),
  })),
}));

/** Mock next-intl middleware module */
vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => (req: unknown) => null),
}));

/** Mock next-intl useTranslations and useLocale hooks while keeping the real provider */
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
    useLocale: () => 'en',
  };
});

import React from 'react';

/**
 * Factory for mock SVG components used in place of real .svg imports.
 *
 * @param testId - data-testid attribute for the mock SVG element
 * @returns React component rendering a stub `<svg>` element
 */
const createMockSvg = (testId: string) => {
  const Component: React.FC<React.SVGProps<SVGSVGElement>> = React.forwardRef(
    ({ className = '', ...props }, ref: React.Ref<SVGSVGElement>) => {
      return React.createElement('svg', {
        ref,
        className,
        'data-testid': testId,
        ...props,
      });
    },
  ) as React.FC<React.SVGProps<SVGSVGElement>>;

  Component.displayName = `MockSvg`;
  return Component;
};

/** Mock SVG icon imports */
vi.mock('@/lib/components/icon/icons/arrow.svg', () => ({
  default: createMockSvg('arrow-icon'),
}));

vi.mock('@/lib/components/icon/icons/hamburger.svg', () => ({
  default: createMockSvg('hamburger-icon'),
}));

vi.mock('@/lib/components/icon/icons/lock.svg', () => ({
  default: createMockSvg('lock-icon'),
}));

vi.mock('@/lib/components/icon/icons/unlock.svg', () => ({
  default: createMockSvg('unlock-icon'),
}));

/**
 * Evaluate simple width-based media queries against window.innerWidth.
 * Supports the `(max-width: Npx)` / `(min-width: Npx)` forms used by the
 * app's viewport hooks; anything else reports no match.
 *
 * @param query - CSS media query string
 * @returns True if the query matches the current mocked viewport width
 */
function evaluateMediaQuery(query: string): boolean {
  const max = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/);
  const min = query.match(/\(min-width:\s*(\d+(?:\.\d+)?)px\)/);
  if (!max && !min) return false;
  let matches = true;
  if (max) matches = matches && window.innerWidth <= parseFloat(max[1]);
  if (min) matches = matches && window.innerWidth >= parseFloat(min[1]);
  return matches;
}

/**
 * jsdom does not ship matchMedia. Width-aware stub that re-evaluates match
 * on window resize events.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => {
    const listeners = new Set<(e: { matches: boolean }) => void>();
    let lastMatches = evaluateMediaQuery(query);

    const handleResize = () => {
      const next = evaluateMediaQuery(query);
      if (next !== lastMatches) {
        lastMatches = next;
        listeners.forEach((cb) => cb({ matches: next }));
      }
    };

    return {
      get matches() {
        return evaluateMediaQuery(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, cb: (e: { matches: boolean }) => void) => {
        if (listeners.size === 0) window.addEventListener('resize', handleResize);
        listeners.add(cb);
      },
      removeEventListener: (_type: string, cb: (e: { matches: boolean }) => void) => {
        listeners.delete(cb);
        if (listeners.size === 0) window.removeEventListener('resize', handleResize);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  },
});

/**
 * jsdom does not ship ResizeObserver. Stub it globally on window.
 */
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

/**
 * Determine if a stderr chunk is a known deprecation warning to suppress.
 *
 * @param chunk - stderr output string
 * @returns True if the chunk matches a suppressed pattern
 */
function isSuppressedStderrChunk(chunk: string): boolean {
  return (
    chunk.includes('legacy-js-api') ||
    chunk.includes('CJS build of Vite') ||
    chunk.includes('vite-cjs-node-api-deprecated')
  );
}

/**
 * Determine if a console.error message is a known React hydration warning.
 *
 * @param message - First argument to console.error
 * @returns True if the message matches a suppressed pattern
 */
function isSuppressedConsoleError(message: unknown): boolean {
  if (typeof message !== 'string') return false;
  return (
    message.includes('cannot be a child of') ||
    message.includes('hydration error') ||
    message.includes('Hydration failed')
  );
}

const originalStderrWrite = process.stderr.write;
const originalConsoleError = console.error;

/** Filter noisy deprecation warnings from stderr during test runs */
process.stderr.write = function (
  this: typeof process.stderr,
  chunk: string | Uint8Array,
  encoding?: BufferEncoding | ((err?: Error | null) => void),
  cb?: (err?: Error | null) => void,
) {
  if (typeof chunk === 'string' && isSuppressedStderrChunk(chunk)) {
    return true;
  }
  return originalStderrWrite.call(this, chunk, encoding as never, cb);
} as typeof process.stderr.write;

/** Filter React hydration warnings expected when testing layout components */
console.error = function (...args: unknown[]) {
  if (isSuppressedConsoleError(args[0])) {
    return;
  }
  return originalConsoleError.apply(console, args);
};
