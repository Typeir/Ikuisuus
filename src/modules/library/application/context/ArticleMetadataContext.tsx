/**
 * @fileoverview Article Metadata Context
 * @description Scopes one page's generated metadata to the whole MDX tree so any
 * embedded component can read the current article.
 *
 * The provider receives metadata; it never loads it. Loading belongs in the
 * server component that renders the provider.
 *
 * The dev backend is a sidecar (`.metadata.json`); production runs
 * `METADATA_BACKEND=pg`. A field in the sidecar not in the pg schema is absent
 * in production, so consumers must treat every field as optional and render
 * nothing rather than assume.
 *
 * @module modules/library/application/context/ArticleMetadataContext
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */

'use client';

import React, { createContext, useContext, useMemo } from 'react';

/**
 * One section of an article that carries its own aspects.
 *
 * @property {string} name - Section key: the heading's anchor slug, or `record/anchor` inside a multi-block file
 * @property {string[]} [tags] - Aspects derived from that section alone
 */
export interface ArticleSection {
  name: string;
  tags?: string[];
}

/**
 * The generated metadata for the article being rendered.
 *
 * @property {string} [title] - Page title
 * @property {string} [contentType] - Content kind, e.g. `monsters`
 * @property {string[]} [tags] - Page-level aspects
 * @property {ArticleSection[]} [sections] - Per-section aspects, keyed by anchor
 * @property {string[]} [records] - Anchors of the file's stat block titles, file order
 */
export interface ArticleMetadata {
  title?: string;
  contentType?: string;
  tags?: string[];
  sections?: ArticleSection[];
  records?: string[];
}

/**
 * Resolved lookups over the article's metadata.
 *
 * @property {ArticleMetadata | null} metadata - The raw record, or null outside an article
 * @property {(section: string) => string[] | undefined} aspectsFor - Aspects for one heading
 */
export interface ArticleMetadataValue {
  metadata: ArticleMetadata | null;
  aspectsFor: (section: string) => string[] | undefined;
}

const ArticleMetadataContext = createContext<ArticleMetadataValue>({
  metadata: null,
  aspectsFor: () => undefined,
});

/**
 * Provides one article's metadata to everything rendered inside it.
 *
 * @param {object} props - Component props
 * @param {ArticleMetadata | null} [props.metadata] - The article's generated metadata
 * @param {React.ReactNode} props.children - The article tree
 * @returns {React.ReactElement} The provider
 */
export const ArticleMetadataProvider: React.FC<{
  metadata?: ArticleMetadata | null;
  children: React.ReactNode;
}> = ({ metadata = null, children }) => {
  const value = useMemo<ArticleMetadataValue>(() => {
    const bySection = new Map<string, string[]>();

    for (const section of metadata?.sections ?? []) {
      if (section.tags?.length) bySection.set(section.name, section.tags);
    }

    if (metadata?.title && metadata.tags?.length) {
      bySection.set(metadata.title, metadata.tags);
    }

    return {
      metadata,
      aspectsFor: (section: string) => bySection.get(section),
    };
  }, [metadata]);

  return (
    <ArticleMetadataContext.Provider value={value}>
      {children}
    </ArticleMetadataContext.Provider>
  );
};

/**
 * Reads the metadata of the article currently being rendered.
 *
 * Outside an article: returns a null metadata record and a lookup that finds
 * nothing; components render nothing instead of throwing.
 *
 * @returns {ArticleMetadataValue} The article's metadata and section lookup
 */
export function useArticleMetadata(): ArticleMetadataValue {
  return useContext(ArticleMetadataContext);
}
