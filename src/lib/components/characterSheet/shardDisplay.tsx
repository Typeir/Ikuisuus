/**
 * @fileoverview Shard Display Component
 * @description Renders a `CharacterShard` as an expand/collapse card. On first
 * expand the full heading block is fetched from `/api/shards` and cached in state.
 * Renders the shard heading, category badge, BP cost (if boon), level (if feature),
 * and collapsible body text.
 *
 * @module lib/components/characterSheet/shardDisplay
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterShard } from '@/lib/types/character';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import styles from './characterSheetWidgets.module.scss';

/**
 * Props for the ShardDisplay component.
 *
 * @interface ShardDisplayProps
 * @property {CharacterShard} shard - The shard to render
 * @property {boolean} [defaultExpanded] - When true, card starts in expanded state
 */
export interface ShardDisplayProps {
  shard: CharacterShard;
  defaultExpanded?: boolean;
}

/**
 * Expand/collapse shard card. Fetches body text lazily on first expand.
 *
 * @component
 * @param {ShardDisplayProps} props - Component props
 * @returns {JSX.Element} Rendered shard card
 */
export const ShardDisplay: React.FC<ShardDisplayProps> = ({
  shard,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [bodyText, setBodyText] = useState<string>(shard.cachedText ?? '');
  const [textReady, setTextReady] = useState(shard.cachedText !== undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const t = useTranslations('characterSheet');

  useEffect(() => {
    if (!bodyText) {
      setRenderedHtml('');
      return;
    }
    let cancelled = false;
    void import('@/lib/md/renderMarkdownToHtml').then(({ renderMarkdownToHtml }) =>
      renderMarkdownToHtml(bodyText).then((html) => {
        if (!cancelled) setRenderedHtml(html);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [bodyText]);

  const handleToggle = useCallback(async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded && !textReady) {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          file: shard.sourceFile,
          heading: shard.heading,
        });
        const res = await fetch(`/api/shards?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { text: string };
        const lines = data.text.split('\n').slice(1);
        setBodyText(lines.join('\n').trim());
        setTextReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
  }, [expanded, textReady, shard.sourceFile, shard.heading]);

  const categoryLabel =
    shard.category === 'boon'
      ? t('shardCategoryBoon')
      : shard.category === 'vocation-feature'
        ? t('shardCategoryVocation')
        : t('shardCategorySpecialization');

  return (
    <div
      className={`${styles.shardCard} ${expanded ? styles.shardExpanded : ''}`}>
      <button
        type='button'
        className={styles.shardHeader}
        onClick={handleToggle}
        aria-expanded={expanded}>
        <span className={styles.shardChevron} aria-hidden='true'>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className={styles.shardHeading}>{shard.heading}</span>
        <span className={styles.shardCategory}>{categoryLabel}</span>
        {shard.bpCost !== undefined && (
          <span className={styles.shardBpBadge}>
            {shard.bpCost} {t('bpUnit')}
          </span>
        )}
        {shard.level !== undefined && (
          <span className={styles.shardLevelBadge}>
            {t('shardLevelBadge', { level: shard.level })}
          </span>
        )}
      </button>

      {expanded && (
        <div className={styles.shardBody}>
          {loading && (
            <p className={styles.shardLoading}>{t('shardLoading')}</p>
          )}
          {error && <p className={styles.shardError}>{error}</p>}
          {!loading && !error && (
            <div
              className={styles.shardMarkdown}
              dangerouslySetInnerHTML={{
                __html: renderedHtml || (bodyText ? '' : '—'),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
