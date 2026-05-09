/**
 * @fileoverview Unit tests for GradientTabs component
 * @module tests/unit/src/lib/components/ui/gradientTabs/gradientTabs.test
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { GradientTabs } from '@/lib/components/ui/gradientTabs/gradientTabs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** @type {import('@/lib/components/ui/gradientTabs/gradientTabs').GradientTabItem[]} */
const tabs = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma', disabled: true },
];

const panels = {
  alpha: <p>alpha content</p>,
  beta: <p>beta content</p>,
  gamma: <p>gamma content</p>,
};

describe('GradientTabs', () => {
  it('renders all tab buttons', () => {
    render(
      <GradientTabs
        tabs={tabs}
        activeTab='alpha'
        onChange={vi.fn()}
        panels={panels}
      />,
    );

    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('calls onChange with the tab value when clicked', () => {
    const onChange = vi.fn();
    render(
      <GradientTabs
        tabs={tabs}
        activeTab='alpha'
        onChange={onChange}
        panels={panels}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));

    expect(onChange).toHaveBeenCalledWith('beta');
  });

  it('does not call onChange when a disabled tab is clicked', () => {
    const onChange = vi.fn();
    render(
      <GradientTabs
        tabs={tabs}
        activeTab='alpha'
        onChange={onChange}
        panels={panels}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gamma' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders the active panel content', () => {
    render(
      <GradientTabs
        tabs={tabs}
        activeTab='beta'
        onChange={vi.fn()}
        panels={panels}
      />,
    );

    expect(screen.getByText('beta content')).toBeInTheDocument();
    expect(screen.queryByText('alpha content')).not.toBeInTheDocument();
  });

  it('renders children when panels is not provided', () => {
    render(
      <GradientTabs tabs={tabs} activeTab='alpha' onChange={vi.fn()}>
        <p>child content</p>
      </GradientTabs>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
