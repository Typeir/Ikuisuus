/**
 * @fileoverview Unit Tests — EditorToolbar
 * @description Validates toolbar button rendering and editor command dispatch.
 *
 * @module tests/unit/lib/components/mdxEditor/editorToolbar
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/presentation/MdxEditor/MdxEditor.module.scss', () => ({
  default: {
    toolbar: 'toolbar',
    toolbarButton: 'toolbarButton',
    toolbarSep: 'toolbarSep',
    shortcut: 'shortcut',
  },
}));

vi.mock('@/modules/mdx-editor/domain/editorCommands', () => ({
  wrapSelection: vi.fn(),
  insertLinePrefix: vi.fn(),
  insertAtCursor: vi.fn(),
  insertLink: vi.fn(),
  triggerUndo: vi.fn(),
  triggerRedo: vi.fn(),
  handleEditorKeyDown: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Bold: () => <span data-testid='icon-bold' />,
  Italic: () => <span data-testid='icon-italic' />,
  Code: () => <span data-testid='icon-code' />,
  Heading1: () => <span data-testid='icon-h1' />,
  Heading2: () => <span data-testid='icon-h2' />,
  Heading3: () => <span data-testid='icon-h3' />,
  List: () => <span data-testid='icon-list' />,
  ListOrdered: () => <span data-testid='icon-list-ordered' />,
  Quote: () => <span data-testid='icon-quote' />,
  Minus: () => <span data-testid='icon-minus' />,
  Link: () => <span data-testid='icon-link' />,
  Undo2: () => <span data-testid='icon-undo' />,
  Redo2: () => <span data-testid='icon-redo' />,
}));

import { EditorToolbar } from '@/modules/mdx-editor/presentation/EditorToolbar/EditorToolbar';

afterEach(() => cleanup());

describe('EditorToolbar', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(
        <EditorToolbar textareaId='editor' value='# Hello' disabled={false} />,
      );
    }).not.toThrow();
  });

  it('renders undo and redo buttons', () => {
    render(<EditorToolbar textareaId='editor' value='' disabled={false} />);

    expect(screen.getByTestId('icon-undo')).toBeDefined();
    expect(screen.getByTestId('icon-redo')).toBeDefined();
  });

  it('renders bold, italic, and code formatting buttons', () => {
    render(<EditorToolbar textareaId='editor' value='' disabled={false} />);

    expect(screen.getByTestId('icon-bold')).toBeDefined();
    expect(screen.getByTestId('icon-italic')).toBeDefined();
    expect(screen.getByTestId('icon-code')).toBeDefined();
  });

  it('renders heading buttons', () => {
    render(<EditorToolbar textareaId='editor' value='' disabled={false} />);

    expect(screen.getByTestId('icon-h1')).toBeDefined();
    expect(screen.getByTestId('icon-h2')).toBeDefined();
    expect(screen.getByTestId('icon-h3')).toBeDefined();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(<EditorToolbar textareaId='editor' value='' disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('calls wrapSelection when Bold button is clicked', async () => {
    const { wrapSelection } =
      await import('@/modules/mdx-editor/domain/editorCommands');
    const user = userEvent.setup();

    render(
      <EditorToolbar textareaId='editor' value='some text' disabled={false} />,
    );

    await user.click(screen.getByRole('button', { name: /bold/i }));

    expect(wrapSelection).toHaveBeenCalled();
  });
});
