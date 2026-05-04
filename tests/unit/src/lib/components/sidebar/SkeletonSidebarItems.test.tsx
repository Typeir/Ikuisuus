/**
 * @fileoverview Tests for SkeletonSidebarItems component
 * @module tests/unit/src/lib/components/sidebar/SkeletonSidebarItems
 */

import { SkeletonSidebarItems } from '@/lib/components/sidebar/SkeletonSidebarItems';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SkeletonSidebarItems', () => {
  it('should render default skeleton count', () => {
    render(<SkeletonSidebarItems />);
    const skeletons = document.querySelectorAll('[class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render specified child count', () => {
    render(<SkeletonSidebarItems childCount={3} />);
    const items = document.querySelectorAll('li');
    expect(items.length).toBe(3);
  });

  it('should cap skeleton count at 20', () => {
    render(<SkeletonSidebarItems childCount={50} />);
    const items = document.querySelectorAll('li');
    expect(items.length).toBe(20);
  });

  it('should render as unordered list', () => {
    render(<SkeletonSidebarItems childCount={2} />);
    const list = document.querySelector('ul');
    expect(list).toBeInTheDocument();
  });
});
