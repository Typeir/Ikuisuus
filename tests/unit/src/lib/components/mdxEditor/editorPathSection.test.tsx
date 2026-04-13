/**
 * @fileoverview Unit Tests — EditorPathSection
 * @description Validates path/slug input rendering in edit and new modes.
 *
 * @module tests/unit/lib/components/mdxEditor/editorPathSection
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/hooks/data/useDraftAndRouteData', () => ({
  useCorrectionsTreeData: vi.fn(() => ({ tree: [], loading: false })),
}));

vi.mock('@/lib/components/mdxEditor/fileTreeSelect', () => ({
  FileTreeSelect: ({
    placeholder,
    disabled,
  }: {
    placeholder?: string;
    disabled?: boolean;
  }) => <div data-testid='file-tree-select'>{placeholder}</div>,
}));

vi.mock('@/lib/components/mdxEditor/mdxEditor.module.scss', () => ({
  default: {
    fieldGroup: 'fieldGroup',
    fieldLabel: 'fieldLabel',
    fieldRow: 'fieldRow',
    slugInput: 'slugInput',
    loadButton: 'loadButton',
    fileNameInput: 'fileNameInput',
  },
}));

vi.mock('@/lib/components/mdxEditor/fileTreeSelect.module.scss', () => ({
  default: {},
}));

import { EditorPathSection } from '@/lib/components/mdxEditor/editorPathSection';

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
});
