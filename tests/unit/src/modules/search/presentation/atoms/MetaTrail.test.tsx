/**
 * @fileoverview MetaTrail Atom Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/MetaTrail.test
 */

import { MetaTrail } from '@/modules/search/presentation/atoms/MetaTrail';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MetaTrail', () => {
  it('should render chips from meta fields', () => {
    render(
      <MetaTrail
        meta={{ cr: '10', school: 'Evocation', tags: 'fire, dragon' }}
      />,
    );
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('EVOCATION')).toBeTruthy();
    expect(screen.getByText('FIRE')).toBeTruthy();
    expect(screen.getByText('DRAGON')).toBeTruthy();
  });

  it('should return null when meta is empty', () => {
    const { container } = render(<MetaTrail meta={{}} />);
    expect(
      container.querySelector('[aria-label="Matched metadata"]'),
    ).toBeNull();
  });
});
