/**
 * @fileoverview Chip Primitive Tests
 * @description Smoke tests for label rendering, variant class application,
 * remove handler, and click handler.
 *
 * @module tests/unit/src/lib/components/ui/chip/chip.test
 */

import { Chip } from '@/lib/components/ui/chip';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Chip', () => {
  it('renders the label', () => {
    render(<Chip label='Sample' />);
    expect(screen.getByText('Sample')).toBeInTheDocument();
  });

  it('invokes onClick when interactive', () => {
    const onClick = vi.fn();
    render(<Chip label='Click me' onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('invokes onRemove without bubbling to onClick', () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();
    render(
      <Chip
        label='Removable'
        variant='boon'
        onClick={onClick}
        onRemove={onRemove}
        removeLabel='remove-it'
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'remove-it' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });
});
