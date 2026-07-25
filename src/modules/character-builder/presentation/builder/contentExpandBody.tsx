/**
 * @fileoverview Content Expand Body
 * @description Renders the prose body of a content item (feat, boon, etc.)
 * inline below its picker row. Fetches the heading block via the DB-backed
 * `/api/content-shards/[type]/[slug]` endpoint lazily on mount and renders
 * it as HTML via the markdown renderer.
 *
 * This component intentionally has no header — the parent row supplies the
 * item name, badge, and expand chevron. Expanding is decoupled from selecting.
 *
 * @module lib/components/characterSheet/builder/contentExpandBody
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { FetchError } from '@/lib/fetch/fetcher';
import { useContentShardSingle } from '@/lib/hooks/data/useContentShard';
import type { ContentShardType } from '@/modules/character-builder/presentation/shards/contentShardPanel';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import expandStyles from './boonExpand.module.scss';

/**
 * Props for the ContentExpandBody component.
 *
 * @interface ContentExpandBodyProps
 * @property {ContentShardType} contentType - API path segment (e.g. `'feats'`, `'bloodlines'`)
 * @property {string} contentSlug - Slug of the parent content item
 * @property {string} contentKey - Heading key to fetch within the content item
 * @property {string} [cachedText] - Optional pre-fetched body text (skips fetch)
 * @property {string} id - DOM id used by the row's aria-controls
 */
export interface ContentExpandBodyProps {
  contentType: ContentShardType;
  contentSlug: string;
  contentKey: string;
  cachedText?: string;
  id: string;
}

/**
 * Inline expanded body for a content row.
 *
 * @component
 * @param {ContentExpandBodyProps} props - Component props
 * @param {ContentShardType} props.contentType - API path segment (e.g. `'feats'`, `'bloodlines'`)
 * @param {string} props.contentSlug - Slug of the parent content item
 * @param {string} props.contentKey - Heading key to fetch within the content item
 * @param {string} [props.cachedText] - Optional pre-fetched body text (skips fetch)
 * @param {string} props.id - DOM id used by the row's aria-controls
 * @returns {JSX.Element} Rendered prose body
 */
export const ContentExpandBody: React.FC<ContentExpandBodyProps> = ({
  contentType,
  contentSlug,
  contentKey,
  cachedText,
  id,
}) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [bodyText, setBodyText] = useState<string>(cachedText ?? '');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const haveText = bodyText.length > 0;

  const {
    data: shardData,
    isLoading: loading,
    error: shardError,
  } = useContentShardSingle({
    contentType,
    slug: contentSlug,
    key: contentKey,
    locale,
    enabled: !haveText,
  });
  const is404 = shardError instanceof FetchError && shardError.status === 404;
  const error = shardError?.message ?? null;

  useEffect(() => {
    if (shardData && !haveText) {
      setBodyText(shardData.shards[contentKey] ?? '');
    }
  }, [shardData, haveText, contentKey]);

  useEffect(() => {
    if (!bodyText) {
      setRenderedHtml('');
      return;
    }
    let cancelled = false;
    void import('@/lib/md/renderMarkdownToHtml').then(
      ({ renderMarkdownToHtml }) =>
        renderMarkdownToHtml(bodyText).then((html) => {
          if (!cancelled) setRenderedHtml(html);
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [bodyText]);

  return (
    <div id={id} className={expandStyles.boonExpandBody}>
      {loading && <p className={styles.shardLoading}>{tCommon('loading')}</p>}
      {error && (
        <p className={styles.shardError}>
          {is404 ? t('shardNotFound') : error}
        </p>
      )}
      {!loading && !error && (
        <div
          className={styles.shardMarkdown}
          dangerouslySetInnerHTML={{
            __html: renderedHtml || (bodyText ? '' : '—'),
          }}
        />
      )}
    </div>
  );
};
