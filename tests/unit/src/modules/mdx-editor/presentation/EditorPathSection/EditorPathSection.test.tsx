/**
 * @fileoverview Unit Tests — EditorPathSection
 * @description Validates path/slug input rendering in edit and new modes.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/EditorPathSection/EditorPathSection.test
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/application/hooks/useCorrectionsTree', () => ({
  useCorrectionsTree: vi.fn(() => ({ tree: [], loading: false })),
}));

vi.mock('@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect', () => ({
  FileTreeSelect: ({
    placeholder,
    onSelect,
    foldersOnly,
  }: {
    placeholder?: string;
    onSelect: (path: string) => void;
    foldersOnly?: boolean;
  }) => (
    <div
      data-testid='file-tree-select'
      data-folders-only={String(Boolean(foldersOnly))}>
      {placeholder}
      <button
        type='button'
        data-testid='mock-select-folder'
        onClick={() => onSelect('en/spells/')}
      />
    </div>
  ),
}));

vi.mock('@/modules/mdx-editor/presentation/MdxEditor/MdxEditor.module.scss', () => ({
  default: {
    fieldGroup: 'fieldGroup',
    fieldLabel: 'fieldLabel',
    fieldRow: 'fieldRow',
    slugInput: 'slugInput',
    loadButton: 'loadButton',
    fileNameInput: 'fileNameInput',
  },
}));

vi.mock('@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect.module.scss', () => ({
  default: {},
}));

import { EditorPathSection } from '@/modules/mdx-editor/presentation/EditorPathSection/EditorPathSection';

afterEach(() => cleanup());

/** Default translation stub */
const t = (key: string) => key;

describe('EditorPathSection (edit mode)', () => {
  it('renders without crashing in edit mode', () => {
    expect(() => {
      render(
        <EditorPathSection
          mode='edit'
          slug='monsters/goblin'
          setSlug={vi.fn()}
          filePath=''
          setFilePath={vi.fn()}
          handleLoad={vi.fn()}
          isLoading={false}
          locale='en'
          t={t}
        />,
      );
    }).not.toThrow();
  });

  it('renders the slug label in edit mode', () => {
    render(
      <EditorPathSection
        mode='edit'
        slug='monsters/goblin'
        setSlug={vi.fn()}
        filePath=''
        setFilePath={vi.fn()}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );

    expect(screen.getByText('slugLabel')).toBeDefined();
  });
});

describe('EditorPathSection (new mode)', () => {
  it('renders without crashing in new mode', () => {
    expect(() => {
      render(
        <EditorPathSection
          mode='new'
          slug=''
          setSlug={vi.fn()}
          filePath=''
          setFilePath={vi.fn()}
          handleLoad={vi.fn()}
          isLoading={false}
          locale='en'
          t={t}
        />,
      );
    }).not.toThrow();
  });

  it('renders the path label in new mode', () => {
    render(
      <EditorPathSection
        mode='new'
        slug=''
        setSlug={vi.fn()}
        filePath=''
        setFilePath={vi.fn()}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );

    expect(screen.getByText('pathLabel')).toBeDefined();
  });

  it('renders the FileTreeSelect component', () => {
    render(
      <EditorPathSection
        mode='new'
        slug=''
        setSlug={vi.fn()}
        filePath=''
        setFilePath={vi.fn()}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );

    expect(screen.getByTestId('file-tree-select')).toBeDefined();
  });

  it('renders the selector folders-only in new mode, full tree in edit mode', () => {
    const { unmount } = render(
      <EditorPathSection
        mode='new'
        slug=''
        setSlug={vi.fn()}
        filePath=''
        setFilePath={vi.fn()}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );
    expect(
      screen.getByTestId('file-tree-select').getAttribute('data-folders-only'),
    ).toBe('true');
    unmount();

    render(
      <EditorPathSection
        mode='edit'
        slug='monsters/goblin'
        setSlug={vi.fn()}
        filePath=''
        setFilePath={vi.fn()}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );
    expect(
      screen.getByTestId('file-tree-select').getAttribute('data-folders-only'),
    ).toBe('false');
  });

  it('shows the full flat path and forwards edits to setFilePath', () => {
    const setFilePath = vi.fn();
    render(
      <EditorPathSection
        mode='new'
        slug=''
        setSlug={vi.fn()}
        filePath='en/monsters/goblin.sheet.mdx'
        setFilePath={setFilePath}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );

    const input = screen.getByPlaceholderText(
      'fullPathPlaceholder',
    ) as HTMLInputElement;
    expect(input.value).toBe('en/monsters/goblin.sheet.mdx');

    fireEvent.change(input, { target: { value: 'en/spells/frostbite.mdx' } });
    expect(setFilePath).toHaveBeenCalledWith('en/spells/frostbite.mdx');
  });

  it('preserves the filename when a destination folder is selected', () => {
    const setFilePath = vi.fn();
    render(
      <EditorPathSection
        mode='new'
        slug=''
        setSlug={vi.fn()}
        filePath='en/monsters/frostbite.mdx'
        setFilePath={setFilePath}
        handleLoad={vi.fn()}
        isLoading={false}
        locale='en'
        t={t}
      />,
    );

    fireEvent.click(screen.getByTestId('mock-select-folder'));
    expect(setFilePath).toHaveBeenCalledWith('en/spells/frostbite.mdx');
  });
});
