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

import { DetachableTooltip } from '@/lib/components/ui/detachableTooltip';
import { lookupKeyword } from '@/lib/md/keywordRegistry';
import { useLocale } from 'next-intl';
import React, { useEffect, useRef } from 'react';
import styles from './Keyword.module.scss';

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
 */
export interface KeywordProps {
  term: string;
  display?: string;
  namespace?: string;
  href?: string;
  templateId?: string;
  heading?: string;
  noLink?: boolean;
}

/**
 * Props for the shard body.
 *
 * @typedef {object} KeywordShardProps
 * @property {string} templateId - Id of the template to clone
 */
interface KeywordShardProps {
  templateId: string;
}

/**
 * Clones the baked shard into the card. Mounts only when the card opens, so the
 * clone happens on first hover and never during page render.
 *
 * @param {KeywordShardProps} props - Component props
 * @returns {React.ReactElement} Host element for the cloned fragment
 */
const KeywordShard: React.FC<KeywordShardProps> = ({ templateId }) => {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = host.current;
    if (!target) return;

    const template = document.getElementById(templateId);
    if (!(template instanceof HTMLTemplateElement)) return;

    target.replaceChildren(template.content.cloneNode(true));
  }, [templateId]);

  return <div ref={host} className={styles.blurb} />;
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
}) => {
  const locale = useLocale();
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

  if (!body) {
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
