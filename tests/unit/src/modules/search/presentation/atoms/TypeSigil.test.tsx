/**
 * @fileoverview TypeSigil Atom Unit Tests
 * @module tests/unit/src/modules/search/presentation/atoms/TypeSigil.test
 */

import { SEARCH_CONTENT_TYPES } from '@/modules/search/domain';
import { TypeSigil } from '@/modules/search/presentation/atoms/TypeSigil';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('TypeSigil', () => {
  for (const type of SEARCH_CONTENT_TYPES) {
    it(`should render for type: ${type}`, () => {
      const { container } = render(<TypeSigil type={type} />);
      const sigil = container.querySelector('[aria-hidden="true"]');
      expect(sigil).toBeTruthy();
    });
  }
});
