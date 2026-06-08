/**
 * EditPageButton Component Unit Tests
 *
 * @fileoverview Tests for the Edit button that navigates to the MDX Editor.
 *
 * @module tests/unit/lib/components/mdxEditor/editPageButton
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('lucide-react', () => ({
  Pencil: ({ size, ...rest }: any) => (
    <span data-testid='pencil-icon' {...rest} />
  ),
}));
vi.mock(
  '@/modules/mdx-editor/presentation/EditPageButton/EditPageButton.module.scss',
  () => ({
    default: { editButton: 'editButton' },
  }),
);

import { EditPageButton } from '@/modules/mdx-editor/presentation/EditPageButton/EditPageButton';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => cleanup());

describe('EditPageButton', () => {
  it('should render with translated label', () => {
    render(<EditPageButton slug='monsters/aboleth' locale='en' />);
    expect(screen.getByRole('button')).toBeDefined();
    expect(screen.getByText('editButton')).toBeDefined();
  });

  it('should navigate to editor on click', async () => {
    const user = userEvent.setup();
    render(<EditPageButton slug='monsters/aboleth' locale='en' />);

    await user.click(screen.getByRole('button'));

    expect(mockPush).toHaveBeenCalledWith(
      '/en/utils/mdx-editor?slug=monsters/aboleth&locale=en',
    );
  });

  it('should encode non-ASCII characters in slug segments', async () => {
    const user = userEvent.setup();
    render(
      <EditPageButton
        slug='character-creation/bloodlines/väärät'
        locale='en'
      />,
    );

    await user.click(screen.getByRole('button'));

    expect(mockPush).toHaveBeenCalledWith(
      '/en/utils/mdx-editor?slug=character-creation/bloodlines/v%C3%A4%C3%A4r%C3%A4t&locale=en',
    );
  });

  it('should encode special characters in slug', async () => {
    const user = userEvent.setup();
    render(<EditPageButton slug='items/sword & shield' locale='es' />);

    await user.click(screen.getByRole('button'));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('sword%20%26%20shield'),
    );
  });

  it('should render pencil icon', () => {
    render(<EditPageButton slug='test' locale='en' />);
    expect(screen.getByTestId('pencil-icon')).toBeDefined();
  });
});
