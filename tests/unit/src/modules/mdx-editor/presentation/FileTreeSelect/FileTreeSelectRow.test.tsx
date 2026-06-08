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
});
