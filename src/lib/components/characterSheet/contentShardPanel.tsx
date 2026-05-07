/**
 * @fileoverview Content Shard Panel
 * @description Fetches the `main` prose shard for a content item via the
 * `/api/content-shards` routes and renders it as markdown. Replaces the
 * iframe approach: the server resolves file structure internally, this
 * component owns only fetch + render.
 *
 * @module lib/components/characterSheet/contentShardPanel
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useEffect, useState } from 'react';
import styles from './contentShardPanel.module.scss';

/**
 * Content types that have a `/api/content-shards/[type]/[slug]` route.
 *
 * @typedef {'feats' | 'bloodlines' | 'vocations' | 'specializations'} ContentShardType
 */
export type ContentShardType =
  | 'feats'
  | 'bloodlines'
  | 'vocations'
  | 'specializations';

/**
 * Props for `<ContentShardPanel>`.
 *
 * @interface ContentShardPanelProps
 * @property {ContentShardType} contentType - API path segment for the shard route
 * @property {string} slug - Content item slug
 * @property {string} [locale] - Content locale (default `en`)
 */
export interface ContentShardPanelProps {
  contentType: ContentShardType;
  slug: string;
  locale?: string;
}

/**
 * Fetches and renders the `main` prose shard for the given content item.
 * Displays a loading state while the shard is in-flight and an error state
 * on failure.
 *
 * @component
 * @param {ContentShardPanelProps} props - Component props
 * @returns {JSX.Element} Rendered shard panel
 */
export const ContentShardPanel: React.FC<ContentShardPanelProps> = ({
  contentType,
  slug,
  locale = 'en',
}) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRenderedHtml('');

    const url = `/api/content-shards/${contentType}/${slug}?keys[]=main&locale=${locale}`;

    fetch(url)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ shards: Record<string, string> }>)
          : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then(async (data) => {
        const markdown = data.shards.main ?? '';
        const { renderMarkdownToHtml } = await import(
          '@/lib/md/renderMarkdownToHtml'
        );
        const html = await renderMarkdownToHtml(markdown);
        if (!cancelled) setRenderedHtml(html);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contentType, slug, locale]);

  if (loading) {
    return <div className={styles.loading} aria-busy='true'>Loading…</div>;
  }

  if (error) {
    return <div className={styles.error} role='alert'>{error}</div>;
  }

  return (
    <div className={styles.panel}>
      <div
        className={`${styles.body} prose`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};
