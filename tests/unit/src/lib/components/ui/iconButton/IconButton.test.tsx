/**
 * @fileoverview IconButton atom tests
 * @description Glyph per kind, accessible name, rhombus class, propagation control.
 *
 * @module tests/unit/src/lib/components/ui/iconButton/IconButton.test
 */

import { IconButton } from '@/lib/components/ui/iconButton';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('IconButton', () => {
  it('renders an accessible icon-only button', () => {
    render(<IconButton kind='close' label='Close panel' onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'Close panel' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-kind', 'close');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('invokes onClick', () => {
    const onClick = vi.fn();
    render(<IconButton kind='delete' label='Delete' onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('stops propagation only when asked', () => {
    const parent = vi.fn();
    const { rerender } = render(
      <div onClick={parent}>
        <IconButton kind='add' label='Add' onClick={() => {}} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(parent).toHaveBeenCalledOnce();

    rerender(
      <div onClick={parent}>
        <IconButton kind='add' label='Add' onClick={() => {}} stopPropagation />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(parent).toHaveBeenCalledOnce();
  });

  it('applies the rhombus shape and layout class', () => {
    render(
      <IconButton
        kind='close'
        label='Deselect'
        onClick={() => {}}
        shape='rhombus'
        className='slot'
      />,
    );
    const button = screen.getByRole('button', { name: 'Deselect' });
    expect(button.className).toMatch(/rhombus/);
    expect(button.className).toMatch(/slot/);
  });

  it('applies the square shape', () => {
    render(
      <IconButton kind='add' label='Add' onClick={() => {}} shape='square' />,
    );
    expect(screen.getByRole('button', { name: 'Add' }).className).toMatch(
      /square/,
    );
  });

  it('forwards the ref and ARIA state', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <IconButton
        kind='add'
        label='Expand'
        onClick={() => {}}
        ref={ref}
        aria-expanded={true}
        aria-controls='panel'
        tabIndex={-1}
      />,
    );
    const button = screen.getByRole('button', { name: 'Expand' });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'panel');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(button.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });

  it('renders the labelled square form with the glyph left by default', () => {
    render(
      <IconButton kind='add' onClick={() => {}}>
        Add item
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Add item' });
    expect(button.className).toMatch(/labelled/);
    expect(button.className).not.toMatch(/glyphRight|rhombus/);
    expect(button.firstElementChild?.tagName.toLowerCase()).toBe('svg');
  });

  it('carries the glyph in a diamond for labelled rhombus', () => {
    render(
      <IconButton kind='add' onClick={() => {}} shape='rhombus'>
        New
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'New' });
    expect(button.className).toMatch(/labelledRhombus/);
    expect(button.querySelector('span[aria-hidden="true"] svg')).not.toBeNull();
  });

  it('puts the glyph on the right when asked', () => {
    render(
      <IconButton kind='close' onClick={() => {}} glyph='right'>
        Dismiss
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Dismiss' }).className).toMatch(
      /glyphRight/,
    );
  });

  it('scales the glyph by size and defaults to m', () => {
    const { rerender } = render(
      <IconButton kind='close' label='Close' onClick={() => {}} />,
    );
    let button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('data-size', 'm');
    expect(button.querySelector('svg')).toHaveAttribute('width', '16');

    rerender(<IconButton kind='close' label='Close' onClick={() => {}} size='xs' />);
    button = screen.getByRole('button', { name: 'Close' });
    expect(button.className).toMatch(/xs/);
    expect(button.querySelector('svg')).toHaveAttribute('width', '10');
    expect(button.querySelector('svg')).toHaveAttribute('stroke-width', '3');
  });

  it('tones by kind unless told to inherit', () => {
    const { rerender } = render(
      <IconButton kind='add' label='Add' onClick={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Add' }).className).toMatch(/accent/);

    rerender(<IconButton kind='add' label='Add' onClick={() => {}} tone='inherit' />);
    const button = screen.getByRole('button', { name: 'Add' });
    expect(button.className).toMatch(/inherit/);
    expect(button.className).not.toMatch(/accent|danger/);
  });

  it.each([
    'edit',
    'roll',
    'avg',
    'preview',
    'previewOff',
    'refresh',
    'meta',
    'file',
    'lock',
    'unlock',
  ] as const)('renders the %s kind with a glyph and accent tone', (kind) => {
    render(<IconButton kind={kind} label='Act' onClick={() => {}} />);
    const button = screen.getByRole('button', { name: 'Act' });
    expect(button).toHaveAttribute('data-kind', kind);
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.className).toMatch(/accent/);
  });

  it('applies the dashed outline only on bordered chrome', () => {
    const { rerender } = render(
      <IconButton kind='add' onClick={() => {}} dashed>
        Add item
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Add item' }).className).toMatch(
      /dashed/,
    );

    rerender(<IconButton kind='add' label='Add' onClick={() => {}} dashed />);
    expect(
      screen.getByRole('button', { name: 'Add' }).className,
    ).not.toMatch(/dashed/);
  });

  it('honours disabled', () => {
    const onClick = vi.fn();
    render(<IconButton kind='close' label='Close' onClick={onClick} disabled />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
