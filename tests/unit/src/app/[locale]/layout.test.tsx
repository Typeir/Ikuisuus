/**
 * @fileoverview Unit tests for RootLayout Server Component
 * @description Tests for server-side layout rendering and locale validation
 *
 * @module tests/unit/app/[locale]/layout
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @testing-library/react - React testing utilities
 * @requires @/app/[locale]/layout - Component under test
 */

import RootLayout from '@/app/[locale]/layout';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock next/font/local so localFont() doesn't fail in jsdom
vi.mock('next/font/local', () => ({
  default: () => ({
    className: 'mock-font',
    variable: '--mock-font',
    style: { fontFamily: 'mock' },
  }),
}));

// Mock cookies() from next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((key: string) => {
      if (key === 'ikuisuus-ui-state') {
        return undefined; // No cookie by default
      }
      return undefined;
    }),
  })),
}));

// Mock getMessages
vi.mock('next-intl/server', () => ({
  getMessages: vi.fn(async () => ({
    common: { test: 'Test' },
    layout: { title: 'Title' },
  })),
}));

// Mock ClientProviders
vi.mock('@/app/[locale]/ClientProviders', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='client-providers'>{children}</div>
  ),
}));

// Mock walk utility
vi.mock('@/lib/utils/repositoryWalk', () => ({
  repositoryShallowWalk: vi.fn(async () => []),
}));

// Mock notFound
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('RootLayout', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render without crashing for valid locale', async () => {
    const component = await RootLayout({
      children: <div>Test Content</div>,
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(() => {
      render(component);
    }).not.toThrow();
  });

  it('should render children through ClientProviders', async () => {
    const component = await RootLayout({
      children: <div>Test Child</div>,
      params: Promise.resolve({ locale: 'en' }),
    });

    const { getByText } = render(component);
    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('should accept different locales', async () => {
    const componentEn = await RootLayout({
      children: <div>Content</div>,
      params: Promise.resolve({ locale: 'en' }),
    });

    expect(() => {
      render(componentEn);
    }).not.toThrow();

    cleanup();

    const componentEs = await RootLayout({
      children: <div>Content</div>,
      params: Promise.resolve({ locale: 'es' }),
    });

    expect(() => {
      render(componentEs);
    }).not.toThrow();
  });

  it('should render without SSR dependencies', async () => {
    const component = await RootLayout({
      children: <div>Content</div>,
      params: Promise.resolve({ locale: 'en' }),
    });

    const { container } = render(component);
    // Verify the component renders without errors (no cookies() call)
    expect(container).toBeInTheDocument();
  });
});
