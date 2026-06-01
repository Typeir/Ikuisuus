/**
 * @fileoverview Unit tests for the MdRawPage renderer.
 * @module tests/unit/src/modules/library/presentation/MdRawPage/MdRawPage
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { MdRawPage } from '@/modules/library/presentation/MdRawPage/MdRawPage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MdRawPage', () => {
  it('renders title from frontmatter and converted markdown content', async () => {
    const element = await MdRawPage({
      slugPath: 'world/black-cradle',
      rawContent: [
        '---',
        'title: Black Cradle',
        '---',
        '',
        '# Intro',
        '',
        'Lore text',
      ].join('\n'),
    });

    const { container } = render(element);
    const pageHeading = container.querySelector(
      'h1.text-4xl.font-mono.font-black.mb-6',
    );

    expect(pageHeading).toHaveTextContent('Black Cradle');
    expect(container.querySelector('article')?.className).toContain('markdown');
    expect(screen.getByText('Lore text')).toBeInTheDocument();
  });

  it('falls back to slugPath when frontmatter title is missing', async () => {
    const element = await MdRawPage({
      slugPath: 'rules/arcana',
      rawContent: 'Plain markdown body',
    });

    render(element);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'rules/arcana',
    );
  });
});
