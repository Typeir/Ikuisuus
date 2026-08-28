/**
 * @fileoverview SidebarLeafRow Tests
 * @description Covers the link-only leaf markup contract: locale-prefixed
 * href, hover-prefetch link semantics, and the label-free structure the
 * sidebar stylesheet keys leaf styling on.
 *
 * @module tests/unit/src/modules/navigation-sidebar/presentation/components/SidebarLeafRow
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering and queries
 * @requires @/modules/navigation-sidebar/presentation/components/SidebarLeafRow Module under test
 */

import { SidebarLeafRow } from '@/modules/navigation-sidebar/presentation/components/SidebarLeafRow';
import type { LayoutItem } from '@/modules/navigation-sidebar/domain/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const leaf: LayoutItem = {
  name: 'Animate Dead',
  path: 'spells/animate-dead',
  expandedHeight: 52,
};

describe('SidebarLeafRow', () => {
  it('renders a locale-prefixed library link with the item name', () => {
    render(
      <ul>
        <SidebarLeafRow item={leaf} locale='en' />
      </ul>,
    );

    const link = screen.getByRole('link', { name: 'Animate Dead' });
    expect(link).toHaveAttribute('href', '/en/library/spells/animate-dead');
    expect(link).toHaveAttribute('title', 'Animate Dead');
  });

  it('renders a list item holding only the link, with no folder label', () => {
    const { container } = render(
      <ul>
        <SidebarLeafRow item={leaf} locale='en' />
      </ul>,
    );

    const li = container.querySelector('li');
    expect(li).not.toBeNull();
    expect(li).toHaveClass('ml-4');
    expect(li?.children).toHaveLength(1);
    expect(li?.firstElementChild?.tagName).toBe('A');
    expect(li?.querySelector('p')).toBeNull();
  });
});
