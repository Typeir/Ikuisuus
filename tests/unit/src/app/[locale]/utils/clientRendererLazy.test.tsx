/**
 * @fileoverview Lazy Client MDX Fallback Tests
 * @description Covers the wrapper that keeps the client-side MDX toolchain off
 * the critical path.
 *
 * The point of the wrapper is that the heavy chunk is requested rather than
 * bundled, so the test asserts it loads without server rendering and forwards
 * its props intact.
 *
 * @module tests/unit/src/app/[locale]/utils/clientRendererLazy
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** Hoisted so the mock factory can record what `next/dynamic` was given. */
const captured = vi.hoisted(() => ({ options: null as unknown }));

vi.mock('next/dynamic', async () => {
  const React = await import('react');

  return {
    default: (_loader: unknown, options: unknown) => {
      captured.options = options;
      return ({ locale, slug }: { locale: string; slug: string }) =>
        React.createElement(
          'div',
          { 'data-testid': 'renderer' },
          `${locale}:${slug}`,
        );
    },
  };
});

import ClientRendererLazy from '@/app/[locale]/utils/clientRendererLazy';

describe('ClientRendererLazy', () => {
  it('should forward locale and slug to the loaded renderer', () => {
    render(<ClientRendererLazy locale='en' slug='monsters/mucklord' />);

    expect(screen.getByTestId('renderer')).toHaveTextContent(
      'en:monsters/mucklord',
    );
  });

  /**
   * Server-rendering the fallback would defeat it: the toolchain should reach
   * the browser only when the fallback actually runs.
   */
  it('should load the renderer without server rendering', () => {
    render(<ClientRendererLazy locale='en' slug='x' />);

    expect(captured.options).toMatchObject({ ssr: false });
  });
});
