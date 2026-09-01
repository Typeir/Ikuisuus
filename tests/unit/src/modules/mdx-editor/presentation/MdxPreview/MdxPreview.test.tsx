/**
 * @fileoverview Unit Tests — MdxPreview
 * @description Validates rendering states of the live MDX preview panel.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/MdxPreview/MdxPreview.test
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCompile = vi.hoisted(() => vi.fn());

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

vi.mock('@/modules/library/infrastructure/compile/compileRuntime', () => ({
  compileRuntime: mockCompile,
}));

vi.mock('@/modules/library/presentation/components', () => ({
  default: {},
}));

vi.mock('@/modules/library/presentation/components/Keyword', () => ({
  default: () => null,
}));

vi.mock('@/modules/mdx-editor/presentation/MdxEditor/MdxEditor.module.scss', () => ({
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

import {
  MdxPreview,
  splitFrontmatter,
} from '@/modules/mdx-editor/presentation/MdxPreview/MdxPreview';

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
    mockCompile.mockResolvedValue({
      content: <div data-testid='compiled'>hello</div>,
    });

    render(<MdxPreview source='# Hello' />);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});

    expect(mockCompile).toHaveBeenCalledWith(
      expect.objectContaining({ source: '# Hello', skipCache: true }),
    );
  });

  it('renders compiled content after flush', async () => {
    vi.useFakeTimers();
    mockCompile.mockResolvedValue({
      content: <div data-testid='compiled-output'>Result</div>,
    });

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

  it('strips frontmatter from the compiled body and shows it separately', async () => {
    vi.useFakeTimers();
    mockCompile.mockResolvedValue({
      content: <div data-testid='compiled-output'>Result</div>,
    });

    render(
      <MdxPreview source={'---\ncontentType: spells\n---\n\n# Content\n'} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});

    expect(mockCompile).toHaveBeenCalledWith(
      expect.objectContaining({ source: '\n# Content\n' }),
    );
    expect(screen.getByLabelText('Frontmatter').textContent).toContain(
      'contentType: spells',
    );
  });

  it('does not compile a frontmatter-only buffer', async () => {
    await act(async () => {
      render(<MdxPreview source={'---\ncontentType: spells\n---\n'} />);
    });

    expect(mockCompile).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Frontmatter')).toBeDefined();
  });
});

describe('splitFrontmatter', () => {
  it('splits fenced YAML from the body', () => {
    const { yaml, body } = splitFrontmatter('---\na: 1\n---\n# X\n');
    expect(yaml).toBe('a: 1');
    expect(body).toBe('# X\n');
  });

  it('passes sources without frontmatter through untouched', () => {
    const { yaml, body } = splitFrontmatter('# X\n');
    expect(yaml).toBeNull();
    expect(body).toBe('# X\n');
  });
});
