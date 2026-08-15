/**
 * @fileoverview Unit Tests — FileTreeSelect
 * @description Validates tree dropdown rendering, expand/collapse, and selection.
 *
 * @module tests/unit/lib/components/mdxEditor/fileTreeSelect
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect.module.scss', () => ({
  default: {
    treeSelect: 'treeSelect',
    trigger: 'trigger',
    pathLabel: 'pathLabel',
    triggerPlaceholder: 'triggerPlaceholder',
    chevron: 'chevron',
    open: 'open',
    dropdown: 'dropdown',
    treeNode: 'treeNode',
    fileNode: 'fileNode',
    newFileNode: 'newFileNode',
    nodeIcon: 'nodeIcon',
    nodeIconOpen: 'nodeIconOpen',
    nodeName: 'nodeName',
    newFileIcon: 'newFileIcon',
  },
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid='chevron-down' />,
  ChevronRight: () => <span data-testid='chevron-right' />,
  Folder: () => <span data-testid='icon-folder' />,
  FolderOpen: () => <span data-testid='icon-folder-open' />,
  FilePlus: () => <span data-testid='icon-file-plus' />,
  FileText: () => <span data-testid='icon-file-text' />,
}));

import {
  FileTreeSelect,
  TreeNode,
} from '@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect';

afterEach(() => cleanup());

/** Sample tree for tests */
const sampleTree: TreeNode[] = [
  {
    name: 'monsters',
    path: 'en/monsters',
    children: [
      {
        name: 'goblin.sheet.mdx',
        path: 'en/monsters/goblin.sheet.mdx',
        children: [],
        isFile: true,
      },
    ],
  },
  {
    name: 'spells',
    path: 'en/spells',
    children: [],
  },
];

describe('FileTreeSelect', () => {
  it('renders without crashing and shows placeholder', () => {
    render(
      <FileTreeSelect
        value=''
        onSelect={vi.fn()}
        tree={sampleTree}
        placeholder='Pick a folder'
      />,
    );

    expect(screen.getByText('Pick a folder')).toBeDefined();
  });

  it('shows the selected value when provided', () => {
    render(
      <FileTreeSelect
        value='en/monsters'
        onSelect={vi.fn()}
        tree={sampleTree}
      />,
    );

    expect(screen.getByText('en/monsters')).toBeDefined();
  });

  it('shows "..." while loading', () => {
    render(
      <FileTreeSelect value='' onSelect={vi.fn()} tree={[]} loading={true} />,
    );

    expect(screen.getByText('...')).toBeDefined();
  });

  it('opens the dropdown when trigger button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FileTreeSelect
        value=''
        onSelect={vi.fn()}
        tree={sampleTree}
        placeholder='Select'
      />,
    );

    await user.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('monsters/')).toBeDefined();
    expect(screen.getByText('spells/')).toBeDefined();
  });

  it('expands a folder node and shows children', async () => {
    const user = userEvent.setup();

    render(
      <FileTreeSelect
        value=''
        onSelect={vi.fn()}
        tree={sampleTree}
        placeholder='Select'
      />,
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByText('monsters/'));

    expect(screen.getByText('goblin.sheet.mdx')).toBeDefined();
  });

  it('calls onSelect when a file node is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <FileTreeSelect
        value=''
        onSelect={onSelect}
        tree={sampleTree}
        placeholder='Select'
      />,
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByText('monsters/'));
    await user.click(screen.getByText('goblin.sheet.mdx'));

    expect(onSelect).toHaveBeenCalledWith('en/monsters/goblin.sheet.mdx');
  });

  it('hides file rows but keeps destinations in foldersOnly mode', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <FileTreeSelect
        value=''
        onSelect={onSelect}
        tree={sampleTree}
        placeholder='Select'
        newFileLabel='New file'
        foldersOnly
      />,
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByText('monsters/'));

    expect(screen.queryByText('goblin.sheet.mdx')).toBeNull();
    await user.click(screen.getByText('New file'));
    expect(onSelect).toHaveBeenCalledWith('en/monsters/');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <FileTreeSelect
        value=''
        onSelect={vi.fn()}
        tree={sampleTree}
        disabled={true}
      />,
    );

    const trigger = screen.getByRole('button');
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
  });
});
