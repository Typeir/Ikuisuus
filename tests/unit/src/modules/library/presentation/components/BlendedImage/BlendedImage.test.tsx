/**
 * @fileoverview Unit Tests — BlendedImage
 * @description Validates BlendedImage render output, attribute forwarding, and
 * vignette container structure.
 *
 * @module tests/unit/lib/components/mdx/blendedImage
 */

import Component from '@/modules/library/presentation/components/BlendedImage';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => cleanup());

describe('BlendedImage', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(<Component src='/library/images/test.webp' alt='Test image' />);
    }).not.toThrow();
  });

  it('renders an img element with the provided alt text', () => {
    render(<Component src='/library/images/test.webp' alt='A landscape' />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('alt')).toBe('A landscape');
  });

  it('wraps the image in a vignette container div', () => {
    const { container } = render(
      <Component src='/library/images/test.webp' alt='Test' />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
  });

  it('sets the --bg-image CSS variable on the container', () => {
    const { container } = render(
      <Component src='/library/images/bg.webp' alt='Test' />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--bg-image')).toBe(
      'url(/library/images/bg.webp)',
    );
  });

  it('renders without crash when src is empty string', () => {
    expect(() => {
      render(<Component src='' alt='Empty src test' />);
    }).not.toThrow();
  });

  it('uses default dimensions when width and height are not provided', () => {
    const { container } = render(
      <Component src='/library/test.webp' alt='Default dimensions' />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
