/**
 * @fileoverview ResultTitle Atom Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/ResultTitle
 */

import { ResultTitle } from '@/modules/search/presentation/atoms/ResultTitle';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ResultTitle', () => {
  it('should render the title text', () => {
    render(<ResultTitle title='Ancient Dragon' />);
    expect(screen.getByText('Ancient Dragon')).toBeTruthy();
  });
});
