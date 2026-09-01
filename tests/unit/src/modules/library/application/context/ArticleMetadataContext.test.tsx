/**
 * @fileoverview Article Metadata Context Tests
 * @description Tests section lookup and behaviour with missing or null metadata.
 *
 * @module tests/unit/src/modules/library/application/context/ArticleMetadataContext.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import {
  ArticleMetadataProvider,
  useArticleMetadata,
  type ArticleMetadata,
} from '@/modules/library/application/context/ArticleMetadataContext';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * Reads one section's aspects and renders them with the page title.
 *
 * @param {object} props - Component props
 * @param {string} props.section - Section to look up
 * @returns {React.ReactElement} The resolved aspects
 */
const Probe: React.FC<{ section: string }> = ({ section }) => {
  const { aspectsFor, metadata } = useArticleMetadata();
  return (
    <>
      <span data-testid='aspects'>{(aspectsFor(section) ?? []).join(',')}</span>
      <span data-testid='title'>{metadata?.title ?? 'none'}</span>
    </>
  );
};

const MUCKLORD: ArticleMetadata = {
  title: 'Mucklord',
  contentType: 'monsters',
  tags: ['creature:construct', 'damage:force'],
  sections: [
    { name: 'Garbage Communion', tags: ['resource:temp-hp', 'tempo:minor'] },
    { name: 'Detect' },
  ],
};

describe('ArticleMetadataProvider', () => {
  it('should resolve a section to its own aspects', () => {
    render(
      <ArticleMetadataProvider metadata={MUCKLORD}>
        <Probe section='Garbage Communion' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByTestId('aspects')).toHaveTextContent(
      'resource:temp-hp,tempo:minor',
    );
  });

  /** Resolves the page title to the page-level aspects. */
  it('should resolve the title to the page-level aspects', () => {
    render(
      <ArticleMetadataProvider metadata={MUCKLORD}>
        <Probe section='Mucklord' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByTestId('aspects')).toHaveTextContent(
      'creature:construct,damage:force',
    );
  });

  it('should resolve nothing for a section with no aspects', () => {
    render(
      <ArticleMetadataProvider metadata={MUCKLORD}>
        <Probe section='Detect' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByTestId('aspects')).toHaveTextContent('');
  });

  it('should resolve nothing for an unknown section', () => {
    render(
      <ArticleMetadataProvider metadata={MUCKLORD}>
        <Probe section='Nowhere' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByTestId('aspects')).toHaveTextContent('');
  });

  it('should expose the record itself', () => {
    render(
      <ArticleMetadataProvider metadata={MUCKLORD}>
        <Probe section='Detect' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByTestId('title')).toHaveTextContent('Mucklord');
  });

  it('should tolerate a null record', () => {
    render(
      <ArticleMetadataProvider metadata={null}>
        <Probe section='Garbage Communion' />
      </ArticleMetadataProvider>,
    );

    expect(screen.getByTestId('aspects')).toHaveTextContent('');
    expect(screen.getByTestId('title')).toHaveTextContent('none');
  });

  /** Renders nothing when no provider is present. */
  it('should tolerate being used with no provider at all', () => {
    render(<Probe section='Garbage Communion' />);

    expect(screen.getByTestId('aspects')).toHaveTextContent('');
    expect(screen.getByTestId('title')).toHaveTextContent('none');
  });
});
