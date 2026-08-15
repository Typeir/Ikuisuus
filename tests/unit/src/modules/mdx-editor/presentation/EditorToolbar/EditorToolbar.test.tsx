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
  replaceAllText: vi.fn(),
  triggerUndo: vi.fn(),
  triggerRedo: vi.fn(),
  handleEditorKeyDown: vi.fn(),
}));

vi.mock('@/lib/components/ui/filterSelect/filterSelect', () => ({
  FilterSelect: ({
    options,
    onChange,
    ariaLabel,
    hideAllOption,
    iconTrigger,
    disabled,
  }: {
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    ariaLabel?: string;
    hideAllOption?: boolean;
    iconTrigger?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <div
      data-testid='filter-select'
      aria-label={ariaLabel}
      data-hide-all={String(Boolean(hideAllOption))}>
      {iconTrigger && (
        <span data-testid='select-icon-trigger'>{iconTrigger}</span>
      )}
      {options.map((opt) => (
        <button
          key={opt.value}
          type='button'
          disabled={disabled}
          onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('lucide-react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('lucide-react')>()),
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
  Copy: () => <span data-testid='icon-copy' />,
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

  it('inserts a sample template through the sample select', async () => {
    const { replaceAllText } =
      await import('@/modules/mdx-editor/domain/editorCommands');
    const { SAMPLE_TEMPLATES } =
      await import('@/modules/mdx-editor/domain/sampleTemplates');
    const user = userEvent.setup();

    render(<EditorToolbar textareaId='editor' value='' disabled={false} />);

    const select = screen.getByTestId('filter-select');
    expect(select.getAttribute('data-hide-all')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Sample creature' }));

    const creature = SAMPLE_TEMPLATES.find((t) => t.key === 'creature');
    expect(replaceAllText).toHaveBeenCalledWith('editor', creature?.content);
  });

  it('renders the sample select as a copy icon trigger with all samples', () => {
    render(<EditorToolbar textareaId='editor' value='' disabled={false} />);

    const trigger = screen.getByTestId('select-icon-trigger');
    expect(trigger.querySelector('[data-testid="icon-copy"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Sample rule' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sample world' })).toBeDefined();
  });
});
