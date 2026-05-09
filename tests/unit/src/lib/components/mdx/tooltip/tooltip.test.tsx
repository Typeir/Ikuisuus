/**
 * @fileoverview Unit tests for Tooltip MDX component
 * @module tests/unit/src/lib/components/mdx/tooltip/tooltip.test
 * @description Validates Tooltip MDX wrapper rendering, trigger interaction,
 * and correct defaults for showArrow and showClickIcon.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/mdx/tooltip/tooltip
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Tooltip from '@/lib/components/mdx/tooltip/tooltip';

describe('Tooltip MDX Component', () => {
  it('renders trigger content', () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Tooltip body</span>
      </Tooltip>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('renders tooltip content on hover', async () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Tooltip body</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('span');
    fireEvent.mouseEnter(trigger!);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip content on mouse leave', async () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Tooltip body</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('span');
    fireEvent.mouseEnter(trigger!);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(trigger!);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus', async () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Tooltip body</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('span');
    fireEvent.focus(trigger!);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip on blur', async () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        <span>Tooltip body</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Trigger').closest('span');
    fireEvent.focus(trigger!);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    fireEvent.blur(trigger!);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('renders CircleHelp icon by default', () => {
    const { container } = render(
      <Tooltip>
        <span>Trigger</span>
        <span>Content</span>
      </Tooltip>,
    );
    // Check that the CircleHelp icon is rendered (lucide-react renders SVG)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles missing children gracefully', () => {
    const { container } = render(
      <Tooltip>
        <span>Only trigger</span>
      </Tooltip>,
    );
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('filters empty string children', async () => {
    render(
      <Tooltip>
        <span>Trigger</span>
        {''}
        <span>Tooltip body</span>
      </Tooltip>,
    );
    expect(screen.getByText('Trigger')).toBeInTheDocument();

    const trigger = screen.getByText('Trigger').closest('span');
    fireEvent.mouseEnter(trigger!);

    await waitFor(() => {
      expect(screen.getByText('Tooltip body')).toBeInTheDocument();
    });
  });
});
