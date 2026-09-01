/**
 * @fileoverview CounterChip tests
 * @description Verifies the floating counter pill renders its text with a status
 * role when count > 0 and renders nothing when count <= 0.
 *
 * @module tests/unit/src/modules/character-builder/presentation/atoms/counterChip.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { CounterChip } from '@/modules/character-builder/presentation/atoms/counterChip';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('CounterChip', () => {
  it('renders the text with a status role when count > 0', () => {
    const { getByRole } = render(
      <CounterChip
        count={3}
        text='3 unspent proficiencies'
        ariaLabel='Unspent skill proficiencies'
      />,
    );
    const status = getByRole('status');
    expect(status.textContent).toBe('3 unspent proficiencies');
    expect(status.getAttribute('aria-label')).toBe(
      'Unspent skill proficiencies',
    );
  });

  it('renders nothing when count <= 0', () => {
    const { container } = render(
      <CounterChip count={0} text='0' ariaLabel='none' />,
    );
    expect(container.firstChild).toBeNull();
  });
});
