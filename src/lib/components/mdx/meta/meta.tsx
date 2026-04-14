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
 * Noop component that renders nothing. Exists solely as a typed JSX tag
 * that the metadata generator's regex parser can extract from raw MDX.
 *
 * @param {MetaProps} _props - Meta attributes (consumed by generator, not React)
 * @returns {null} Always returns null
 */
function Meta(_props: MetaProps): null {
  return null;
}

export default Meta;
export type { MetaProps };

