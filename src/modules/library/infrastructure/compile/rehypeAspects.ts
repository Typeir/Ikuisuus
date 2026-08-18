/**
 * @fileoverview Rehype plugin inserting Aspects rows in sections and articles. Reads from rehypeSectionize.
 *
 * @module rehypeAspects
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
 * Split paragraph at first br; place row between label and body.
 *
 * @param {Parent} parent - Node holding the paragraph
 * @param {number} index - Index of the paragraph in `parent.children`
 * @param {string} key - Section key
 */
function placeAfterLabel(parent: Parent, index: number, key: string): void {
  const p = parent.children[index] as Element;
  const br = p.children.findIndex(
    (c) => c.type === 'element' && c.tagName === 'br',
  );
  if (br === -1) {
    parent.children.splice(index + 1, 0, aspectsNode(key));
    return;
  }
  const label: Element = { ...p, children: p.children.slice(0, br) };
  const body = p.children.slice(br + 1);
  const rest: ElementContent[] = body.length
    ? [{ ...p, children: body } as ElementContent]
    : [];
  parent.children.splice(index, 1, label, aspectsNode(key), ...rest);
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
        const jsx = c as unknown as Parent;
        const lead = jsx.children[0];
        if (
          lead?.type === 'element' &&
          /^h[1-6]$/.test((lead as Element).tagName)
        ) {
          const key = keyOf(headingAnchor(lead as Element), record);
          if (key) jsx.children.splice(1, 0, aspectsNode(key));
        }
        walk(jsx, record, inQuote);
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
        if (key && level > 0) c.children.splice(1, 0, aspectsNode(key) as ElementContent);
        walk(c as unknown as Parent, record, inQuote);
        continue;
      }

      if (c.tagName === 'article') {
        const slug = slugOf(c);
        const key = slug ? keyOf(slug, record) : null;
        const lead = c.children.findIndex((x) => x.type === 'element');
        if (key && lead !== -1 && (c.children[lead] as Element).tagName === 'p') {
          placeAfterLabel(c as unknown as Parent, lead, key);
        } else if (key) {
          c.children.splice(lead === -1 ? 0 : lead + 1, 0, aspectsNode(key) as ElementContent);
        }
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
