/**
 * @fileoverview Regression tests for tooltip transform positioning.
 * @description Guards against the tooltip painting at the viewport origin
 * before a position is written.
 *
 * @module tests/unit/src/lib/components/ui/tooltip/positionProbe
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import { Tooltip } from '@/lib/components/ui/tooltip/tooltip';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalGetBCR = Element.prototype.getBoundingClientRect;

describe('tooltip positioning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.getBoundingClientRect = function () {
      return {
        top: 300,
        bottom: 320,
        left: 400,
        right: 500,
        width: 100,
        height: 20,
        x: 400,
        y: 300,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBCR;
    vi.useRealTimers();
  });

  const openTooltip = () => {
    render(
      <Tooltip content='hello' showDelay={0}>
        <button>trigger</button>
      </Tooltip>,
    );
    act(() => {
      vi.advanceTimersByTime(10);
    });
    fireEvent.mouseEnter(document.querySelector('span')!);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    return document.querySelector('[role=tooltip]') as HTMLElement;
  };

  it('writes a transform when shown', () => {
    const tip = openTooltip();

    expect(tip).toBeTruthy();
    expect(tip.style.transform).toMatch(/^translate3d\(-?\d+px, -?\d+px, 0\)$/);
  });

  it('does not paint at the viewport origin', () => {
    const tip = openTooltip();

    expect(tip.style.transform).not.toBe('translate3d(0px, 0px, 0)');
    expect(tip.style.visibility).not.toBe('hidden');
  });

  it('positions a forceVisible tooltip that mounts after activation', () => {
    render(
      <Tooltip content='hello' forceVisible>
        <button>trigger</button>
      </Tooltip>,
    );
    act(() => {
      vi.advanceTimersByTime(50);
    });

    const tip = document.querySelector('[role=tooltip]') as HTMLElement;

    expect(tip).toBeTruthy();
    expect(tip.style.transform).toMatch(/^translate3d\(-?\d+px, -?\d+px, 0\)$/);
    expect(tip.style.visibility).not.toBe('hidden');
  });
});
