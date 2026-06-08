/**
 * @fileoverview Boon Expanded Body
 * @description Renders the prose body of a single bloodline boon inline below
 * its row in `BoonPicker`. Fetches the heading block via the DB-backed
 * `/api/content-shards/bloodlines/[slug]` endpoint lazily on mount and renders
 * it as HTML via the markdown renderer.
 *
 * This component intentionally has no header — the parent `BoonPicker` row
 * supplies the boon name, BP badge, and expand chevron. Expanding a boon is
 * decoupled from selecting it.
 *
 * @module lib/components/characterSheet/builder/boonExpandBody
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
 * Props for the BoonExpandBody component.
 *
 * @interface BoonExpandBodyProps
 * @property {string} bloodlineSlug - Slug of the parent bloodline
 * @property {string} boonName - The boon heading to fetch
 * @property {string} [cachedText] - Optional pre-fetched body text (skips fetch)
 * @property {string} id - DOM id used by the row's aria-controls
 */
export interface BoonExpandBodyProps {
  bloodlineSlug: string;
  boonName: string;
  cachedText?: string;
  id: string;
}

/**
 * Inline expanded body for a boon row.
 *
 * @component
 * @param {BoonExpandBodyProps} props - Component props
 * @returns {JSX.Element} Rendered prose body
 */
export const BoonExpandBody: React.FC<BoonExpandBodyProps> = ({
  bloodlineSlug,
  boonName,
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
    contentType: 'bloodlines',
    slug: bloodlineSlug,
    key: boonName,
    locale,
    enabled: !haveText,
  });
  const is404 = shardError instanceof FetchError && shardError.status === 404;
  const error = shardError?.message ?? null;

  useEffect(() => {
    if (shardData && !haveText) {
      setBodyText(shardData.shards[boonName] ?? '');
    }
  }, [shardData, haveText, boonName]);

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
