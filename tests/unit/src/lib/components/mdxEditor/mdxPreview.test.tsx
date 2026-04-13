/**
 * @fileoverview Unit Tests — MdxPreview
 * @description Validates rendering states of the live MDX preview panel.
 *
 * @module tests/unit/lib/components/mdxEditor/mdxPreview
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCompile = vi.hoisted(() => vi.fn());

vi.mock('@/lib/components/mdx/compileMdxToComponent', () => ({
  compileMdxToComponent: mockCompile,
}));

vi.mock('@/lib/components/mdx', () => ({
  default: {},
}));

vi.mock('@/lib/components/mdxEditor/mdxEditor.module.scss', () => ({
  default: {
    previewLoading: 'previewLoading',
    previewFadeIn: 'previewFadeIn',
    previewEmpty: 'previewEmpty',
  },
}));

vi.mock('@/styles/mdxContent.module.scss', () => ({
  default: {
    mdxContent: 'mdxContent',
  },
}));

import { MdxPreview } from '@/lib/components/mdxEditor/mdxPreview';

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  cleanup();
  vi.clearAllMocks();
});

describe('MdxPreview', () => {
  it('renders without crashing with empty source', async () => {
    await act(async () => {
      render(<MdxPreview source='' />);
    });

    expect(document.body.innerHTML).toBeTruthy();
  });

  it('shows no compiled content immediately when source is empty', async () => {
    await act(async () => {
      render(<MdxPreview source='' />);
    });

    expect(mockCompile).not.toHaveBeenCalled();
  });

  it('triggers compilation after debounce for non-empty source', async () => {
    vi.useFakeTimers();
    mockCompile.mockResolvedValue(() => (
      <div data-testid='compiled'>hello</div>
    ));

    render(<MdxPreview source='# Hello' />);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});

    expect(mockCompile).toHaveBeenCalledWith('# Hello');
  });

  it('renders compiled content after flush', async () => {
    vi.useFakeTimers();
    mockCompile.mockResolvedValue(() => (
      <div data-testid='compiled-output'>Result</div>
    ));

    render(<MdxPreview source='# Content' />);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});

    expect(screen.getByTestId('compiled-output')).toBeDefined();
  });

  it('does not compile when source is only whitespace', async () => {
    await act(async () => {
      render(<MdxPreview source='   \n  ' />);
    });

    expect(mockCompile).not.toHaveBeenCalled();
  });
});
