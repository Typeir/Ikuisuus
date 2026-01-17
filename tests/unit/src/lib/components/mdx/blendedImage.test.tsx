/**
 * TODO: Add comprehensive tests for blendedImage.tsx
 * This file contains only smoke tests. Additional test coverage needed for:
 * - User interactions
 * - Edge cases
 * - Integration scenarios
 */

import Component from '@/lib/components/mdx/blendedImage';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('blendedImage', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<Component src='/library/images/test.webp' alt='Test image' />);
    }).not.toThrow();
  });
});
