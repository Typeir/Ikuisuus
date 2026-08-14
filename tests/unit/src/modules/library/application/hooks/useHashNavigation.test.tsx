/**
 * @fileoverview useHashNavigation Hook Unit Tests
 * @description Unit tests for the useHashNavigation hook: hash navigation,
 * 40%-from-top smooth scroll, and collapsible auto-open.
 *
 * @module tests/unit/lib/hooks/useHashNavigation
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/modules/library/application/hooks/useHashNavigation Hook under test
 */

import { useHashNavigation } from '@/modules/library/application/hooks/useHashNavigation';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useHashNavigation', () => {
  let mockScrollTo: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let originalHash: string;
  let originalScrollY: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    mockScrollTo = vi.fn();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    originalHash = window.location.hash;
    originalScrollY = window.scrollY;
    originalInnerHeight = window.innerHeight;

    window.scrollTo = mockScrollTo;
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    window.location.hash = originalHash;
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    document.body.innerHTML = '';
  });

  describe('event listener setup', () => {
    it('should add hashchange event listener on mount', () => {
      renderHook(() => useHashNavigation());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function),
      );
    });

    it('should remove hashchange event listener on unmount', () => {
      const { unmount } = renderHook(() => useHashNavigation());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function),
      );
    });
  });

  describe('initial hash handling', () => {
    it('should scroll to element if hash exists on mount', () => {
      document.body.innerHTML = '<div data-anchor="test-section">Test</div>';
      window.location.hash = '#test-section';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });

    it('should not scroll if no hash on mount', () => {
      document.body.innerHTML = '<div data-anchor="test-section">Test</div>';
      window.location.hash = '';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).not.toHaveBeenCalled();
    });

    it('should not scroll if element not found', () => {
      document.body.innerHTML = '<div data-anchor="other-section">Other</div>';
      window.location.hash = '#nonexistent';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('hash change handling', () => {
    it('should scroll to element on hash change', () => {
      document.body.innerHTML = '<div data-anchor="new-section">New</div>';

      renderHook(() => useHashNavigation());

      window.location.hash = '#new-section';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });

    it('should not scroll if new hash element not found', () => {
      document.body.innerHTML = '<div data-anchor="existing">Existing</div>';

      renderHook(() => useHashNavigation());
      mockScrollTo.mockClear();

      window.location.hash = '#missing';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(mockScrollTo).not.toHaveBeenCalled();
    });

    it('should not scroll if hash is empty', () => {
      document.body.innerHTML = '<div data-anchor="section">Section</div>';

      renderHook(() => useHashNavigation());
      mockScrollTo.mockClear();

      window.location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('data-anchor selector', () => {
    it('should find element with exact data-anchor match', () => {
      document.body.innerHTML = `
        <div data-anchor="section-1">Section 1</div>
        <div data-anchor="section-2">Section 2</div>
      `;
      window.location.hash = '#section-2';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should handle special characters in hash', () => {
      document.body.innerHTML =
        '<div data-anchor="special-chars_123">Special</div>';
      window.location.hash = '#special-chars_123';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should not scroll for non-existent hash', () => {
      mockScrollTo.mockClear();
      document.body.innerHTML =
        '<div data-anchor="section-one">Section 1</div>';
      window.location.hash = '#section-one';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).toHaveBeenCalled();
      mockScrollTo.mockClear();

      window.location.hash = '#section-three';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(mockScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('scroll position', () => {
    it('should use smooth behavior', () => {
      document.body.innerHTML =
        '<div data-anchor="smooth-scroll">Content</div>';
      window.location.hash = '#smooth-scroll';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      );
    });

    it('should position target at ~40% from viewport top', () => {
      const elementTop = 1200;
      const viewportHeight = 800;

      Object.defineProperty(window, 'innerHeight', {
        value: viewportHeight,
        writable: true,
        configurable: true,
      });

      document.body.innerHTML =
        '<div data-anchor="position-test">Content</div>';
      window.location.hash = '#position-test';

      const originalGetBoundingClientRect =
        Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: elementTop,
        bottom: elementTop + 50,
        left: 0,
        right: 200,
        width: 200,
        height: 50,
        x: 0,
        y: elementTop,
        toJSON: () => ({}),
      }));

      renderHook(() => useHashNavigation());

      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

      const expectedTop = Math.max(
        0,
        (window.scrollY as number) + elementTop - viewportHeight * 0.4,
      );

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expectedTop,
        behavior: 'smooth',
      });
    });

    it('should not scroll below zero', () => {
      document.body.innerHTML = '<div data-anchor="top-element">Top</div>';
      window.location.hash = '#top-element';

      const originalGetBoundingClientRect =
        Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 50,
        bottom: 100,
        left: 0,
        right: 200,
        width: 200,
        height: 50,
        x: 0,
        y: 50,
        toJSON: () => ({}),
      }));

      renderHook(() => useHashNavigation());

      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });

  describe('collapsible auto-open', () => {
    it('should open nearest ancestor details and scroll to it', () => {
      document.body.innerHTML = `
        <details>
          <summary data-anchor="nested-heading">Toggle</summary>
          <div data-anchor="nested-heading">Content</div>
        </details>
      `;
      window.location.hash = '#nested-heading';

      renderHook(() => useHashNavigation());

      const details = document.querySelector('details');
      expect(details?.hasAttribute('open')).toBe(true);
      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should not touch details that are already open', () => {
      document.body.innerHTML = `
        <details open>
          <summary data-anchor="open-heading">Toggle</summary>
          <div data-anchor="open-heading">Content</div>
        </details>
      `;
      window.location.hash = '#open-heading';

      renderHook(() => useHashNavigation());

      const details = document.querySelector('details');
      expect(details?.hasAttribute('open')).toBe(true);
      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should open nearest details and scroll to its container', () => {
      document.body.innerHTML = `
        <details>
          <summary data-anchor="nested-heading">Nested</summary>
          <div data-anchor="nested-heading">Content</div>
        </details>
      `;
      window.location.hash = '#nested-heading';

      renderHook(() => useHashNavigation());

      const details = document.querySelector('details');
      expect(details?.hasAttribute('open')).toBe(true);
      expect(mockScrollTo).toHaveBeenCalled();
    });

    it('should still scroll when target is not inside a details', () => {
      document.body.innerHTML =
        '<div data-anchor="no-details">Plain content</div>';
      window.location.hash = '#no-details';

      renderHook(() => useHashNavigation());

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });
  });

  describe('ik:details-opened event', () => {
    it('should dispatch event when a closed details is opened', () => {
      const eventSpy = vi.fn();
      window.addEventListener('ik:details-opened', eventSpy);

      document.body.innerHTML = `
        <details>
          <summary data-anchor="event-heading">Toggle</summary>
        </details>
      `;
      window.location.hash = '#event-heading';

      renderHook(() => useHashNavigation());

      expect(eventSpy).toHaveBeenCalledTimes(1);

      window.removeEventListener('ik:details-opened', eventSpy);
    });

    it('should not dispatch event when no details are opened', () => {
      const eventSpy = vi.fn();
      window.addEventListener('ik:details-opened', eventSpy);

      document.body.innerHTML = '<div data-anchor="plain-heading">Plain</div>';
      window.location.hash = '#plain-heading';

      renderHook(() => useHashNavigation());

      expect(eventSpy).not.toHaveBeenCalled();

      window.removeEventListener('ik:details-opened', eventSpy);
    });

    it('should not dispatch event when details is already open', () => {
      const eventSpy = vi.fn();
      window.addEventListener('ik:details-opened', eventSpy);

      document.body.innerHTML = `
        <details open>
          <summary data-anchor="open-event">Already Open</summary>
        </details>
      `;
      window.location.hash = '#open-event';

      renderHook(() => useHashNavigation());

      expect(eventSpy).not.toHaveBeenCalled();

      window.removeEventListener('ik:details-opened', eventSpy);
    });
  });

  describe('returns', () => {
    it('should return void', () => {
      const { result } = renderHook(() => useHashNavigation());
      expect(result.current).toBeUndefined();
    });
  });
});
