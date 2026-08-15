import { FileTreeSelectRow } from '@/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelectRow';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('FileTreeSelectRow', () => {
  it('renders directory row and toggles when clicked', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();

    render(
      <FileTreeSelectRow
        node={{ name: 'world', path: 'en/world', children: [] }}
        depth={0}
        expanded={new Set()}
        toggle={toggle}
        onSelect={vi.fn()}
        newFileLabel='New file'
      />,
    );

    await user.click(screen.getByRole('button', { name: /world\//i }));
    expect(toggle).toHaveBeenCalledWith('en/world');
  });

  it('hides file rows when foldersOnly is set', () => {
    const { container } = render(
      <FileTreeSelectRow
        node={{
          name: 'goblin.sheet.mdx',
          path: 'en/monsters/goblin.sheet.mdx',
          children: [],
          isFile: true,
        }}
        depth={0}
        expanded={new Set()}
        toggle={vi.fn()}
        onSelect={vi.fn()}
        newFileLabel='New file'
        foldersOnly
      />,
    );

    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('keeps folder destinations selectable when foldersOnly is set', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FileTreeSelectRow
        node={{
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
        }}
        depth={0}
        expanded={new Set(['en/monsters'])}
        toggle={vi.fn()}
        onSelect={onSelect}
        newFileLabel='New file'
        foldersOnly
      />,
    );

    expect(screen.queryByText('goblin.sheet.mdx')).toBeNull();
    await user.click(screen.getByText('New file'));
    expect(onSelect).toHaveBeenCalledWith('en/monsters/');
  });
});
