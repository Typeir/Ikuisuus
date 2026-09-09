/**
 * @fileoverview Rehype plugin inserting the Aspects row a record wears.
 * @description Only the title of a record carries a row.
 *
 * @module modules/library/infrastructure/compile/rehypeAspects
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { Element, ElementContent, Root, RootContent } from 'hast';
import type { Plugin } from 'unified';
import { headingAnchor } from './rehypeSectionize';
import type { Parent } from './sectionizeArticles';

/**
 * Component name emitted by plugin.
 *
 * @constant
 */
export const ASPECTS_COMPONENT_NAME = 'Aspects';

/**
 * Options accepted by the plugin.
 *
 * @property {string[]} [keys] - Section keys that carry aspects (`slug` or `record/slug`)
 * @property {string[]} [records] - Anchors of the document's stat block titles, file order
 */
export interface RehypeAspectsOptions {
  keys?: string[];
  records?: string[];
}

/**
 * Builds the `<Aspects section="…" />` flow element.
 *
 * @param {string} section - Metadata key resolved at render time
 * @returns {RootContent} An MDX JSX flow element node
 */
function aspectsNode(section: string): RootContent {
  return {
    type: 'mdxJsxFlowElement',
    name: ASPECTS_COMPONENT_NAME,
    attributes: [{ type: 'mdxJsxAttribute', name: 'section', value: section }],
    children: [],
  } as unknown as RootContent;
}

/**
 * Extract slug from node data.
 *
 * @param {Element} node - Section or article element
 * @returns {string | undefined} The slug
 */
function slugOf(node: Element): string | undefined {
  return (node.data as { slug?: string } | undefined)?.slug;
}

/**
 * Plugin factory.
 *
 * @param {RehypeAspectsOptions} [options] - Plugin options
 * @returns {(tree: Root) => void} Transformer
 */
const rehypeAspects: Plugin<[RehypeAspectsOptions?], Root> = (options) => {
  const keys = new Set(options?.keys ?? []);
  const records = new Set(options?.records ?? []);
  const firstRecord = options?.records?.[0];

  const keyOf = (slug: string, record: string | undefined): string | null => {
    if (record && keys.has(`${record}/${slug}`)) return `${record}/${slug}`;
    return keys.has(slug) ? slug : null;
  };

  /* Record scope: headings set for following siblings; blockquote scope is local. */
  const walk = (
    node: Parent,
    initialRecord: string | undefined,
    inQuote: boolean,
  ): void => {
    let record = initialRecord;
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i];
      const type = c.type as unknown as string;

      if (type === 'mdxJsxFlowElement') {
        walk(c as unknown as Parent, record, inQuote);
        continue;
      }

      if (c.type !== 'element') continue;

      if (c.tagName === 'section') {
        const slug = slugOf(c);
        const heading = c.children[0];
        const level =
          heading?.type === 'element' && /^h[1-6]$/.test(heading.tagName)
            ? Number(heading.tagName[1])
            : 0;
        let key: string | null = null;
        if (slug && records.has(slug) && (level === 1 || inQuote)) {
          record = slug;
          key = keys.has(slug) ? slug : null;
        } else if (slug) {
          key = keyOf(slug, record);
        }
        if (key && level === 1) {
          c.children.splice(1, 0, aspectsNode(key) as ElementContent);
        }
        walk(c as unknown as Parent, record, inQuote);
        continue;
      }

      if (c.tagName === 'article') {
        walk(c as unknown as Parent, record, inQuote);
        continue;
      }

      walk(
        c as unknown as Parent,
        record,
        inQuote || c.tagName === 'blockquote',
      );
    }
  };

  return (tree: Root) => {
    if (keys.size === 0) return;
    walk(tree as unknown as Parent, firstRecord, false);
  };
};

export default rehypeAspects;
