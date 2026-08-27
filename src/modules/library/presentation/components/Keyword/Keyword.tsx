/**
 * @fileoverview Keyword Inline MDX Component
 * @description Inline MDX component that renders a rules keyword linked to the
 * heading that defines it. The link target and the id of the baked shard both
 * arrive as props, resolved at compile time. Hover clones the shard out of its
 * inert `<template>`, so the definition costs no request.
 *
 * @module modules/library/presentation/components/Keyword/Keyword
 * @version 3.0.0
 * @author Typeir
 * @since 2026-08-19
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
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
 * @property {boolean} [noLink] - When true, renders a `<span>` instead of an `<a>` to avoid nested anchors
 */
export interface KeywordProps {
  term: string;
  display?: string;
  namespace?: string;
  href?: string;
  templateId?: string;
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
 * Clones the baked shard into the tooltip. Mounts only when the tooltip opens,
 * so the clone happens on first hover and never during page render.
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
  noLink = false,
}) => {
  const locale = useLocale();
  const entry = lookupKeyword(term);
  const label = display ?? term;
  const target = href ?? entry?.href;

  if (!target) {
    return <span>{label}</span>;
  }

  const definition = templateId ? (
    <KeywordShard templateId={templateId} />
  ) : entry?.blurb ? (
    <span className={styles.blurb}>{entry.blurb}</span>
  ) : null;

  const className = definition ? styles.defined : styles.keyword;

  const body = noLink ? (
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

  if (!definition) {
    return body;
  }

  return (
    <Tooltip
      content={definition}
      className={styles.tooltip}
      showArrow={false}
      inline>
      {body}
    </Tooltip>
  );
};

export default Keyword;
