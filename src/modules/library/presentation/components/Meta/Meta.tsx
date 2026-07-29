/**
 * @fileoverview Invisible metadata directive component for MDX content.
 * @description Renders nothing in the browser. Parsed at build time by the
 * feature metadata generator to attach structured metadata to monster
 * features. Place `<Meta>` tags immediately after the feature heading in
 * `.sheet.mdx` files.
 *
 * @example
 * ```mdx
 * #### Faterender (Costs 3 Actions)
 * <Meta target="generator" type="feature" featureId="war-godess-yskeia/faterender" customHandler="instant_death" />
 * ```
 *
 * @module src/lib/components/mdx/meta/meta
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import type { JSX } from 'react';

/**
 * Props for the Meta MDX component.
 *
 * @interface MetaProps
 * @property {'generator'} target - Processing target (always "generator")
 * @property {'feature'} type - Directive type (always "feature")
 * @property {string} featureId - Stable feature ID (slug/feature-name)
 * @property {string} [customHandler] - Name of a custom extraction handler
 * @property {string} [key: string] - Additional freeform attributes
 */
interface MetaProps {
  target: 'generator';
  type: 'feature';
  featureId: string;
  customHandler?: string;
  [key: string]: string | undefined;
}

/**
 * Renders an invisible `<span>` carrying metadata as `data-*` attributes.
 * The generator's regex parser extracts `<Meta>` from raw MDX at build time;
 * this component ensures the rendered HTML also retains the directive data
 * for inspection and downstream tooling.
 *
 * @component Meta
 * @param {MetaProps} props - Meta attributes
 * @param {'generator'} props.target - Processing target
 * @param {'feature'} props.type - Directive type
 * @param {string} props.featureId - Stable feature ID
 * @param {string} [props.customHandler] - Handler name
 * @returns {JSX.Element} Hidden span with data attributes
 */
function Meta({
  target: _target,
  type: _type,
  featureId,
  customHandler,
  ...rest
}: MetaProps): JSX.Element {
  const dataAttrs: Record<string, string | undefined> = {
    'data-meta-feature-id': featureId,
    'data-meta-handler': customHandler,
  };
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      dataAttrs[`data-meta-${key}`] = value;
    }
  }
  return <span hidden aria-hidden='true' {...dataAttrs} />;
}

export default Meta;
export type { MetaProps };

