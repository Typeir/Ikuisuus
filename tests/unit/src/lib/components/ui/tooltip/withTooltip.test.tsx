/**
 * @fileoverview withTooltip HOC Tests
 * @description Unit tests for the withTooltip higher-order component.
 *
 * @module tests/unit/src/lib/components/ui/tooltip/withTooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { withTooltip } from '@/lib/components/ui/tooltip/withTooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

/**
 * Simple button used as the wrapped component under test.
 *
 * @component
 * @param {{ label: string }} props - Component props
 * @returns {JSX.Element} A button rendering the label
 */
const Button: React.FC<{ label: string }> = ({ label }) => (
  <button type='button'>{label}</button>
);
Button.displayName = 'Button';

describe('withTooltip', () => {
  it('renders the wrapped component and forwards its props', () => {
    const Wrapped = withTooltip(Button);
    render(<Wrapped label='Save' tooltip='Persist changes' />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('does not show the tooltip content until the trigger is hovered', async () => {
    const user = userEvent.setup();
    const Wrapped = withTooltip(Button);
    render(<Wrapped label='Save' tooltip='Persist changes' />);

    expect(screen.queryByText('Persist changes')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Persist changes')).toBeInTheDocument();
  });

  it('derives a display name from the wrapped component', () => {
    expect(withTooltip(Button).displayName).toBe('WithTooltip(Button)');
  });

  it('falls back to Component when the wrapped component is anonymous', () => {
    const Anonymous = (() => <span />) as React.FC;
    Object.defineProperty(Anonymous, 'name', { value: '' });
    expect(withTooltip(Anonymous).displayName).toBe('WithTooltip(Component)');
  });

  it('renders without a tooltip prop', () => {
    const Wrapped = withTooltip(Button);
    render(<Wrapped label='Plain' />);
    expect(screen.getByRole('button', { name: 'Plain' })).toBeInTheDocument();
  });
});
