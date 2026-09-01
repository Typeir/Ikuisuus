/**
 * @fileoverview SearchField Unit Tests
 * @description Tests value rendering, both change paths, and the hint chip.
 *
 * @module tests/unit/src/modules/search/presentation/SearchField/SearchField.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { SearchField } from '@/modules/search/presentation/SearchField/SearchField';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => cleanup());

describe('SearchField', () => {
  it('renders the value and placeholder', () => {
    render(
      <SearchField value='fire' onChange={vi.fn()} placeholder='Search…' />,
    );

    const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;
    expect(input.value).toBe('fire');
  });

  it('reports changes through onChange and inputProps.onChange', () => {
    const onChange = vi.fn();
    const rawChange = vi.fn();
    render(
      <SearchField
        value=''
        onChange={onChange}
        placeholder='Search…'
        inputProps={{ onChange: rawChange }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Search…'), {
      target: { value: 'frost' },
    });

    expect(onChange).toHaveBeenCalledWith('frost');
    expect(rawChange).toHaveBeenCalledTimes(1);
  });

  it('renders the hint chip when given', () => {
    render(<SearchField value='' hint='Ctrl+K' ariaLabel='Search' />);

    expect(screen.getByText('Ctrl+K')).toBeDefined();
    expect(screen.getByLabelText('Search')).toBeDefined();
  });
});
