/**
 * StaticFlashlight Tests
 *
 * @fileoverview Covers the corner-anchored aperture and the coverage geometry.
 */

import StaticFlashlight, {
  cornerRadiusForCoverage,
} from '@/lib/components/flashlight/StaticFlashlight';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('cornerRadiusForCoverage', () => {
  it('should size the quarter disc to the requested share of the box', () => {
    const radius = cornerRadiusForCoverage(600, 500, 0.5);
    const quarterDisc = (Math.PI * radius * radius) / 4;

    expect(quarterDisc).toBeCloseTo(0.5 * 600 * 500);
  });

  it('should return zero for an unmeasured box', () => {
    expect(cornerRadiusForCoverage(0, 0, 0.5)).toBe(0);
  });
});

describe('StaticFlashlight', () => {
  it('should reuse the shared reveal structure', () => {
    const { container } = render(<StaticFlashlight radius={200} />);

    const aperture = container.querySelector(
      '[data-flashlight-aperture="true"]',
    );
    const field = container.querySelector('[data-flashlight-field="true"]');
    expect(aperture?.contains(field as Node)).toBe(true);
  });

  it('should park the aperture at the left edge instead of tracking a pointer', () => {
    const { container } = render(<StaticFlashlight radius={200} />);

    const el = container.querySelector(
      '[data-flashlight="true"]',
    ) as HTMLElement;
    expect(el.style.getPropertyValue('--mouse-px')).toBe('0px');
    expect(el.style.getPropertyValue('--reveal-radius')).toBe('200px');
  });

  it('should hide itself until the container has been measured', () => {
    const { container } = render(<StaticFlashlight />);

    const el = container.querySelector(
      '[data-flashlight="true"]',
    ) as HTMLElement;
    expect(el.style.opacity).toBe('0');
  });
});
