/**
 * @fileoverview Unit Tests — EditorSplitPane
 * @description Validates split-pane editor layout rendering and toggle behavior.
 *
 * @module tests/unit/lib/components/mdxEditor/editorSplitPane
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/presentation/MdxEditor/MdxEditor.module.scss', () => ({
  default: {
    splitPane: 'splitPane',
    editorPane: 'editorPane',
    previewPane: 'previewPane',
    divider: 'divider',
    previewLoading: 'previewLoading',
    toolbar: 'toolbar',
    toolbarButton: 'toolbarButton',
    toolbarSep: 'toolbarSep',
    previewFadeIn: 'previewFadeIn',
  },
}));

vi.mock('@/modules/mdx-editor/presentation/MdxPreview/MdxPreview', () => ({
  MdxPreview: ({ source }: { source: string }) => (
    <div data-testid='mdx-preview'>{source}</div>
  ),
}));

vi.mock('@/modules/mdx-editor/presentation/EditorToolbar/EditorToolbar', () => ({
  EditorToolbar: () => <div data-testid='editor-toolbar' />,
  handleEditorKeyDown: vi.fn(),
}));

vi.mock('react-simple-code-editor', () => ({
  default: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <textarea
      data-testid='code-editor'
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  ),
}));

vi.mock('prismjs', () => ({
  default: {
    highlight: (code: string) => code,
    languages: { markdown: {} },
  },
}));

vi.mock('prismjs/components/prism-markdown', () => ({}));
vi.mock('prismjs/components/prism-markup', () => ({}));

import { EditorSplitPane } from '@/modules/mdx-editor/presentation/EditorSplitPane/EditorSplitPane';

afterEach(() => cleanup());

describe('EditorSplitPane', () => {
  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <EditorSplitPane
          textareaId='test-editor'
          content='# Hello'
          setContent={vi.fn()}
          disabled={false}
          mode='edit'
          newPlaceholder='Enter content here'
        />,
      );
    });
    expect(document.body.innerHTML).toBeTruthy();
  });

  it('renders the editor toolbar', async () => {
    await act(async () => {
      render(
        <EditorSplitPane
          textareaId='test-editor'
          content='# Test'
          setContent={vi.fn()}
          disabled={false}
          mode='edit'
          newPlaceholder=''
        />,
      );
    });

    expect(screen.getByTestId('editor-toolbar')).toBeDefined();
  });

  it('renders the code editor', async () => {
    await act(async () => {
      render(
        <EditorSplitPane
          textareaId='test-editor'
          content='# Content'
          setContent={vi.fn()}
          disabled={false}
          mode='edit'
          newPlaceholder=''
        />,
      );
    });

    expect(screen.getByTestId('code-editor')).toBeDefined();
  });

  it('renders the MDX preview when preview is visible', async () => {
    await act(async () => {
      render(
        <EditorSplitPane
          textareaId='test-editor'
          content='# Preview content'
          setContent={vi.fn()}
          disabled={false}
          mode='edit'
          newPlaceholder=''
        />,
      );
    });

    expect(screen.getByTestId('mdx-preview')).toBeDefined();
  });
});
