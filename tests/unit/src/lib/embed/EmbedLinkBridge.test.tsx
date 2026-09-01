/**
 * @fileoverview Embed Link Bridge Tests
 * @description Verifies the delegated listener routes library links in-frame
 * and opens everything else in a new window.
 *
 * @module tests/unit/src/lib/embed/EmbedLinkBridge.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { EmbedLinkBridge } from '@/lib/embed/EmbedLinkBridge';

const openSpy = vi.fn();

/**
 * Whether the bridge called `preventDefault`, sampled at bubble phase.
 */
let preventedByBridge = false;

/**
 * Records the bridge's verdict, then cancels the event to stop jsdom
 * navigation.
 *
 * @function navigationGuard
 * @param {Event} event - The click travelling back up the tree
 * @returns {void}
 */
const navigationGuard = (event: Event): void => {
  preventedByBridge = event.defaultPrevented;
  event.preventDefault();
};

/**
 * Append a detached anchor to the document body.
 *
 * @function addAnchor
 * @param {string} href - The anchor's href
 * @returns {HTMLAnchorElement} The appended anchor
 */
const addAnchor = (href: string): HTMLAnchorElement => {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', href);
  anchor.appendChild(document.createElement('span'));
  document.body.appendChild(anchor);
  return anchor;
};

/**
 * Dispatch a click from the anchor's inner span to exercise delegation.
 *
 * @function clickInside
 * @param {HTMLAnchorElement} anchor - The anchor to click through
 * @param {MouseEventInit} [init] - Extra event properties
 * @returns {void}
 */
const clickInside = (
  anchor: HTMLAnchorElement,
  init: MouseEventInit = {},
): void => {
  preventedByBridge = false;
  (anchor.firstElementChild as Element).dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ...init,
    }),
  );
};

describe('EmbedLinkBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', openSpy);
    document.addEventListener('click', navigationGuard);
  });

  afterEach(() => {
    document.removeEventListener('click', navigationGuard);
    cleanup();
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('routes a library link inside the frame, rewritten to the embed tree', () => {
    render(<EmbedLinkBridge />);
    const anchor = addAnchor('/en/library/monsters/aboleth');

    clickInside(anchor);

    expect(preventedByBridge).toBe(true);
    expect(mockPush).toHaveBeenCalledWith('/en/embed/monsters/aboleth');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens a non-library route in a new window', () => {
    render(<EmbedLinkBridge />);
    const anchor = addAnchor('/en/search?aspect=school%3Aevocation');

    clickInside(anchor);

    expect(preventedByBridge).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      `${window.location.origin}/en/search?aspect=school%3Aevocation`,
      '_blank',
      'noopener',
    );
  });

  it('opens the mdx editor in a new window rather than replacing the frame', () => {
    render(<EmbedLinkBridge />);
    const anchor = addAnchor('/en/utils/mdx-editor?slug=spells/aid&locale=en');

    clickInside(anchor);

    expect(mockPush).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      `${window.location.origin}/en/utils/mdx-editor?slug=spells/aid&locale=en`,
      '_blank',
      'noopener',
    );
  });

  it('leaves in-page anchors alone', () => {
    render(<EmbedLinkBridge />);
    const anchor = addAnchor('#traits');

    clickInside(anchor);

    expect(preventedByBridge).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('leaves modified clicks to the browser', () => {
    render(<EmbedLinkBridge />);
    const anchor = addAnchor('/en/library/monsters/aboleth');

    clickInside(anchor, { ctrlKey: true });

    expect(preventedByBridge).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('ignores clicks that land outside any anchor', () => {
    render(<EmbedLinkBridge />);

    document.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );

    expect(mockPush).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('detaches its listener on unmount', () => {
    const { unmount } = render(<EmbedLinkBridge />);
    const anchor = addAnchor('/en/library/world');

    clickInside(anchor);
    expect(mockPush).toHaveBeenCalledTimes(1);

    unmount();
    clickInside(anchor);

    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
