/**
 * @fileoverview calculatePosition Unit Tests
 * @module tests/unit/src/lib/components/ui/tooltip/calculatePosition
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * We test the position calculation logic in isolation by importing from the
 * source module.  Since the function depends on window.innerWidth and
 * window.innerHeight we stub those before each test.
 */
const { calculatePosition } = await vi.importActual<{
  calculatePosition: (
    triggerRect: DOMRect,
    tooltipRect: DOMRect,
    placement: 'top' | 'bottom' | 'left' | 'right',
    offset?: number,
  ) => { x: number; y: number; actualPlacement: string };
}>('@/lib/components/ui/tooltip/calculatePosition');

function rect(
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
}

describe('calculatePosition', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
      configurable: true,
    });
  });

  it('should place tooltip above trigger for top placement', () => {
    const trigger = rect(500, 400, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'top', 8);

    expect(result.actualPlacement).toBe('top');
    expect(result.x).toBe(510); // 500 + (100-80)/2
    expect(result.y).toBe(362); // 400 - 30 - 8
  });

  it('should place tooltip below trigger for bottom placement', () => {
    const trigger = rect(500, 400, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'bottom', 8);

    expect(result.actualPlacement).toBe('bottom');
    expect(result.x).toBe(510);
    expect(result.y).toBe(448); // 400 + 40 + 8
  });

  it('should place tooltip left of trigger for left placement', () => {
    const trigger = rect(500, 400, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'left', 8);

    expect(result.actualPlacement).toBe('left');
    expect(result.x).toBe(412); // 500 - 80 - 8
    expect(result.y).toBe(405); // 400 + (40-30)/2
  });

  it('should place tooltip right of trigger for right placement', () => {
    const trigger = rect(500, 400, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'right', 8);

    expect(result.actualPlacement).toBe('right');
    expect(result.x).toBe(608); // 500 + 100 + 8
    expect(result.y).toBe(405);
  });

  it('should flip top→bottom when tooltip overflows top edge', () => {
    const trigger = rect(500, 10, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'top', 8);

    expect(result.actualPlacement).toBe('bottom');
    expect(result.y).toBe(58); // 10 + 40 + 8
  });

  it('should flip bottom→top when tooltip overflows bottom edge', () => {
    const trigger = rect(500, 740, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'bottom', 8);

    expect(result.actualPlacement).toBe('top');
    expect(result.y).toBe(702); // 740 - 30 - 8
  });

  it('should flip left→right when tooltip overflows left edge', () => {
    const trigger = rect(2, 400, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'left', 8);

    expect(result.actualPlacement).toBe('right');
    expect(result.x).toBe(110); // 2 + 100 + 8
  });

  it('should flip right→left when tooltip overflows right edge', () => {
    const trigger = rect(950, 400, 100, 40);
    const tooltip = rect(0, 0, 80, 30);

    const result = calculatePosition(trigger, tooltip, 'right', 8);

    expect(result.actualPlacement).toBe('left');
    expect(result.x).toBe(862); // 950 - 80 - 8
  });

  it('should clamp x to viewport margin', () => {
    const trigger = rect(-50, 400, 100, 40);
    const tooltip = rect(0, 0, 2000, 30);

    const result = calculatePosition(trigger, tooltip, 'bottom', 8);

    expect(result.x).toBe(8);
  });
});
