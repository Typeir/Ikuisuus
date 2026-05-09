/**
 * @fileoverview AsyncTooltip Tests
 * @description Verifies lazy content loading, single-fetch behavior, and
 * fallback rendering for the AsyncTooltip component.
 *
 * @module tests/unit/src/lib/components/ui/asyncTooltip/asyncTooltip.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AsyncTooltip } from '@/lib/components/ui/asyncTooltip';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/components/ui/tooltip', () => ({
  Tooltip: ({
    content,
    children,
  }: {
    content: React.ReactNode;
    children: React.ReactElement;
  }) => (
    <div>
      <div data-testid='tooltip-content'>{content}</div>
      {children}
    </div>
  ),
}));

describe('AsyncTooltip', () => {
  it('renders fallback content before hover', () => {
    const fetchContent = vi.fn(() => Promise.resolve('Loaded'));
    render(
      <AsyncTooltip fetchContent={fetchContent} fallback='Loading...'>
        <button type='button'>Hover me</button>
      </AsyncTooltip>,
    );

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Loading...');
    expect(fetchContent).not.toHaveBeenCalled();
  });

  it('fetches content on first mouse enter', async () => {
    const fetchContent = vi.fn(() => Promise.resolve('Fetched content'));
    render(
      <AsyncTooltip fetchContent={fetchContent} fallback='Idle'>
        <button type='button'>Hover me</button>
      </AsyncTooltip>,
    );

    await userEvent.hover(screen.getByText('Hover me'));
    await waitFor(() =>
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
        'Fetched content',
      ),
    );
    expect(fetchContent).toHaveBeenCalledTimes(1);
  });

  it('does not re-fetch on subsequent hovers', async () => {
    const fetchContent = vi.fn(() => Promise.resolve('Fetched content'));
    render(
      <AsyncTooltip fetchContent={fetchContent} fallback='Idle'>
        <button type='button'>Hover me</button>
      </AsyncTooltip>,
    );

    const trigger = screen.getByText('Hover me');
    await userEvent.hover(trigger);
    await waitFor(() =>
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
        'Fetched content',
      ),
    );

    await userEvent.unhover(trigger);
    await userEvent.hover(trigger);

    expect(fetchContent).toHaveBeenCalledTimes(1);
  });

  it('shows fallback on fetch error', async () => {
    const fetchContent = vi.fn(() => Promise.reject(new Error('Network error')));
    render(
      <AsyncTooltip fetchContent={fetchContent} fallback='Fallback text'>
        <button type='button'>Hover me</button>
      </AsyncTooltip>,
    );

    await userEvent.hover(screen.getByText('Hover me'));
    await waitFor(() =>
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
        'Fallback text',
      ),
    );
  });

  it('renders empty string fallback when no fallback provided', () => {
    const fetchContent = vi.fn(() => Promise.resolve('Content'));
    render(
      <AsyncTooltip fetchContent={fetchContent}>
        <button type='button'>Trigger</button>
      </AsyncTooltip>,
    );

    expect(screen.getByTestId('tooltip-content')).toBeEmptyDOMElement();
  });
});
