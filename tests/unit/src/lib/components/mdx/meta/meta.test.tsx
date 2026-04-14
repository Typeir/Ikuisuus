/**
 * Unit tests for the Meta MDX component.
 *
 * @module meta.test
 */

import Meta from '@/lib/components/mdx/meta/meta';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Meta', () => {
  it('should render nothing', () => {
    const { container } = render(
      <Meta target='generator' type='feature' featureId='slug/feat' />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should accept customHandler prop without errors', () => {
    const { container } = render(
      <Meta
        target='generator'
        type='feature'
        featureId='slug/feat'
        customHandler='instant_death'
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should accept arbitrary additional props', () => {
    const { container } = render(
      <Meta
        target='generator'
        type='feature'
        featureId='slug/feat'
        notes='freeform text'
      />,
    );
    expect(container.innerHTML).toBe('');
  });
});
