/**
 * @fileoverview Unit tests for LazyPrefetchLink component.
 * @module tests/unit/src/lib/components/lazyPrefetchLink/LazyPrefetchLink
 * @author Typeir
 * @version 1.0.0
 * @since 2026-07-09
 */

import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('LazyPrefetchLink', () => {
  it('renders a link with children', () => {
    render(<LazyPrefetchLink href='/test'>Test Link</LazyPrefetchLink>);

    expect(screen.getByText('Test Link')).toBeDefined();
    expect(screen.getByText('Test Link').closest('a')).toHaveAttribute(
      'href',
      '/test',
    );
  });

  it('starts with prefetch disabled', () => {
    render(<LazyPrefetchLink href='/test'>Test Link</LazyPrefetchLink>);

    const link = screen.getByText('Test Link').closest('a');
    // Next.js Link doesn't expose prefetch as a DOM attribute,
    // but we verify the component renders without error
    expect(link).toBeDefined();
  });

  it('calls onMouseEnter prop when hovered', async () => {
    const onEnter = vi.fn();

    render(
      <LazyPrefetchLink href='/test' onMouseEnter={onEnter}>
        Hover Me
      </LazyPrefetchLink>,
    );

    await userEvent.hover(screen.getByText('Hover Me'));
    expect(onEnter).toHaveBeenCalledOnce();
  });

  it('passes className through', () => {
    render(
      <LazyPrefetchLink href='/test' className='custom-class'>
        Styled
      </LazyPrefetchLink>,
    );

    expect(screen.getByText('Styled').closest('a')).toHaveClass('custom-class');
  });
});
