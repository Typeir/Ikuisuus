/**
 * @fileoverview Lazy Client MDX Fallback Tests
 * @description Tests ClientRendererLazy with a mocked next/dynamic loader.
 * Asserts the loaded renderer receives locale and slug props and loads with
 * ssr disabled.
 *
 * @module tests/unit/src/app/[locale]/utils/clientRendererLazy.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** Hoisted storage for the options the next/dynamic mock captures. */
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
   * Asserts next/dynamic is invoked with ssr set to false.
   */
  it('should load the renderer without server rendering', () => {
    render(<ClientRendererLazy locale='en' slug='x' />);

    expect(captured.options).toMatchObject({ ssr: false });
  });
});
