/**
 * @fileoverview AspectSuggestions Tests
 * @description Portal listbox rendering, active row and pick.
 *
 * @module tests/unit/src/modules/search/presentation/SearchBar/AspectSuggestions
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { AspectSuggestions } from '@/modules/search/presentation/SearchBar/AspectSuggestions';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(await importOriginal<typeof import('next-intl')>());
});

describe('AspectSuggestions', () => {
  it('should render nothing without an anchor or candidates', () => {
    const anchorRef = { current: null };
    const { container } = render(
      <AspectSuggestions suggestions={['form:blade']} activeIndex={-1} onPick={vi.fn()} anchorRef={anchorRef} />,
    );
    expect(container.querySelector('[role=listbox]')).toBeNull();
    expect(document.body.querySelector('[role=listbox]')).toBeNull();
  });

  it('should portal a listbox of pills under the anchor and report picks', () => {
    const anchor = document.createElement('input');
    document.body.appendChild(anchor);
    const onPick = vi.fn();
    render(
      <AspectSuggestions
        suggestions={['form:blade', 'form:bone']}
        activeIndex={1}
        onPick={onPick}
        anchorRef={{ current: anchor }}
      />,
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.mouseDown(options[0]);
    expect(onPick).toHaveBeenCalledWith(0);
    anchor.remove();
  });
});
