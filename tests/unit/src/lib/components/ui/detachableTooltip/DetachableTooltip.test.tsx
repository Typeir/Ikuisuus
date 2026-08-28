/**
 * @fileoverview DetachableTooltip Tests
 * @description Covers hover open/close and the shift-leave promotion into a
 * draggable panel that outlives the hover.
 *
 * @module tests/unit/src/lib/components/ui/detachableTooltip/DetachableTooltip
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering and queries
 * @requires @/lib/components/ui/detachableTooltip Module under test
 */

import { DetachableTooltip } from '@/lib/components/ui/detachableTooltip';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

/**
 * Renders a keyword-style trigger wrapped in the component under test.
 *
 * @returns {ReturnType<typeof render>} Testing Library render result
 */
function renderTooltip() {
  return render(
    <DetachableTooltip
      content={<p>Definition body</p>}
      title='Blinded'
      closeLabel='Close Blinded'
      showDelay={0}
      hideDelay={0}>
      <a href='/rules#blinded'>blinded</a>
    </DetachableTooltip>,
  );
}

/**
 * Opens the tooltip by hovering the trigger.
 *
 * @returns {HTMLElement} The trigger element
 */
function openTooltip(): HTMLElement {
  const trigger = screen.getByRole('link', { name: 'blinded' });
  act(() => {
    fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(0);
  });
  return trigger;
}

describe('DetachableTooltip', () => {
  const originalGetBCR = Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.useFakeTimers();
    /* The layer is the drag bounds, so it has to measure larger than the
       surface or every position clamps to the origin. */
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const isLayer = String(this.className).includes('layer');
      return isLayer
        ? ({
            x: 0,
            y: 0,
            width: 1024,
            height: 768,
            top: 0,
            right: 1024,
            bottom: 768,
            left: 0,
            toJSON() {
              return this;
            },
          } as DOMRect)
        : ({
            x: 120,
            y: 240,
            width: 300,
            height: 90,
            top: 240,
            right: 420,
            bottom: 330,
            left: 120,
            toJSON() {
              return this;
            },
          } as DOMRect);
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.getBoundingClientRect = originalGetBCR;
    vi.clearAllMocks();
  });

  it('renders the trigger without a tooltip', () => {
    renderTooltip();

    expect(screen.getByRole('link', { name: 'blinded' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on hover', () => {
    renderTooltip();
    openTooltip();

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('closes on a plain leave and leaves nothing behind', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: false });
      vi.advanceTimersByTime(0);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /close/i }),
    ).not.toBeInTheDocument();
  });

  it('parks a draggable panel when Shift is held on leave', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByText('Definition body')).toBeInTheDocument();
    expect(
      screen.getByRole('separator', { name: 'Blinded' }),
    ).toBeInTheDocument();
  });

  it('raises the panel by its chrome so the body lands where the tooltip was', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });

    const handle = screen.getByRole('separator', { name: 'Blinded' });
    const panel = handle.parentElement as HTMLElement;
    const chrome = handle.getBoundingClientRect().height;

    expect(panel.style.left).toBe('120px');
    expect(panel.style.top).toBe(`${240 - chrome}px`);
    expect(panel.style.width).toBe('300px');
  });

  it('closes the parked panel through its own control', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Close Blinded' }));
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Definition body')).not.toBeInTheDocument();
  });

  it('holds the panel mounted while it fades out', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Close Blinded' }));
    });

    expect(screen.getByText('Definition body')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Definition body')).not.toBeInTheDocument();
  });

  it('closes the parked panel with Escape', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText('Definition body')).not.toBeInTheDocument();
  });

  it('closes the hover card with Escape before any parked card', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    openTooltip();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByText('Definition body')).toBeInTheDocument();
  });

  it('parks from the keyboard with Shift+Enter', () => {
    renderTooltip();
    const trigger = screen.getByRole('link', { name: 'blinded' });

    act(() => {
      fireEvent.focus(trigger);
      vi.advanceTimersByTime(0);
    });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter', shiftKey: true });
    });

    expect(
      screen.getByRole('region', { name: 'Blinded' }),
    ).toBeInTheDocument();
  });

  it('moves the existing panel instead of stacking a duplicate', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    openTooltip();
    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });

    expect(screen.getAllByRole('region', { name: 'Blinded' })).toHaveLength(1);
  });

  it('names the parked panel for assistive technology', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });

    expect(screen.getByRole('region', { name: 'Blinded' })).toBeInTheDocument();
  });

  it('does not raise a second surface while one is parked', () => {
    renderTooltip();
    const trigger = openTooltip();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    openTooltip();

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Blinded' })).toHaveLength(1);
  });

  it('hands the same element over rather than replacing it', () => {
    renderTooltip();
    const trigger = openTooltip();
    const before = screen.getByRole('tooltip');

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });

    const after = screen.getByRole('region', { name: 'Blinded' });
    expect(after).toBe(before);
  });

  it('returns the trigger untouched when there is no content', () => {
    render(
      <DetachableTooltip content={null}>
        <a href='/rules#blinded'>blinded</a>
      </DetachableTooltip>,
    );

    expect(screen.getByRole('link', { name: 'blinded' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
