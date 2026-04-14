/**
 * @fileoverview Meta Tag Parser for MDX Content
 * @description Extracts `<Meta>` JSX directives from raw MDX text. Each
 * directive maps a `featureId` to a bag of key-value attributes consumed
 * by the feature metadata generator. The parser operates on raw text
 * (not compiled JSX) so it runs at build time without React.
 *
 * @module scripts/metadata/extraction/metaTagParser
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { META_TAG } from './featurePatterns';

/**
 * Parsed representation of a single `<Meta>` directive.
 *
 * @interface MetaDirective
 * @property {string} featureId - Stable feature ID (slug/feature-name)
 * @property {Record<string, string>} attrs - All remaining attributes as key-value pairs
 */
export interface MetaDirective {
  featureId: string;
  attrs: Record<string, string>;
}

/**
 * Regex to match self-closing `<Meta ... />` tags.
 * Captures the full attribute string for further parsing.
 */
const META_TAG_RE = META_TAG.tag;

/**
 * Regex to extract individual JSX attributes.
 * Matches `key="value"` or `key='value'` pairs.
 */
const ATTR_RE = META_TAG.attribute;

/**
 * Parses all `<Meta>` tags from raw MDX content.
 * Only extracts tags with `target="generator"` and `type="feature"`.
 *
 * @param {string} raw - Raw MDX file content
 * @returns {MetaDirective[]} Array of parsed directives
 */
export function parseMetaTags(raw: string): MetaDirective[] {
  const directives: MetaDirective[] = [];

  for (const tagMatch of raw.matchAll(META_TAG_RE)) {
    const attrString = tagMatch[1];
    const attrs: Record<string, string> = {};

    for (const attrMatch of attrString.matchAll(ATTR_RE)) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    if (attrs.target !== 'generator' || attrs.type !== 'feature') continue;
    if (!attrs.featureId) continue;

    const { target: _t, type: _ty, featureId, ...rest } = attrs;
    directives.push({ featureId, attrs: rest });
  }

  return directives;
}

/**
 * Finds a Meta directive matching a feature by its ID.
 *
 * @param {MetaDirective[]} directives - Parsed directives from a file
 * @param {string} featureId - Feature ID to match
 * @returns {MetaDirective | undefined} Matching directive or undefined
 */
export function findMetaForFeature(
  directives: MetaDirective[],
  featureId: string,
): MetaDirective | undefined {
  return directives.find((d) => d.featureId === featureId);
}
