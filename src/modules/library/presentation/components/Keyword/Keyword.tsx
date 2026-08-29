/**
 * @fileoverview Keyword Inline MDX Component
 * @description Inline MDX component that renders a rules keyword linked to the
 * heading that defines it. The link target and the id of the baked shard both
 * arrive as props, resolved at compile time. Hover clones the shard out of its
 * inert `<template>`, so the definition costs no request. Leaving the keyword
 * with Shift held parks the card as a draggable panel.
 *
 * @module modules/library/presentation/components/Keyword/Keyword
 * @version 4.0.0
 * @author Typeir
 * @since 2026-08-19
 */

'use client';

import type { DetachableTooltipProps } from '@/lib/components/ui/detachableTooltip';
import { lookupKeyword } from '@/lib/md/keywordRegistry';
import { useLocale } from 'next-intl';
import type { compileRuntimeSync as CompileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import React, { useEffect, useMemo, useState, type ComponentType } from 'react';
import DiceRoll from '../DiceRoll';
import Unit from '../Unit';
import { useKeywordShard } from './KeywordShardContext';
import styles from './Keyword.module.scss';

/**
 * Loads the card machinery after hydration, so the server and the first client
 * render both emit the bare link and `Draggable` stays out of the initial
 * bundle. Resolves once per page rather than once per keyword.
 *
 * @returns {ComponentType<DetachableTooltipProps> | null} The component, or null until loaded
 */
function useDetachableTooltip(): ComponentType<DetachableTooltipProps> | null {
  const [component, setComponent] =
    useState<ComponentType<DetachableTooltipProps> | null>(null);

  useEffect(() => {
    let active = true;
    void import('@/lib/components/ui/detachableTooltip').then((module) => {
      if (active) setComponent(() => module.DetachableTooltip);
    });
    return () => {
      active = false;
    };
  }, []);

  return component;
}

/**
 * Props for the Keyword component. All values arrive as strings from the MDX
 * attribute layer.
 *
 * @typedef {object} KeywordProps
 * @property {string} term - Canonical term, e.g. "damage bonus"
 * @property {string} [display] - Author-written text with casing preserved; falls back to the term
 * @property {string} [namespace] - Namespace the term was referenced through, e.g. "condition"
 * @property {string} [href] - Locale-relative route and anchor of the defining heading
 * @property {string} [templateId] - Id of the baked `<template>` holding the shard prose
 * @property {string} [heading] - Heading text of the defining section, used as the card title
 * @property {boolean} [noLink] - When true, renders a `<span>` instead of an `<a>` to avoid nested anchors
 * @property {boolean} [noCard] - When true, renders the term without a hover card
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
}

/**
 * Props for the shard body.
 *
 * @typedef {object} KeywordShardProps
 * @property {string} templateId - Id of the shard to render
 */
interface KeywordShardProps {
  templateId: string;
}

/**
 * Compiles the shard source when the card opens. `compileRuntimeSync` caches by
 * source hash, so re-opening the same card costs nothing.
 *
 * Nested keywords render as plain links: a card inside a card would recurse
 * into its own shard.
 *
 * @param {KeywordShardProps} props - Component props
 * @returns {React.ReactElement | null} The rendered shard, or null when absent
 */
const shardComponents = {
  Unit,
  DiceRoll,
  Keyword: (props: KeywordProps) => <Keyword {...props} noCard />,
};

const KeywordShard: React.FC<KeywordShardProps> = ({ templateId }) => {
  const shard = useKeywordShard(templateId);
  const [compile, setCompile] = useState<typeof CompileRuntimeSync | null>(
    null,
  );

  /* Loaded here rather than imported: this component mounts when a card opens,
     so the MDX compiler stays out of the graph of every page that has a
     keyword in it. */
  useEffect(() => {
    let active = true;
    void import(
      '@/modules/library/infrastructure/compile/compileRuntime'
    ).then((module) => {
      if (active) setCompile(() => module.compileRuntimeSync);
    });
    return () => {
      active = false;
    };
  }, []);

  const content = useMemo(() => {
    if (!shard || !compile) return null;
    return compile({ source: shard.source, components: shardComponents })
      .content;
  }, [compile, shard]);

  if (!content) return null;

  return <div className={styles.blurb}>{content}</div>;
};

/**
 * Props for the card body.
 *
 * @typedef {object} KeywordCardProps
 * @property {string} title - Card title, shown at heading size
 * @property {React.ReactNode} children - Definition body
 */
interface KeywordCardProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Titled definition card shared by the hover tooltip and the parked panel.
 *
 * @param {KeywordCardProps} props - Component props
 * @returns {React.ReactElement} The rendered card
 */
const KeywordCard: React.FC<KeywordCardProps> = ({ title, children }) => (
  <div className={styles.card}>
    <h3 className={styles.cardTitle}>{title}</h3>
    {children}
  </div>
);

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
}) => {
  const locale = useLocale();
  const DetachableTooltip = useDetachableTooltip();
  const entry = lookupKeyword(term);
  const label = display ?? term;
  const target = href ?? entry?.href;

  if (!target) {
    return <span>{label}</span>;
  }

  const body = templateId ? (
    <KeywordShard templateId={templateId} />
  ) : entry?.blurb ? (
    <span className={styles.blurb}>{entry.blurb}</span>
  ) : null;

  const className = body ? styles.defined : styles.keyword;

  const trigger = noLink ? (
    <span className={className} data-keyword={term} data-namespace={namespace}>
      {label}
    </span>
  ) : (
    <a
      className={className}
      href={`/${locale}/${target}`}
      data-keyword={term}
      data-namespace={namespace}>
      {label}
    </a>
  );

  if (!body || !DetachableTooltip || noCard) {
    return trigger;
  }

  const title = heading ?? label;

  return (
    <DetachableTooltip
      content={<KeywordCard title={title}>{body}</KeywordCard>}
      title={title}
      className={styles.tooltip}
      panelClassName={styles.panel}
      closeLabel={`Close ${title}`}>
      {trigger}
    </DetachableTooltip>
  );
};

export default Keyword;
