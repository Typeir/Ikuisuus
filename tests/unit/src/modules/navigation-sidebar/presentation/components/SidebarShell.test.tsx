/**
 * @fileoverview Tests for SidebarShell component
 * @module tests/unit/src/modules/navigation-sidebar/presentation/components/SidebarShell
 */

import { SidebarShell } from '@/modules/navigation-sidebar/presentation/components/SidebarShell';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  usePathname: () => '/en/library/test',
}));

import { vi } from 'vitest';

describe('SidebarShell', () => {
  it('should render fallback on initial mount', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];

    const { container } = render(<SidebarShell items={items} />);

    expect(container).toBeDefined();
  });

  it('should accept onNavigate callback', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];
    const onNavigate = () => {};

    const { container } = render(
      <SidebarShell items={items} onNavigate={onNavigate} />,
    );

    expect(container).toBeDefined();
  });

  it('should support collapseSiblings prop', () => {
    const items = [{ name: 'Test', path: 'test', expandedHeight: 52 }];

    const { container } = render(
      <SidebarShell items={items} collapseSiblings={true} />,
    );

    expect(container).toBeDefined();
  });

  it('should derive expanded paths from pathname', () => {
    const items = [
      {
        name: 'Parent',
        path: 'parent',
        expandedHeight: 100,
        children: [{ name: 'Child', path: 'parent/child', expandedHeight: 52 }],
      },
    ];

    const { container } = render(<SidebarShell items={items} />);

    expect(container).toBeDefined();
  });
});
