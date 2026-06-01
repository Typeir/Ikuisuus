/**
 * @fileoverview Unit Tests — FlexRenderer
 * @description Validates FlexRenderer render output and child layout behavior.
 *
 * @module tests/unit/lib/components/mdx/flexRenderer
 */

import Component from '@/modules/library/presentation/components/FlexRenderer';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => cleanup());

describe('FlexRenderer', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(<Component>test</Component>);
    }).not.toThrow();
  });

  it('renders children inside the flex container', () => {
    render(
      <Component>
        <span>child one</span>
        <span>child two</span>
      </Component>,
    );

    expect(screen.getByText('child one')).toBeDefined();
    expect(screen.getByText('child two')).toBeDefined();
  });

  it('renders a containing div', () => {
    const { container } = render(<Component>content</Component>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('sets display flex style on the container', () => {
    const { container } = render(<Component>content</Component>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.display).toBe('flex');
  });

  it('sets flex direction to row', () => {
    const { container } = render(
      <Component>
        <span>a</span>
      </Component>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div.style.flexDirection).toBe('row');
  });

  it('renders string children', () => {
    render(<Component>Hello World</Component>);
    expect(screen.getByText('Hello World')).toBeDefined();
  });
});
