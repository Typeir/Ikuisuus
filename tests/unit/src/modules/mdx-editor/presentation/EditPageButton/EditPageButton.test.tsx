/**
 * @fileoverview EditPageButton tests
 * @description Href construction, slug encoding, and the IconLink chrome.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/EditPageButton/EditPageButton.test
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { EditPageButton } from '@/modules/mdx-editor/presentation/EditPageButton/EditPageButton';

afterEach(() => cleanup());

describe('EditPageButton', () => {
  it('renders an edit IconLink with the translated label', () => {
    render(<EditPageButton slug='monsters/aboleth' locale='en' />);
    const link = screen.getByRole('link', { name: 'editButton' });
    expect(link).toHaveAttribute('data-kind', 'edit');
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('exposes the editor target as a real href', () => {
    render(<EditPageButton slug='monsters/aboleth' locale='en' />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/en/utils/mdx-editor?slug=monsters/aboleth&locale=en',
    );
  });

  it('encodes non-ASCII characters in slug segments', () => {
    render(
      <EditPageButton slug='character-creation/bloodlines/väärät' locale='en' />,
    );
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/en/utils/mdx-editor?slug=character-creation/bloodlines/v%C3%A4%C3%A4r%C3%A4t&locale=en',
    );
  });

  it('encodes special characters in slug', () => {
    render(<EditPageButton slug='items/sword & shield' locale='es' />);
    expect(screen.getByRole('link').getAttribute('href')).toContain(
      'sword%20%26%20shield',
    );
  });
});
