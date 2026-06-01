/**
 * @fileoverview Unit Tests — EditorFooter
 * @description Validates status message rendering and submit button behavior
 * across all editor lifecycle phases.
 *
 * @module tests/unit/lib/components/mdxEditor/editorFooter
 */

import { EditorFooter } from '@/modules/mdx-editor/presentation/EditorFooter/EditorFooter';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/presentation/MdxEditor/MdxEditor.module.scss', () => ({
  default: {
    footer: 'footer',
    statusText: 'statusText',
    statusSuccess: 'statusSuccess',
    statusError: 'statusError',
    submitButton: 'submitButton',
  },
}));

afterEach(() => cleanup());

/** Default translation stub */
const t = (key: string) => key;

describe('EditorFooter', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(
        <EditorFooter
          status={{ phase: 'idle' }}
          mode='edit'
          canSubmit={false}
          handleSubmit={vi.fn()}
          t={t}
        />,
      );
    }).not.toThrow();
  });

  it('shows submitting text when phase is submitting', () => {
    render(
      <EditorFooter
        status={{ phase: 'submitting' }}
        mode='edit'
        canSubmit={false}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('submitting')).toBeDefined();
  });

  it('shows success message with PR link when phase is success', () => {
    render(
      <EditorFooter
        status={{ phase: 'success', prUrl: 'https://github.com/pr/1' }}
        mode='edit'
        canSubmit={false}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('success')).toBeDefined();
    const link = screen.getByRole('link', { name: 'viewPr' });
    expect(link.getAttribute('href')).toBe('https://github.com/pr/1');
  });

  it('shows error message when phase is error', () => {
    render(
      <EditorFooter
        status={{ phase: 'error', message: 'Something went wrong' }}
        mode='edit'
        canSubmit={true}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('shows resolved path when phase is ready', () => {
    render(
      <EditorFooter
        status={{
          phase: 'ready',
          sha: 'abc123',
          resolvedPath: '/content/en/monsters/goblin.mdx',
        }}
        mode='edit'
        canSubmit={true}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('/content/en/monsters/goblin.mdx')).toBeDefined();
  });

  it('shows new file mode text when phase is new', () => {
    render(
      <EditorFooter
        status={{ phase: 'new' }}
        mode='new'
        canSubmit={true}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('newFileMode')).toBeDefined();
  });

  it('disables submit button when canSubmit is false', () => {
    render(
      <EditorFooter
        status={{ phase: 'idle' }}
        mode='edit'
        canSubmit={false}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    const btn = screen.getByRole('button', { name: 'submitEdit' });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls handleSubmit when submit button is clicked', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <EditorFooter
        status={{ phase: 'ready', sha: 'x', resolvedPath: '/test.mdx' }}
        mode='edit'
        canSubmit={true}
        handleSubmit={handleSubmit}
        t={t}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'submitEdit' }));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('shows submitNew label in new mode', () => {
    render(
      <EditorFooter
        status={{ phase: 'new' }}
        mode='new'
        canSubmit={true}
        handleSubmit={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByRole('button', { name: 'submitNew' })).toBeDefined();
  });
});
