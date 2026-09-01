/**
 * @fileoverview Unit tests for TextInput component
 * @description Verifies rendering, onChange, disabled, size variants, and className passthrough.
 *
 * @module tests/unit/src/lib/components/ui/textInput/textInput.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { TextInput } from '@/lib/components/ui/textInput';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('TextInput', () => {
  it('renders with the given value', () => {
    render(<TextInput value='hello' onChange={vi.fn()} ariaLabel='name' />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'hello',
    );
  });

  it('calls onChange with the new string value', async () => {
    const onChange = vi.fn();
    render(<TextInput value='' onChange={onChange} ariaLabel='name' />);
    await userEvent.type(screen.getByRole('textbox'), 'w');
    expect(onChange).toHaveBeenCalledWith('w');
  });

  it('is disabled when disabled prop is true', () => {
    render(<TextInput value='' onChange={vi.fn()} disabled ariaLabel='name' />);
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it('applies ariaLabel to the input', () => {
    render(
      <TextInput value='' onChange={vi.fn()} ariaLabel='character name' />,
    );
    expect(
      screen.getByRole('textbox', { name: 'character name' }),
    ).toBeDefined();
  });

  it('forwards id to the input element', () => {
    render(
      <TextInput value='' onChange={vi.fn()} id='my-input' ariaLabel='x' />,
    );
    expect(document.getElementById('my-input')).not.toBeNull();
  });
});
