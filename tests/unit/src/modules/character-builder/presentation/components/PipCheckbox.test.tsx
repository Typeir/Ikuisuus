/**
 * @fileoverview PipCheckbox tests
 * @description Verifies the pip renders as a checkbox/radio with the label as its
 * accessible name, reflects the checked state, and calls `onChange` with the
 * negated value on activation.
 *
 * @module tests/unit/src/modules/character-builder/presentation/components/PipCheckbox
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { PipCheckbox } from '@/modules/character-builder/presentation/components/PipCheckbox';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('PipCheckbox', () => {
  it('uses the string label as the accessible name and renders it', () => {
    const onChange = vi.fn();
    render(
      <PipCheckbox checked={false} onChange={onChange} label='Show all spells' />,
    );
    const pip = screen.getByRole('checkbox', { name: 'Show all spells' });
    expect(pip.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText('Show all spells')).toBeTruthy();
    fireEvent.click(pip);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reflects a checked pip and negates on activation', () => {
    const onChange = vi.fn();
    render(<PipCheckbox checked onChange={onChange} ariaLabel='pip' />);
    const pip = screen.getByRole('checkbox', { name: 'pip' });
    expect(pip.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(pip);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('supports the radio role', () => {
    render(
      <PipCheckbox checked onChange={() => undefined} ariaLabel='r' role='radio' />,
    );
    expect(screen.getByRole('radio', { name: 'r' })).toBeTruthy();
  });
});
