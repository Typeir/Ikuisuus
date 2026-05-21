/**
 * @fileoverview ResizablePane Component Tests
 * @description Unit tests for the resizable pane primitive — verifies
 * rendering, ARIA semantics on the handle, keyboard resize step/clamp
 * behaviour, and localStorage round-trip persistence.
 */

import { ResizablePane } from '@/lib/components/ui/resizablePane';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('ResizablePane', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe('Rendering', () => {
    it('renders both left and right panes', () => {
      render(
        <ResizablePane
          id='test.basic'
          left={<div>LEFT_CONTENT</div>}
          right={<div>RIGHT_CONTENT</div>}
        />,
      );
      expect(screen.getByText('LEFT_CONTENT')).toBeInTheDocument();
      expect(screen.getByText('RIGHT_CONTENT')).toBeInTheDocument();
    });

    it('renders a separator handle with the default percentage', () => {
      render(
        <ResizablePane
          id='test.default'
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      expect(handle).toHaveAttribute('aria-orientation', 'vertical');
      expect(handle).toHaveAttribute('aria-valuenow', '30');
      expect(handle).toHaveAttribute('aria-valuemin', '18');
      expect(handle).toHaveAttribute('aria-valuemax', '70');
    });

    it('honors a custom defaultLeftPercent', () => {
      render(
        <ResizablePane
          id='test.custom'
          defaultLeftPercent={45}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-valuenow',
        '45',
      );
    });
  });

  describe('Keyboard interaction', () => {
    it('increments by 2 on ArrowRight', () => {
      render(
        <ResizablePane
          id='test.kbd.right'
          defaultLeftPercent={30}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      expect(handle).toHaveAttribute('aria-valuenow', '32');
    });

    it('decrements by 2 on ArrowLeft', () => {
      render(
        <ResizablePane
          id='test.kbd.left'
          defaultLeftPercent={30}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      fireEvent.keyDown(handle, { key: 'ArrowLeft' });
      expect(handle).toHaveAttribute('aria-valuenow', '28');
    });

    it('clamps at maxLeftPercent on End', () => {
      render(
        <ResizablePane
          id='test.kbd.end'
          maxLeftPercent={60}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      fireEvent.keyDown(handle, { key: 'End' });
      expect(handle).toHaveAttribute('aria-valuenow', '60');
    });

    it('clamps at minLeftPercent on Home', () => {
      render(
        <ResizablePane
          id='test.kbd.home'
          minLeftPercent={20}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      fireEvent.keyDown(handle, { key: 'Home' });
      expect(handle).toHaveAttribute('aria-valuenow', '20');
    });

    it('does not exceed maxLeftPercent with repeated ArrowRight', () => {
      render(
        <ResizablePane
          id='test.kbd.clamp.max'
          defaultLeftPercent={68}
          maxLeftPercent={70}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      expect(handle).toHaveAttribute('aria-valuenow', '70');
    });
  });

  describe('Persistence', () => {
    it('writes the new percentage to localStorage on keyboard resize', () => {
      render(
        <ResizablePane
          id='persist.kbd'
          defaultLeftPercent={30}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      const handle = screen.getByRole('separator');
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
      expect(
        window.localStorage.getItem('ikuisuus.resizablePane.persist.kbd'),
      ).toBe('32');
    });

    it('restores a previously persisted percentage on mount', () => {
      window.localStorage.setItem('ikuisuus.resizablePane.persist.read', '55');
      render(
        <ResizablePane
          id='persist.read'
          defaultLeftPercent={30}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-valuenow',
        '55',
      );
    });

    it('ignores stored values outside the configured range', () => {
      window.localStorage.setItem(
        'ikuisuus.resizablePane.persist.bounds',
        '95',
      );
      render(
        <ResizablePane
          id='persist.bounds'
          defaultLeftPercent={30}
          maxLeftPercent={70}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-valuenow',
        '30',
      );
    });

    it('ignores malformed stored values', () => {
      window.localStorage.setItem(
        'ikuisuus.resizablePane.persist.bad',
        'not-a-number',
      );
      render(
        <ResizablePane
          id='persist.bad'
          defaultLeftPercent={30}
          left={<div>L</div>}
          right={<div>R</div>}
        />,
      );
      expect(screen.getByRole('separator')).toHaveAttribute(
        'aria-valuenow',
        '30',
      );
    });
  });
});
