/**
 * Unit tests for the Meta MDX component.
 *
 * @module tests/unit/src/modules/library/presentation/components/Meta/meta.test
 */

import Meta from '@/modules/library/presentation/components/Meta';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Meta', () => {
  it('should render a hidden span with data attributes', () => {
    const { container } = render(
      <Meta target='generator' type='feature' featureId='slug/feat' />,
    );
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.hidden).toBe(true);
    expect(span?.getAttribute('aria-hidden')).toBe('true');
    expect(span?.getAttribute('data-meta-feature-id')).toBe('slug/feat');
  });

  it('should include customHandler as data attribute', () => {
    const { container } = render(
      <Meta
        target='generator'
        type='feature'
        featureId='slug/feat'
        customHandler='instant_death'
      />,
    );
    const span = container.querySelector('span');
    expect(span?.getAttribute('data-meta-handler')).toBe('instant_death');
  });

  it('should pass arbitrary additional props as data attributes', () => {
    const { container } = render(
      <Meta
        target='generator'
        type='feature'
        featureId='slug/feat'
        notes='freeform text'
      />,
    );
    const span = container.querySelector('span');
    expect(span?.getAttribute('data-meta-notes')).toBe('freeform text');
  });
});
