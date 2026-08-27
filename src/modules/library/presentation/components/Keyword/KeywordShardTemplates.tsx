/**
 * @fileoverview Keyword Shard Templates
 * @description Renders one inert `<template>` per keyword the page references.
 * Content is set through `dangerouslySetInnerHTML` so React never reconciles
 * the children: the HTML parser moves a template's children into its
 * `content` fragment, and a React-managed template fails hydration because the
 * element itself then has none.
 *
 * @module modules/library/presentation/components/Keyword/KeywordShardTemplates
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { BakedShard } from '@/lib/md/bakeKeywordShards';
import React from 'react';

/**
 * Builds the component that renders a document's baked shards.
 *
 * @param {BakedShard[]} shards - Shards resolved for the document
 * @returns {React.FC} Component emitting one template per shard
 */
export function keywordShardTemplates(shards: BakedShard[]): React.FC {
  return function KeywordShardTemplates() {
    return (
      <>
        {shards.map((shard) => (
          <template
            key={shard.id}
            id={shard.id}
            data-keyword-shard=''
            dangerouslySetInnerHTML={{ __html: shard.html }}
          />
        ))}
      </>
    );
  };
}
