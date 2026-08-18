/**
 * @fileoverview Unit tests for the labs dev segment layout guard.
 * @description Verifies the segment renders children only under `NODE_ENV=development`
 * and calls `notFound()` in every other mode, and that dev labs is marked noindex.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/layout.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/layout
 */

import LabsDevLayout, { metadata } from '@/app/[locale]/labs/dev/layout';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const { notFound } = await import('next/navigation');

describe('LabsDevLayout', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(notFound).mockClear();
  });

  it('renders children in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(<LabsDevLayout>{<span>canvas child</span>}</LabsDevLayout>);

    expect(screen.getByText('canvas child')).toBeInTheDocument();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('calls notFound in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(() =>
      render(<LabsDevLayout>{<span>canvas child</span>}</LabsDevLayout>),
    ).toThrow();
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound in test mode', () => {
    vi.stubEnv('NODE_ENV', 'test');

    expect(() =>
      render(<LabsDevLayout>{<span>canvas child</span>}</LabsDevLayout>),
    ).toThrow();
    expect(notFound).toHaveBeenCalled();
  });

  it('marks the segment noindex', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
