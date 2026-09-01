/**
 * @fileoverview Unit tests for the Measure component.
 * @description Renders stored measurements through the unit renderer while
 * preserving surrounding prose.
 *
 * @module tests/unit/src/modules/library/presentation/components/Measure/Measure.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { Measure } from '@/modules/library/presentation/components/Measure';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

describe('Measure', () => {
  it('should render the fallback when there is no measurement', () => {
    render(<Measure text={null} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should accept a custom fallback', () => {
    render(<Measure text='' fallback='none' />);

    expect(screen.getByText('none')).toBeInTheDocument();
  });

  /** Renders a stored measure through the unit renderer. */
  it('should draw a measure through the unit renderer', () => {
    const { container } = render(<Measure text='12 stride' />);

    expect(container.querySelector('[data-unit="stride"]')).toBeInTheDocument();
  });

  /** Preserves non-numeric tokens around a measure. */
  it('should keep the prose around a measure', () => {
    const { container } = render(<Measure text='Self (6 stride;ADJ cone)' />);

    expect(container.textContent).toContain('Self (');
    expect(container.textContent).toContain('cone)');
    expect(container.querySelector('[data-unit="stride"]')).toBeInTheDocument();
  });

  it('should draw every measure in a list', () => {
    const { container } = render(
      <Measure text='8 stride, burrow 4 stride, swim 12 stride' />,
    );

    expect(container.querySelectorAll('[data-unit="stride"]')).toHaveLength(3);
  });

  /** Passes a keyword with no measure through unchanged. */
  it('should pass a keyword through untouched', () => {
    const { container } = render(<Measure text='Self' />);

    expect(container.textContent).toBe('Self');
    expect(container.querySelector('[data-unit]')).not.toBeInTheDocument();
  });
});
