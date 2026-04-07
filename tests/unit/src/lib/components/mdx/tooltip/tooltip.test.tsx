/**
 * @fileoverview Unit tests for Tooltip MDX component
 * @module tests/unit/src/lib/components/mdx/tooltip/tooltip.test
 * @description Validates Tooltip rendering, hover/focus interaction, portal
 * rendering, position calculation, and accessibility attributes.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/mdx/tooltip/tooltip
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

import Tooltip from '@/lib/components/mdx/tooltip/tooltip';

describe('Tooltip', () => {
  it('renders trigger content', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Tooltip body</span>
      </Tooltip>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders tooltip bubble with role=tooltip', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('sets data-open=false when not hovered', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });

  it('sets data-open=true on mouseEnter', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('[tabindex]')!;
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
  });

  it('sets data-open=false on mouseLeave', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('[tabindex]')!;
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });

  it('sets data-open=true on focus', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('[tabindex]')!;
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
  });

  it('sets data-open=false on blur', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('[tabindex]')!;
    fireEvent.focus(trigger);
    fireEvent.blur(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-open', 'false');
  });

  it('has aria-describedby linking trigger to tooltip', () => {
    render(
      <Tooltip>
        <span>Label</span>
        <span>Description</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Label').closest('[aria-describedby]')!;
    const tooltipId = trigger.getAttribute('aria-describedby');
    expect(tooltipId).toBeTruthy();
    expect(screen.getByRole('tooltip').id).toBe(tooltipId);
  });

  it('renders fallback wrapper if only one child', () => {
    render(
      <Tooltip>
        <span>Only one</span>
      </Tooltip>,
    );
    expect(screen.getByText('Only one')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('filters out whitespace-only string children', () => {
    render(
      <Tooltip>
        {'  '}
        <span>Trigger</span>
        {'  '}
        <span>Body</span>
        {'  '}
      </Tooltip>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
