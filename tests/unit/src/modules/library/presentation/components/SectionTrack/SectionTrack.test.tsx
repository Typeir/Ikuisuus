/**
 * @fileoverview SectionTrack Component Unit Tests
 * @module tests/unit/modules/library/presentation/components/SectionTrack
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { SectionTrack } from '@/modules/library/presentation/components/SectionTrack';

/**
 * Wraps children in the required context provider so that
 * {@link SectionTrack} can read the sidebar menu state.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return <PersistentUiProvider>{children}</PersistentUiProvider>;
}

describe('SectionTrack', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let mockRaf: number;

  beforeEach(() => {
    mockRaf = 0;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return ++mockRaf;
    });
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { });

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 3000, writable: true, configurable: true });
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    document.body.innerHTML = '';
  });

  describe('rendering', () => {
    it('should return null when no headings exist', () => {
      const { container } = render(<SectionTrack />, { wrapper });
      expect(container.innerHTML).toBe('');
    });

    it('should render a nav element with headings', async () => {
      document.body.innerHTML = `
        <h1 data-anchor="intro">Intro</h1>
        <h2 data-anchor="details">Details</h2>
      `;

      render(<SectionTrack />, { wrapper });

      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: 'Page sections' });
        expect(nav).toBeInTheDocument();
      });
    });

    it('should render bars for each heading', async () => {
      document.body.innerHTML = `
        <h1 data-anchor="a">A</h1>
        <h2 data-anchor="b">B</h2>
        <h3 data-anchor="c">C</h3>
      `;

      render(<SectionTrack />, { wrapper });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);
      });
    });

    it('should set aria-label on each bar', async () => {
      document.body.innerHTML = `
        <h1 data-anchor="intro">Introduction</h1>
      `;

      render(<SectionTrack />, { wrapper });

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Jump to Introduction' });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('click behavior', () => {
    it('should set window.location.hash on bar click', async () => {
      document.body.innerHTML = `
        <h1 data-anchor="target-section">Target</h1>
      `;

      render(<SectionTrack />, { wrapper });

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Jump to Target' });
        button.click();
      });

      expect(window.location.hash).toBe('#target-section');
    });
  });

  describe('visibility', () => {
    it('should have visible attribute by default on desktop', async () => {
      document.body.innerHTML = `<h1 data-anchor="a">A</h1>`;

      render(<SectionTrack />, { wrapper });

      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: 'Page sections' });
        expect(nav.getAttribute('data-visible')).toBe('true');
      });
    });
  });
});
