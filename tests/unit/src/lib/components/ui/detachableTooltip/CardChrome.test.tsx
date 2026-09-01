/**
 * @fileoverview CardChrome Tests
 * @description Covers the handle, title, close control and resize corner a
 * parked card wears, and that pointer handlers reach the right element.
 *
 * @module tests/unit/src/lib/components/ui/detachableTooltip/CardChrome.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering and queries
 * @requires @/lib/components/ui/detachableTooltip/CardChrome Module under test
 */

import { CardChrome } from '@/lib/components/ui/detachableTooltip/CardChrome';
import type { HandleProps } from '@/lib/components/ui/draggable/useDrag';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Builds a set of spy handlers.
 *
 * @returns {HandleProps & { calls: Record<string, ReturnType<typeof vi.fn>> }} Handlers plus their spies
 */
function handlers() {
  const onPointerDown = vi.fn();
  const onPointerMove = vi.fn();
  const onPointerUp = vi.fn();
  return {
    props: { onPointerDown, onPointerMove, onPointerUp } as HandleProps,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

describe('CardChrome', () => {
  it('renders the body, a named handle and a resize corner', () => {
    const drag = handlers();
    const resize = handlers();

    render(
      <CardChrome
        dragHandleProps={drag.props}
        resizeHandleProps={resize.props}
        onClose={vi.fn()}
        title='Blinded'
        resizable>
        <p>Definition body</p>
      </CardChrome>,
    );

    expect(screen.getByText('Definition body')).toBeInTheDocument();
    expect(
      screen.getByRole('separator', { name: 'Blinded' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('separator', { name: 'Resize handle' }),
    ).toBeInTheDocument();
  });

  it('falls back to a generic handle name without a title', () => {
    const drag = handlers();
    const resize = handlers();

    render(
      <CardChrome
        dragHandleProps={drag.props}
        resizeHandleProps={resize.props}
        onClose={vi.fn()}>
        <p>Body</p>
      </CardChrome>,
    );

    expect(
      screen.getByRole('separator', { name: 'Drag handle' }),
    ).toBeInTheDocument();
  });

  it('omits the resize corner unless asked for one', () => {
    const drag = handlers();
    const resize = handlers();

    render(
      <CardChrome
        dragHandleProps={drag.props}
        resizeHandleProps={resize.props}
        onClose={vi.fn()}
        title='Blinded'>
        <p>Body</p>
      </CardChrome>,
    );

    expect(
      screen.queryByRole('separator', { name: 'Resize handle' }),
    ).not.toBeInTheDocument();
  });

  it('closes through its own control', () => {
    const onClose = vi.fn();
    const drag = handlers();
    const resize = handlers();

    render(
      <CardChrome
        dragHandleProps={drag.props}
        resizeHandleProps={resize.props}
        onClose={onClose}
        title='Blinded'
        closeLabel='Close Blinded'>
        <p>Body</p>
      </CardChrome>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close Blinded' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('routes pointer gestures to the matching handle', () => {
    const drag = handlers();
    const resize = handlers();

    render(
      <CardChrome
        dragHandleProps={drag.props}
        resizeHandleProps={resize.props}
        onClose={vi.fn()}
        title='Blinded'
        resizable>
        <p>Body</p>
      </CardChrome>,
    );

    fireEvent.pointerDown(screen.getByRole('separator', { name: 'Blinded' }));
    expect(drag.onPointerDown).toHaveBeenCalledTimes(1);
    expect(resize.onPointerDown).not.toHaveBeenCalled();

    fireEvent.pointerDown(
      screen.getByRole('separator', { name: 'Resize handle' }),
    );
    expect(resize.onPointerDown).toHaveBeenCalledTimes(1);
  });
});
