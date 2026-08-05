/**
 * @fileoverview Article Metadata Context
 * @description Scopes one page's generated metadata to the whole MDX tree, so a
 * component embedded anywhere in an article can read what page it is on.
 *
 * MDX has no prop drilling. Without this, every interactive component that needs
 * page data grows its own fetch — which is why the metadata tables each call
 * their own API route — and each one re-learns the same lesson about which
 * backend it is talking to.
 *
 * **The provider receives metadata; it never loads it.** The repository reaches
 * the ORM, and this file is imported by client components. Loading belongs in the
 * server component that renders the provider.
 *
 * **Sidecars are the dev backend, not the live one.** The site runs
 * `METADATA_BACKEND=pg`, so a field that exists in a `.metadata.json` file but
 * not in the pg schema is present locally and absent in production. Consumers
 * must treat every field as optional and render nothing rather than assume.
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
 * @property {string} name - Section heading text, exactly as written in the source
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
 * @property {ArticleSection[]} [sections] - Per-section aspects, keyed by heading text
 */
export interface ArticleMetadata {
  title?: string;
  contentType?: string;
  tags?: string[];
  sections?: ArticleSection[];
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
 * Safe outside an article: returns a null record and a lookup that finds
 * nothing, so a component embedded in a page without metadata renders nothing
 * rather than throwing.
 *
 * @returns {ArticleMetadataValue} The article's metadata and section lookup
 */
export function useArticleMetadata(): ArticleMetadataValue {
  return useContext(ArticleMetadataContext);
}
