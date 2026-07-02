/**
 * @fileoverview FeatureCard Tests
 * @description Smoke tests for the generic feature card component.
 *
 * @module tests/unit/lib/components/characterSheet/builder/featureCard
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { FeatureCard } from '@/modules/character-builder/presentation/builder/featureCard';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/modules/character-builder/presentation/builder/contentExpandBody',
  () => ({
    ContentExpandBody: ({ id }: { id: string }) => (
      <div data-testid='expand-body' data-id={id} />
    ),
  }),
);

describe('FeatureCard', () => {
  const baseProps = {
    label: 'Test Feature',
    selected: false,
    expanded: false,
    onToggle: vi.fn(),
    onExpand: vi.fn(),
    contentType: 'feats' as const,
    contentSlug: 'test-feat',
    contentKey: 'Test Feature',
    bodyId: 'feature-body-test-feat',
    expandLabel: 'Expand Test Feature',
  };

  it('renders the label and expand button', () => {
    render(<FeatureCard {...baseProps} />);
    expect(screen.getByText('Test Feature')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Expand Test Feature' }),
    ).toBeTruthy();
  });

  it('calls onToggle and onFocus when toggle button clicked', async () => {
    const onToggle = vi.fn();
    const onFocus = vi.fn();
    render(
      <FeatureCard {...baseProps} onToggle={onToggle} onFocus={onFocus} />,
    );
    await userEvent.click(screen.getByText('Test Feature'));
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onExpand and onFocus when expand button clicked', async () => {
    const onExpand = vi.fn();
    const onFocus = vi.fn();
    render(
      <FeatureCard {...baseProps} onExpand={onExpand} onFocus={onFocus} />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Expand Test Feature' }),
    );
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it('marks toggle button as aria-disabled when readOnly', () => {
    render(<FeatureCard {...baseProps} readOnly />);
    expect(screen.getByText('Test Feature').closest('button')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('renders badge when provided', () => {
    render(<FeatureCard {...baseProps} badge='3 BP' />);
    expect(screen.getByText('3 BP')).toBeTruthy();
  });

  it('renders expand body when expanded', () => {
    render(<FeatureCard {...baseProps} expanded />);
    expect(screen.getByTestId('expand-body')).toBeTruthy();
  });

  it('applies selected class when selected', () => {
    const { container } = render(<FeatureCard {...baseProps} selected />);
    const li = container.querySelector('li');
    expect(li?.className).toContain('boonSelected');
  });
});
