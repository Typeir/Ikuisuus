/**
 * TODO: Add comprehensive tests for flexRenderer.tsx
 * This file contains only smoke tests. Additional test coverage needed for:
 * - User interactions
 * - Edge cases
 * - Integration scenarios
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Component from '@/lib/components/mdx/flexRenderer';

describe('flexRenderer', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<Component />);
    }).not.toThrow();
  });
});
