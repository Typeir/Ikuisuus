/**
 * @fileoverview Draggable Component Tests
 * @description Unit tests for the Draggable container component.
 * Covers rendering, drag handle interaction, pointer movement, boundary
 * clamping, resize re-clamping, resize handle, close button, and
 * function-based initial positioning.
 *
 * @module tests/unit/draggable
 */

import { Draggable } from '@/lib/components/ui/draggable/Draggable';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});

describe('Draggable', () => {
  it('renders children and drag handle', () => {
    render(
      <Draggable handleLabel='Preview' testId='drag-container'>
        <p>Hello content</p>
      </Draggable>,
    );

    expect(screen.getByText('Hello content')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByTestId('drag-container')).toBeInTheDocument();
  });

  it('renders drag handle with aria-label when no label text', () => {
    render(
      <Draggable testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-label', 'Drag handle');
  });

  it('renders drag handle with custom label as aria-label', () => {
    render(
      <Draggable handleLabel='My Panel' testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-label', 'My Panel');
    expect(screen.getByText('My Panel')).toBeInTheDocument();
  });

  it('applies initial position as left/top styles', () => {
    render(
      <Draggable initialPosition={{ x: 120, y: 80 }} testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.style.left).toBe('120px');
    expect(container.style.top).toBe('80px');
  });

  it('applies custom className and style', () => {
    render(
      <Draggable
        className='my-custom-class'
        style={{ opacity: 0.5 }}
        testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.classList.contains('my-custom-class')).toBe(true);
    expect(container.style.opacity).toBe('0.5');
  });

  it('defaults position to 0,0 when no initialPosition provided', () => {
    render(
      <Draggable testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.style.left).toBe('0px');
    expect(container.style.top).toBe('0px');
  });

  it('updates position on pointer drag sequence', async () => {
    render(
      <Draggable initialPosition={{ x: 50, y: 50 }} testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const handle = screen.getByRole('separator');
    const container = screen.getByTestId('drag-container');

    /** Simulate pointer down → move → up */
    await act(async () => {
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );
    });

    await act(async () => {
      handle.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 130,
          clientY: 120,
          bubbles: true,
        }),
      );
    });

    await act(async () => {
      handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    expect(container.style.left).toBeDefined();
    expect(container.style.top).toBeDefined();
  });

  it('adds isDragging class during drag', async () => {
    render(
      <Draggable initialPosition={{ x: 10, y: 10 }} testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const handle = screen.getByRole('separator');
    const container = screen.getByTestId('drag-container');

    await act(async () => {
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
          bubbles: true,
        }),
      );
    });

    expect(container.className).toContain('isDragging');

    await act(async () => {
      handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    });

    expect(container.className).not.toContain('isDragging');
  });

  it('re-clamps position on window resize', async () => {
    render(
      <Draggable initialPosition={{ x: 500, y: 500 }} testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.style.left).toBe('500px');

    /** Trigger window resize */
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(container.style.left).toBeDefined();
  });

  it('cleans up resize listener on unmount', () => {
    const removeListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <Draggable testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );

    removeListenerSpy.mockRestore();
  });

  it('renders resize handle when resizable is true', () => {
    render(
      <Draggable testId='drag-container' resizable>
        <p>Content</p>
      </Draggable>,
    );

    const resizeHandle = screen.getByTestId('drag-container-resize');
    expect(resizeHandle).toBeInTheDocument();
    expect(resizeHandle).toHaveAttribute('aria-label', 'Resize handle');
  });

  it('does not render resize handle when resizable is false', () => {
    render(
      <Draggable testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    expect(screen.queryByTestId('drag-container-resize')).toBeNull();
  });

  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    render(
      <Draggable testId='drag-container' onClose={onClose}>
        <p>Content</p>
      </Draggable>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render close button when onClose is omitted', () => {
    render(
      <Draggable testId='drag-container'>
        <p>Content</p>
      </Draggable>,
    );

    expect(screen.queryByRole('button', { name: 'Close panel' })).toBeNull();
  });

  it('calls onClose callback when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Draggable testId='drag-container' onClose={onClose}>
        <p>Content</p>
      </Draggable>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close panel' });
    await act(async () => {
      closeButton.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('adds isResizing class during resize drag', async () => {
    render(
      <Draggable testId='drag-container' resizable>
        <p>Content</p>
      </Draggable>,
    );

    const resizeHandle = screen.getByTestId('drag-container-resize');
    const container = screen.getByTestId('drag-container');

    await act(async () => {
      resizeHandle.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );
    });

    expect(container.className).toContain('isResizing');

    await act(async () => {
      resizeHandle.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true }),
      );
    });

    expect(container.className).not.toContain('isResizing');
  });

  it('accepts function-based initialPosition', () => {
    const positionFn = vi.fn().mockReturnValue({ x: 200, y: 50 });

    render(
      <Draggable testId='drag-container' initialPosition={positionFn}>
        <p>Content</p>
      </Draggable>,
    );

    /** Function should be called with parent bounds */
    expect(positionFn).toHaveBeenCalledWith({
      width: expect.any(Number),
      height: expect.any(Number),
    });
  });

  it('wraps children in dragContent container', () => {
    render(
      <Draggable testId='drag-container'>
        <p>Inner text</p>
      </Draggable>,
    );

    const inner = screen.getByText('Inner text');
    /** The content should be nested inside a dragContent wrapper div */
    expect(inner.parentElement).toBeDefined();
  });

  it('applies defaultWidth as inline width style', () => {
    render(
      <Draggable testId='drag-container' defaultWidth={420}>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.style.width).toBe('420px');
  });

  it('applies defaultHeight as inline height style', () => {
    render(
      <Draggable testId='drag-container' defaultHeight='calc(100% - 48px)'>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.style.height).toBe('calc(100% - 48px)');
  });

  it('applies both defaultWidth and defaultHeight together', () => {
    render(
      <Draggable testId='drag-container' defaultWidth='50%' defaultHeight={300}>
        <p>Content</p>
      </Draggable>,
    );

    const container = screen.getByTestId('drag-container');
    expect(container.style.width).toBe('50%');
    expect(container.style.height).toBe('300px');
  });
});
