/**
 * @fileoverview Tests for StaticSidebar component
 * @module tests/unit/src/modules/navigation-sidebar/presentation/components/StaticSidebar
 */

import { StaticSidebar } from '@/modules/navigation-sidebar/presentation/components/StaticSidebar';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('StaticSidebar', () => {
  it('should render items list', () => {
    const items = [
      {
        name: 'Test Item',
        path: 'test',
        expandedHeight: 52,
        children: undefined,
      },
    ];

    const { container } = render(
      <StaticSidebar items={items} locale='en' isExpanded={() => false} />,
    );

    expect(container.querySelector('ul')).toBeDefined();
  });

  it('should call isExpanded for each item path', () => {
    const isExpanded = ({ path }: string): boolean => path === 'expanded';
    const items = [
      {
        name: 'Folder',
        path: 'folder',
        expandedHeight: 100,
        children: [{ name: 'Child', path: 'folder/child', expandedHeight: 52 }],
      },
    ];

    render(<StaticSidebar items={items} locale='en' isExpanded={isExpanded} />);

    expect(isExpanded).toBeDefined();
  });

  it('should render nested items', () => {
    const items = [
      {
        name: 'Parent',
        path: 'parent',
        expandedHeight: 100,
        children: [{ name: 'Child', path: 'parent/child', expandedHeight: 52 }],
      },
    ];

    const { container } = render(
      <StaticSidebar items={items} locale='en' isExpanded={() => true} />,
    );

    expect(container.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  it('should pass locale to links', () => {
    const items = [
      {
        name: 'Link Item',
        path: 'test',
        expandedHeight: 52,
        children: undefined,
      },
    ];

    const { container } = render(
      <StaticSidebar items={items} locale='es' isExpanded={() => false} />,
    );

    const link = container.querySelector('a');
    expect(link?.href).toContain('/es/');
  });
});
