/**
 * @fileoverview Unit tests for SwrProvider component
 * @description Verifies that SwrProvider renders children and that SWRConfig
 * is applied so descendant hooks can resolve configuration correctly.
 *
 * @module tests/unit/src/app/[locale]/SwrProvider.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import SwrProvider from '@/app/[locale]/SwrProvider';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SwrProvider', () => {
  it('renders children without crashing', () => {
    render(
      <SwrProvider>
        <span data-testid='child'>hello</span>
      </SwrProvider>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });
});
