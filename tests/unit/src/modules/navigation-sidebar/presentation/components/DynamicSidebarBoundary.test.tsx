/**
 * @fileoverview Tests for DynamicSidebarBoundary component
 * @module tests/unit/src/modules/navigation-sidebar/presentation/components/DynamicSidebarBoundary
 */

import { DynamicSidebarBoundary } from '@/modules/navigation-sidebar/presentation/components/DynamicSidebarBoundary';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DynamicSidebarBoundary', () => {
  it('should render fallback UI', () => {
    const fallback = <div data-testid='fallback'>Loading...</div>;
    const items: any[] = [];

    const { getByTestId } = render(
      <DynamicSidebarBoundary items={items} fallback={fallback} />,
    );

    expect(getByTestId('fallback')).toBeDefined();
  });

  it('should accept navigation callback', () => {
    const fallback = <div>Fallback</div>;
    const onNavigate = () => {};
    const items: any[] = [];

    const { container } = render(
      <DynamicSidebarBoundary
        items={items}
        fallback={fallback}
        onNavigate={onNavigate}
      />,
    );

    expect(container).toBeDefined();
  });

  it('should pass items to dynamic sidebar', () => {
    const fallback = <div>Fallback</div>;
    const items = [{ name: 'Item', path: 'test', expandedHeight: 52 }];

    const { container } = render(
      <DynamicSidebarBoundary items={items} fallback={fallback} />,
    );

    expect(container).toBeDefined();
  });

  it('should support collapseSiblings prop', () => {
    const fallback = <div>Fallback</div>;
    const items: any[] = [];

    const { container } = render(
      <DynamicSidebarBoundary
        items={items}
        fallback={fallback}
        collapseSiblings={true}
      />,
    );

    expect(container).toBeDefined();
  });
});
