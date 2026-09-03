/**
 * @fileoverview Shared compile option types for library MDX compilation flows.
 * @module modules/library/domain/compileOptions
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { EvaluateOptions } from 'next-mdx-remote-client/rsc';

type EvaluateMdxOptions = EvaluateOptions['mdxOptions'];

/**
 * Options accepted by module compile utilities.
 *
 * @interface CompileOptions
 * @property {string} source - Raw MDX content to compile.
 * @property {Record<string, unknown>} [components] - Optional MDX component registry.
 * @property {EvaluateMdxOptions} [mdxOptions] - Optional MDX plugin options.
 * @property {string} [baseUrl] - Optional base URL for relative links.
 * @property {boolean} [parseFrontmatter=true] - Whether frontmatter should be parsed.
 * @property {{ keys: string[]; records: string[] }} [aspects] - Aspect index: section keys carrying aspects and record anchors; a row is placed under each matching section.
 * @property {string} [locale] - Locale whose keyword index and shard prose to read. Defaults to the keyword registry's own default.
 * @property {boolean} [attributeRewrite] - Rewrite shortcodes in JSX string attributes; off keeps attribute strings raw.
 */
export interface CompileOptions {
  source: string;
  components?: Record<string, unknown>;
  mdxOptions?: EvaluateMdxOptions;
  baseUrl?: string;
  parseFrontmatter?: boolean;
  aspects?: { keys: string[]; records: string[] };
  locale?: string;
  attributeRewrite?: boolean;
}

export type { EvaluateMdxOptions };

