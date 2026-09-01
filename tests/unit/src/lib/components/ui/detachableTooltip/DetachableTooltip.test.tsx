/**
 * @fileoverview DetachableTooltip Tests
 * @description Covers the card opening on hover, fading out when the pointer
 * leaves, and staying when it is pinned by Shift, by Shift+Enter or by a drag.
 *
 * @module tests/unit/src/lib/components/ui/detachableTooltip/DetachableTooltip.test
 * @version 2.0.0
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
function renderCard() {
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
 * Hovers the trigger and lets the open delay elapse.
 *
 * @returns {HTMLElement} The trigger element
 */
function openCard(): HTMLElement {
  const trigger = screen.getByRole('link', { name: 'blinded' });
  act(() => {
    fireEvent.mouseEnter(trigger);
    vi.advanceTimersByTime(0);
  });
  return trigger;
}

/** Runs the hide delay and the fade to completion. */
function settle(): void {
  act(() => {
    vi.advanceTimersByTime(0);
  });
  act(() => {
    vi.advanceTimersByTime(300);
  });
}

/**
 * The card, identified by the chrome only it has.
 *
 * @returns {HTMLElement | null} The card element, or null
 */
function card(): HTMLElement | null {
  return screen.queryByRole('region', { name: 'Blinded' });
}

describe('DetachableTooltip', () => {
  const originalGetBCR = Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const isLayer = String(this.className).includes('layer');
      const box = isLayer
        ? { x: 0, y: 0, width: 1024, height: 768 }
        : { x: 120, y: 240, width: 300, height: 90 };
      return {
        ...box,
        top: box.y,
        left: box.x,
        right: box.x + box.width,
        bottom: box.y + box.height,
        toJSON() {
          return this;
        },
      } as DOMRect;
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.getBoundingClientRect = originalGetBCR;
    vi.clearAllMocks();
  });

  it('renders the trigger with no card', () => {
    renderCard();

    expect(screen.getByRole('link', { name: 'blinded' })).toBeInTheDocument();
    expect(card()).not.toBeInTheDocument();
  });

  it('opens a card on hover, chrome and all', () => {
    renderCard();
    openCard();

    expect(card()).toBeInTheDocument();
    expect(screen.getByText('Definition body')).toBeInTheDocument();
    expect(
      screen.getByRole('separator', { name: 'Blinded' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Close Blinded' }),
    ).toBeInTheDocument();
  });

  it('never renders a tooltip phase', () => {
    renderCard();
    openCard();

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('fades out when the pointer leaves without Shift', () => {
    renderCard();
    const trigger = openCard();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: false });
    });
    settle();

    expect(card()).not.toBeInTheDocument();
  });

  it('stays when the pointer leaves with Shift held', () => {
    renderCard();
    const trigger = openCard();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    settle();

    expect(card()).toBeInTheDocument();
  });

  it('survives the pointer moving onto it', () => {
    renderCard();
    const trigger = openCard();
    const surface = card() as HTMLElement;

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: false });
      fireEvent.mouseEnter(surface);
    });
    settle();

    expect(card()).toBeInTheDocument();
  });

  it('closes through its own control', () => {
    renderCard();
    const trigger = openCard();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Close Blinded' }));
    });
    settle();

    expect(card()).not.toBeInTheDocument();
  });

  it('closes a pinned card with Escape', () => {
    renderCard();
    const trigger = openCard();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    settle();

    expect(card()).not.toBeInTheDocument();
  });

  it('pins from the keyboard with Shift+Enter', () => {
    renderCard();
    const trigger = screen.getByRole('link', { name: 'blinded' });

    act(() => {
      fireEvent.focus(trigger);
      vi.advanceTimersByTime(0);
    });
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter', shiftKey: true });
    });
    act(() => {
      fireEvent.blur(trigger);
    });
    settle();

    expect(card()).toBeInTheDocument();
  });

  it('pins when the card is dragged', () => {
    renderCard();
    const trigger = openCard();
    const handle = screen.getByRole('separator', { name: 'Blinded' });

    act(() => {
      fireEvent.pointerDown(handle, { clientX: 10, clientY: 10 });
    });
    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: false });
    });
    settle();

    expect(card()).toBeInTheDocument();
  });

  it('opens one card, not one per hover', () => {
    renderCard();
    const trigger = openCard();

    act(() => {
      fireEvent.mouseLeave(trigger, { shiftKey: true });
    });
    openCard();

    expect(screen.getAllByRole('region', { name: 'Blinded' })).toHaveLength(1);
  });

  it('returns the trigger untouched when there is no content', () => {
    render(
      <DetachableTooltip content={null}>
        <a href='/rules#blinded'>blinded</a>
      </DetachableTooltip>,
    );

    expect(screen.getByRole('link', { name: 'blinded' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
