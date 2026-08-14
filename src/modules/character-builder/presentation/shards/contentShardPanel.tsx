/**
 * @fileoverview Content Shard Panel
 * @description Fetches the `main` prose shard via `/api/content-shards` and
 * renders it with the full MDX component registry. Falls back to plain HTML
 * via `renderMarkdownToHtml` when the source is truncated or malformed.
 *
 * @module lib/components/characterSheet/contentShardPanel
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Skeleton, SkeletonGroup } from '@/lib/components/skeleton/skeleton';
import { useContentShard } from '@/lib/hooks/data/useContentShard';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { mdxComponents } from '@/modules/library/presentation';
import { useLocale } from 'next-intl';
import { type ReactNode, useEffect, useState } from 'react';
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
 */
export interface ContentShardPanelProps {
  contentType: ContentShardType;
  slug: string;
}

/**
 * Compiles MDX synchronously with the full component registry. Throws on
 * truncated or malformed tokens.
 *
 * @param {string} source - Raw MDX/markdown source text
 * @returns {ReactNode} Compiled React element tree
 */
function tryCompileMdxSync(source: string): ReactNode {
  return compileRuntimeSync({ source, components: mdxComponents }).content;
}

/**
 * Renders markdown to a plain HTML fragment via `renderMarkdownToHtml`.
 * Used when MDX compilation fails on truncated or malformed tokens.
 *
 * @param {string} source - Raw markdown source text
 * @returns {Promise<ReactNode>} React element wrapping the rendered HTML
 */
async function renderMarkdownFallback(source: string): Promise<ReactNode> {
  const { renderMarkdownToHtml } =
    await import('@/lib/md/renderMarkdownToHtml');
  const html = await renderMarkdownToHtml(source);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Strips YAML frontmatter delimited by `---` from the start of content.
 * Only removes the block if line 1 is `---` and a closing `---` appears
 * before the first `#` heading (or end of content).
 *
 * @param {string} source - Raw markdown source
 * @returns {string} Source with frontmatter block removed
 */
function stripYamlFrontmatter(source: string): string {
  if (!source.startsWith('---')) return source;
  const rest = source.slice(3);
  const closeIdx = rest.indexOf('\n---');
  if (closeIdx === -1) return source;
  const afterClose = rest.slice(closeIdx + 4);
  const headingIdx = afterClose.search(/^# /m);
  if (headingIdx !== -1) return afterClose;
  return source;
}

/**
 * Fetches and renders the `main` prose shard for the content item.
 * Attempts MDX compilation; falls back to plain HTML on malformed input.
 * Shows a loading state while fetching and an error state on failure.
 *
 * @component
 * @param {ContentShardPanelProps} props - Component props
 * @param {ContentShardType} props.contentType - API path segment for the shard route
 * @param {string} props.slug - Content item slug
 * @returns {JSX.Element} Rendered shard panel
 */
export const ContentShardPanel: React.FC<ContentShardPanelProps> = ({
  contentType,
  slug,
}) => {
  const locale = useLocale();
  const [renderedContent, setRenderedContent] = useState<ReactNode | null>(
    null,
  );
  const {
    data,
    isLoading: loading,
    error: shardError,
  } = useContentShard({
    contentType,
    slug,
    locale,
  });
  const error = shardError?.message ?? null;

  useEffect(() => {
    if (!data) return;
    const markdown = stripYamlFrontmatter(data.shards.main ?? '');
    let cancelled = false;
    try {
      const node = tryCompileMdxSync(markdown);
      if (!cancelled) setRenderedContent(node);
    } catch {
      void renderMarkdownFallback(markdown).then((node) => {
        if (!cancelled) setRenderedContent(node);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (loading) {
    return (
      <div className={styles.panel} aria-busy='true'>
        <SkeletonGroup>
          <Skeleton variant='title' />
          <Skeleton variant='text' count={3} />
          <Skeleton variant='text' width='80%' />
          <Skeleton variant='text' count={2} />
          <Skeleton variant='text' width='55%' />
        </SkeletonGroup>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} role='alert'>
        {error}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.body}>{renderedContent}</div>
    </div>
  );
};
