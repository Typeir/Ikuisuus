/**
 * @fileoverview Unit tests for ClientProviders wrapper component
 * @description Tests for client-only provider composition in layout
 *
 * @module tests/unit/app/[locale]/ClientProviders
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @testing-library/react - React testing utilities
 * @requires @/app/[locale]/ClientProviders - Component under test
 */

import ClientProviders from '@/app/[locale]/ClientProviders';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock ResponsiveLayoutShell
vi.mock('@/app/[locale]/utils/responsiveLayoutShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='responsive-layout-shell'>{children}</div>
  ),
}));

describe('ClientProviders', () => {
  const mockTree = [
    { path: '/test/path1', name: 'item1' },
    { path: '/test/path2', name: 'item2' },
  ];

  const mockMessages = {
    common: { test: 'Test' },
    layout: { title: 'Title' },
  };

  const mockExpandedPaths = ['monsters', 'monsters/dragons'];

  it('should render without crashing', () => {
    expect(() => {
      render(
        <ClientProviders
          locale='en'
          tree={mockTree}
          messages={mockMessages}
          initialExpandedPaths={mockExpandedPaths}>
          <div>Test Content</div>
        </ClientProviders>
      );
    }).not.toThrow();
  });

  it('should render children', () => {
    render(
      <ClientProviders
        locale='en'
        tree={mockTree}
        messages={mockMessages}
        initialExpandedPaths={mockExpandedPaths}>
        <div>Test Child Content</div>
      </ClientProviders>
    );

    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('should wrap children in ResponsiveLayoutShell', () => {
    render(
      <ClientProviders
        locale='en'
        tree={mockTree}
        messages={mockMessages}
        initialExpandedPaths={mockExpandedPaths}>
        <div>Content</div>
      </ClientProviders>
    );

    expect(screen.getByTestId('responsive-layout-shell')).toBeInTheDocument();
  });

  it('should accept locale prop', () => {
    const { rerender } = render(
      <ClientProviders
        locale='en'
        tree={mockTree}
        messages={mockMessages}
        initialExpandedPaths={mockExpandedPaths}>
        <div>Content</div>
      </ClientProviders>
    );

    expect(() => {
      rerender(
        <ClientProviders
          locale='es'
          tree={mockTree}
          messages={mockMessages}
          initialExpandedPaths={mockExpandedPaths}>
          <div>Content</div>
        </ClientProviders>
      );
    }).not.toThrow();
  });

  it('should accept tree prop', () => {
    const alternateTree = [{ path: '/other/path', name: 'other' }];

    expect(() => {
      render(
        <ClientProviders
          locale='en'
          tree={alternateTree}
          messages={mockMessages}
          initialExpandedPaths={mockExpandedPaths}>
          <div>Content</div>
        </ClientProviders>
      );
    }).not.toThrow();
  });

  it('should handle empty tree', () => {
    expect(() => {
      render(
        <ClientProviders
          locale='en'
          tree={[]}
          messages={mockMessages}
          initialExpandedPaths={mockExpandedPaths}>
          <div>Content</div>
        </ClientProviders>
      );
    }).not.toThrow();
  });

  it('should handle multiple children', () => {
    render(
      <ClientProviders
        locale='en'
        tree={mockTree}
        messages={mockMessages}
        initialExpandedPaths={mockExpandedPaths}>
        <div>Child 1</div>
        <div>Child 2</div>
      </ClientProviders>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should handle empty initialExpandedPaths', () => {
    expect(() => {
      render(
        <ClientProviders
          locale='en'
          tree={mockTree}
          messages={mockMessages}
          initialExpandedPaths={[]}>
          <div>Content</div>
        </ClientProviders>
      );
    }).not.toThrow();
  });
});
