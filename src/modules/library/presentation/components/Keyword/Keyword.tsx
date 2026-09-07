/**
 * @fileoverview Keyword Inline MDX Component
 * @description Inline MDX component that renders a rules keyword linked to the
 * heading that defines it.
 *
 * @module modules/library/presentation/components/Keyword/Keyword
 * @version 5.0.0
 * @author Typeir
 * @since 2026-08-19
 */

'use client';

import type { DetachableTooltipProps } from '@/lib/components/ui/detachableTooltip';
import type { compileRuntimeSync as CompileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, {
  Suspense,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import DiceRoll from '../DiceRoll';
import Unit from '../Unit';
import styles from './Keyword.module.scss';
import { useKeywordShard } from './KeywordShardContext';
import { useShardSource } from './useShardSource';

/**
 * Prose length, in characters, past which a card is laid out wide.
 *
 * @constant
 *
 * @description
 * Half the length of the `recovery` shard, which sits near the long end of the
 * corpus. Below this a definition is a line or two and a narrow column reads
 * cleanly; above it the narrow column runs long enough that the card becomes a
 * ribbon of text.
 */
const WIDE_SHARD_CHARS = 668;

/** Card width in pixels for a shard shorter than {@link WIDE_SHARD_CHARS}. */
const CARD_MAX_WIDTH = 250;

/** Card width in pixels for a shard at or past {@link WIDE_SHARD_CHARS}. */
const WIDE_CARD_MAX_WIDTH = 512;

/**
 * The card machinery, loaded on first use so `Draggable` stays out of the
 * initial bundle.
 */
const DetachableTooltip = React.lazy<
  React.ComponentType<DetachableTooltipProps>
>(async () => ({
  default: (await import('@/lib/components/ui/detachableTooltip'))
    .DetachableTooltip,
}));

/** Subscription with no updates; hydration state never changes once read. */
const subscribeNever = () => () => {};

/**
 * Whether hydration has completed.
 *
 * @returns {boolean} True after hydration
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * Props for the Keyword component.
 *
 * @typedef {object} KeywordProps
 * @property {string} term - Canonical term, e.g. "damage bonus"
 * @property {string} [display] - Author-written text with casing preserved; falls back to the term
 * @property {string} [namespace] - Namespace the term was referenced through, e.g. "condition"
 * @property {string} [href] - Locale-relative route and anchor, stamped when the server resolved it
 * @property {string} [templateId] - Id of the shard the page baked, when it baked one
 * @property {string} [heading] - Heading text of the defining section, used as the card title
 * @property {boolean} [noLink] - When true, renders a `<span>` instead of an `<a>` to avoid nested anchors
 * @property {boolean} [noCard] - When true, renders the term without a hover card
 * @property {boolean} [nested] - Set for a keyword inside a shard, which resolves itself on open
 */
export interface KeywordProps {
  term: string;
  display?: string;
  namespace?: string;
  href?: string;
  templateId?: string;
  heading?: string;
  noLink?: boolean;
  noCard?: boolean;
  nested?: boolean;
}

/**
 * Normalised reference for a term, matching what the extractor produces.
 *
 * @param {string} term - Canonical term
 * @param {string} [namespace] - Namespace, when the reference carried one
 * @returns {string} `namespace;term`, or the bare term
 */
function referenceOf(term: string, namespace?: string): string {
  return namespace ? `${namespace};${term}` : term;
}

/**
 * Components a shard's own prose may use.
 *
 * @constant
 */
const shardComponents = {
  Unit,
  DiceRoll,
  Keyword: (props: KeywordProps) => <Keyword {...props} nested />,
};

/**
 * Props for the card.
 *
 * @typedef {object} KeywordCardProps
 * @property {string} term - Canonical term, used to request the shard
 * @property {string} [namespace] - Namespace the term was referenced through
 * @property {string} [templateId] - Id of the shard the page baked, when it baked one
 * @property {string} [heading] - Card title stamped at compile time
 * @property {string} [href] - Route stamped at compile time
 * @property {string} fallbackTitle - Title used until a heading is known
 * @property {(chars: number) => void} onResolved - Reports the prose length once the shard is in hand, so the frame can widen for a long one
 */
interface KeywordCardProps {
  term: string;
  namespace?: string;
  templateId?: string;
  heading?: string;
  href?: string;
  fallbackTitle: string;
  onResolved: (chars: number) => void;
}

/**
 * The card: a title, a link to the full rule, and the compiled definition.
 *
 * @param {KeywordCardProps} props - Component props
 * @returns {React.ReactElement | null} The card, or null until it resolves
 */
const KeywordCard: React.FC<KeywordCardProps> = ({
  term,
  namespace,
  templateId,
  heading,
  href,
  fallbackTitle,
  onResolved,
}) => {
  const locale = useLocale();
  const t = useTranslations('keywords');
  const shard = useShardSource(templateId, referenceOf(term, namespace), locale);
  const [compile, setCompile] = useState<typeof CompileRuntimeSync | null>(
    null,
  );

  useEffect(() => {
    if (shard) onResolved(shard.source.length);
  }, [shard, onResolved]);

  /* Loaded here rather than imported: this mounts when a card opens, so the MDX
     compiler stays out of the graph of every page that has a keyword in it. */
  useEffect(() => {
    let active = true;
    void import('@/modules/library/infrastructure/compile/compileRuntime').then(
      (module) => {
        if (active) setCompile(() => module.compileRuntimeSync);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const body = useMemo(() => {
    if (!shard || !compile) return null;
    return compile({ source: shard.source, components: shardComponents })
      .content;
  }, [compile, shard]);

  if (!shard) return null;

  const title = heading ?? shard.heading ?? fallbackTitle;
  const target = href ?? shard.href;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeading}>
        <h3 className={styles.cardTitle}>{title}</h3>
        {target && (
          <a
            className={styles.cardLink}
            href={`/${locale}/${target}`}
            aria-label={t('openRule', { term: title })}>
            <ExternalLink size={14} aria-hidden='true' />
          </a>
        )}
      </div>
      {body && <div className={styles.blurb}>{body}</div>}
    </div>
  );
};

/**
 * Renders a rules keyword as a defined term with hover and lookup.
 *
 * @param {KeywordProps} props - Component props
 * @returns {React.ReactElement} The rendered keyword
 */
export const Keyword: React.FC<KeywordProps> = ({
  term,
  display,
  namespace,
  href,
  templateId,
  heading,
  noLink = false,
  noCard = false,
  nested = false,
}) => {
  const locale = useLocale();
  const t = useTranslations('keywords');
  const hydrated = useHydrated();
  const baked = useKeywordShard(templateId);
  const [fetchedChars, setFetchedChars] = useState(0);
  const label = display ?? term;

  /* A nested keyword carries no compile-time resolution, so its card is the
     only thing that can find one. Elsewhere a missing shard id means the index
     resolved nothing, and the term stays plain text. */
  const hasCard = Boolean(templateId) || nested;

  /* The page's baked shard answers immediately; a card that fetches its prose
     reports back and widens on the same render that fills it. */
  const chars = baked?.source.length ?? fetchedChars;
  const maxWidth =
    chars >= WIDE_SHARD_CHARS ? WIDE_CARD_MAX_WIDTH : CARD_MAX_WIDTH;

  if (!href && !hasCard) {
    return <span>{label}</span>;
  }

  const className = hasCard ? styles.defined : styles.keyword;

  const trigger =
    noLink || !href ? (
      <span className={className} data-keyword={term} data-namespace={namespace}>
        {label}
      </span>
    ) : (
      <a
        className={className}
        href={`/${locale}/${href}`}
        data-keyword={term}
        data-namespace={namespace}>
        {label}
      </a>
    );

  if (!hasCard || !hydrated || noCard) {
    return trigger;
  }

  const title = heading ?? label;

  return (
    <Suspense fallback={trigger}>
      <DetachableTooltip
        content={
          <KeywordCard
            term={term}
            namespace={namespace}
            templateId={templateId}
            heading={heading}
            href={href}
            fallbackTitle={label}
            onResolved={setFetchedChars}
          />
        }
        title={title}
        maxWidth={maxWidth}
        className={styles.tooltip}
        panelClassName={styles.panel}
        closeLabel={t('close', { term: title })}>
        {trigger}
      </DetachableTooltip>
    </Suspense>
  );
};

export default Keyword;
