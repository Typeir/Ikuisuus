import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Note: React.act polyfill is not needed if jsdom is properly configured
// The jsdom environment should provide React.act automatically when React is imported
// If React.act is missing, it's typically a test environment configuration issue

// Mock logger globally to suppress all logging output during tests
// Preserve all exports for logger's own tests
vi.mock('@/lib/logging/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/logging/logger')>();
  
  // Create a mock logger that mimics the Logger class interface but suppresses output
  const mockLogger = {
    debug: vi.fn(),
    message: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    child: vi.fn(function(this: any) { return this; }),
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

// Mock next-intl modules that require Next.js runtime
vi.mock('next-intl/navigation', () => ({
  createNavigation: vi.fn(() => ({
    Link: vi.fn(),
    redirect: vi.fn(),
    usePathname: vi.fn(() => '/'),
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
    getPathname: vi.fn(() => '/'),
  })),
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => (req: any) => null),
}));

// Mock next-intl useTranslations hook while keeping real provider
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

// Create mock SVG components
import React from 'react';
const createMockSvg = (testId: string) => {
  const Component: React.FC<React.SVGProps<SVGSVGElement>> = React.forwardRef(
    ({ className = '', ...props }, ref: any) => {
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

// Mock SVG imports to prevent jsdom XML parsing errors
// jsdom's XML parser fails on file paths with forward slashes
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

// Suppress deprecation and hydration warnings during tests only
const originalStderrWrite = process.stderr.write;
const originalConsoleError = console.error;

process.stderr.write = function (
  this: typeof process.stderr,
  chunk: string | Uint8Array,
  encoding?: BufferEncoding | ((err?: Error | null) => void),
  cb?: (err?: Error | null) => void,
) {
  if (typeof chunk === 'string') {
    // Suppress Dart Sass legacy-js-api deprecation
    if (chunk.includes('legacy-js-api')) {
      return true;
    }
    // Suppress Vite CJS deprecation (vitest internal dependency issue)
    if (chunk.includes('CJS build of Vite') || chunk.includes('vite-cjs-node-api-deprecated')) {
      return true;
    }
  }
  return originalStderrWrite.call(this, chunk, encoding as any, cb);
} as typeof process.stderr.write;

// Suppress React hydration warnings in tests (expected when testing layout components)
console.error = function (...args: any[]) {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('cannot be a child of') ||
     message.includes('hydration error') ||
     message.includes('Hydration failed'))
  ) {
    return; // suppress
  }
  return originalConsoleError.apply(console, args);
};
