/**
 * @fileoverview useSectionTrack Hook Unit Tests
 * @module tests/unit/src/modules/library/application/hooks/useSectionTrack.test
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

import { useSectionTrack } from '@/modules/library/application/hooks/useSectionTrack';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useSectionTrack', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let mockRaf: number;

  beforeEach(() => {
    mockRaf = 0;
    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        cb(0);
        return ++mockRaf;
      });
    cancelRafSpy = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});

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
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 3000,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    document.body.innerHTML = '';
  });

  describe('empty state', () => {
    it('should return empty items when no headings exist', () => {
      const { result } = renderHook(() => useSectionTrack());

      expect(result.current.items).toEqual([]);
      expect(result.current.activeAnchor).toBeNull();
    });
  });

  describe('heading scanning', () => {
    it('should discover heading elements with data-anchor attributes', async () => {
      document.body.innerHTML = `
        <h1 data-anchor="intro">Introduction</h1>
        <h2 data-anchor="section-1">Section One</h2>
        <h3 data-anchor="subsection">Subsection</h3>
      `;

      const { result } = renderHook(() => useSectionTrack());

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
      });

      expect(result.current.items[0].anchor).toBe('intro');
      expect(result.current.items[0].level).toBe(1);
      expect(result.current.items[1].anchor).toBe('section-1');
      expect(result.current.items[1].level).toBe(2);
      expect(result.current.items[2].anchor).toBe('subsection');
      expect(result.current.items[2].level).toBe(3);
    });

    it('should sort items by document position', async () => {
      document.body.innerHTML = `
        <h3 data-anchor="third">Third</h3>
        <h1 data-anchor="first">First</h1>
        <h2 data-anchor="second">Second</h2>
      `;

      const { result } = renderHook(() => useSectionTrack());

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
      });

      expect(result.current.items.map((i) => i.anchor)).toEqual([
        'third',
        'first',
        'second',
      ]);
    });

    it('should rescan headings on ik:details-opened event', async () => {
      document.body.innerHTML = `
        <h1 data-anchor="intro">Intro</h1>
        <h2 data-anchor="feature">Feature</h2>
      `;

      const { result } = renderHook(() => useSectionTrack());

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      document.body.innerHTML = `
        <h1 data-anchor="intro">Intro</h1>
        <h2 data-anchor="feature">Feature</h2>
        <h2 data-anchor="new-feature">New Feature</h2>
      `;

      act(() => {
        window.dispatchEvent(new CustomEvent('ik:details-opened'));
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(3);
      });

      expect(result.current.items[2].anchor).toBe('new-feature');
    });
  });

  describe('active anchor detection', () => {
    it('should detect active anchor based on scroll position', async () => {
      // jsdom doesn't do CSS layout, so all headings have getBoundingClientRect → 0.
      // Use inline headings with explicit top values from scanning at scrollY=0.
      document.body.innerHTML = `
        <h1 data-anchor="first">First</h1>
        <h2 data-anchor="second">Second</h2>
      `;

      Object.defineProperty(window, 'scrollY', {
        value: 0,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useSectionTrack());

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      // scrollY=0 + viewportH*0.4=320 = 320. Both headings at ~0, so "second" is last match.
      expect(result.current.activeAnchor).toBe('second');

      // Now scroll down beyond both headings
      Object.defineProperty(window, 'scrollY', {
        value: 600,
        writable: true,
        configurable: true,
      });

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        // threshold=600+320=920. Both at ~0, so "second" is still last ≤ 920
        expect(result.current.activeAnchor).toBe('second');
      });
    });
  });

  describe('visibility', () => {
    it('should be visible by default on desktop', () => {
      const { result } = renderHook(() => useSectionTrack());

      expect(result.current.visible).toBe(true);
    });

    it('should stay visible on desktop after timeout', () => {
      vi.useFakeTimers();

      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useSectionTrack());

      act(() => {
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.visible).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('viewportH', () => {
    it('should expose current viewport height', async () => {
      Object.defineProperty(window, 'innerHeight', {
        value: 900,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useSectionTrack());

      await waitFor(() => {
        expect(result.current.viewportH).toBe(900);
      });
    });
  });

  describe('centerProximity', () => {
    it('should return a value between 0 and 1 for any item', async () => {
      const { result } = renderHook(() => useSectionTrack());

      // Wait for initial state to settle
      await waitFor(() => {
        expect(result.current.centerProximity).toBeDefined();
      });

      const proximity = result.current.centerProximity({
        anchor: 'test',
        level: 2,
        top: 400,
        height: 24,
        label: 'Test',
      });

      expect(proximity).toBeGreaterThanOrEqual(0);
      expect(proximity).toBeLessThanOrEqual(1);
    });

    it('should return value closer to 1 for items near center', async () => {
      // Set scroll to center an item
      Object.defineProperty(window, 'scrollY', {
        value: 500,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 1000,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useSectionTrack());

      await waitFor(() => {
        expect(result.current.centerProximity).toBeDefined();
      });

      // At scrollY=500, viewport=1000, center is at 500+500=1000.
      // Item at top=1000 is exactly at center → proximity ≈ 1
      const proximityCenter = result.current.centerProximity({
        anchor: 'center',
        level: 2,
        top: 1000,
        height: 24,
        label: 'Center',
      });

      // Item at top=3000 is far from center
      const proximityFar = result.current.centerProximity({
        anchor: 'far',
        level: 2,
        top: 3000,
        height: 24,
        label: 'Far',
      });

      expect(proximityCenter).toBeGreaterThan(proximityFar);
    });
  });
});
