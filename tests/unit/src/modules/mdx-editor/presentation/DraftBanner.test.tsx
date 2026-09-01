/**
 * DraftBanner Component Unit Tests
 *
 * @fileoverview Tests for the draft indicator banner. Verifies
 * rendering of the DRAFT badge, timestamp metadata, and ARIA attributes.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/DraftBanner.test
 */

import { DraftBanner } from '@/modules/mdx-editor/presentation/DraftBanner/DraftBanner';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DraftBanner', () => {
  const defaultProps = {
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-03-12T06:30:00.000Z',
  };

  it('should render the Draft badge', () => {
    render(<DraftBanner {...defaultProps} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should display Created and Updated labels', () => {
    render(<DraftBanner {...defaultProps} />);

    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText('Updated:')).toBeInTheDocument();
  });

  it('should have an accessible status role', () => {
    render(<DraftBanner {...defaultProps} />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-label', 'Draft content');
  });

  it('should render formatted date strings', () => {
    render(<DraftBanner {...defaultProps} />);

    const banner = screen.getByRole('status');
    expect(banner.textContent).toContain('2026');
  });

  it('should handle invalid date strings gracefully', () => {
    render(<DraftBanner createdAt='not-a-date' updatedAt='also-not-a-date' />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
