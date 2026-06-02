/**
 * @fileoverview Feat Expanded Body
 * @description Renders the prose body of a single feat inline below its row in
 * `FeatPicker`. Fetches the heading block via the DB-backed
 * `/api/content-shards/feats/[slug]` endpoint lazily on mount and renders it
 * as HTML via the markdown renderer.
 *
 * This component intentionally has no header — the parent `FeatPicker` row
 * supplies the feat name and expand chevron. Expanding a feat is decoupled from
 * selecting it.
 *
 * @module lib/components/characterSheet/builder/featExpandBody
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { FetchError } from '@/lib/fetch/fetcher';
import { useContentShardSingle } from '@/lib/hooks/data/useContentShard';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import styles from '../CharacterSheet/characterSheetWidgets.module.scss';
import expandStyles from './boonExpand.module.scss';

/**
 * Props for the FeatExpandBody component.
 *
 * @interface FeatExpandBodyProps
 * @property {string} featSlug - Slug of the feat
 * @property {string} featName - The feat heading to fetch
 * @property {string} [cachedText] - Optional pre-fetched body text (skips fetch)
 * @property {string} id - DOM id used by the row's aria-controls
 */
export interface FeatExpandBodyProps {
  featSlug: string;
  featName: string;
  cachedText?: string;
  id: string;
}

/**
 * Inline expanded body for a feat row.
 *
 * @component
 * @param {FeatExpandBodyProps} props - Component props
 * @returns {JSX.Element} Rendered prose body
 */
export const FeatExpandBody: React.FC<FeatExpandBodyProps> = ({
  featSlug,
  featName,
  cachedText,
  id,
}) => {
  const t = useTranslations('characterSheet');
  const locale = useLocale();
  const [bodyText, setBodyText] = useState<string>(cachedText ?? '');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const haveText = bodyText.length > 0;

  const {
    data: shardData,
    isLoading: loading,
    error: shardError,
  } = useContentShardSingle({
    contentType: 'feats',
    slug: featSlug,
    key: featName,
    locale,
    enabled: !haveText,
  });
  const is404 = shardError instanceof FetchError && shardError.status === 404;
  const error = shardError?.message ?? null;

  useEffect(() => {
    if (shardData && !haveText) {
      setBodyText(shardData.shards[featName] ?? '');
    }
  }, [shardData, haveText, featName]);

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
      {loading && <p className={styles.shardLoading}>{t('shardLoading')}</p>}
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
