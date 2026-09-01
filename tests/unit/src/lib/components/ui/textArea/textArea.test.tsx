/**
 * @fileoverview Unit tests for TextArea component
 * @description Verifies rendering, onChange, disabled, readOnly, rows, and ariaLabel.
 *
 * @module tests/unit/src/lib/components/ui/textArea/textArea.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { TextArea } from '@/lib/components/ui/textArea';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('TextArea', () => {
  it('renders with the given value', () => {
    render(
      <TextArea value='notes here' onChange={vi.fn()} ariaLabel='notes' />,
    );
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
      'notes here',
    );
  });

  it('calls onChange with the new string value', async () => {
    const onChange = vi.fn();
    render(<TextArea value='' onChange={onChange} ariaLabel='notes' />);
    await userEvent.type(screen.getByRole('textbox'), 'x');
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('is disabled when disabled prop is true', () => {
    render(<TextArea value='' onChange={vi.fn()} disabled ariaLabel='notes' />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(
      true,
    );
  });

  it('is readOnly when readOnly prop is true', () => {
    render(
      <TextArea value='locked' onChange={vi.fn()} readOnly ariaLabel='notes' />,
    );
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).readOnly).toBe(
      true,
    );
  });

  it('applies ariaLabel to the textarea', () => {
    render(
      <TextArea value='' onChange={vi.fn()} ariaLabel='background story' />,
    );
    expect(
      screen.getByRole('textbox', { name: 'background story' }),
    ).toBeDefined();
  });

  it('sets rows attribute', () => {
    render(<TextArea value='' onChange={vi.fn()} rows={5} ariaLabel='notes' />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).rows).toBe(5);
  });
});
