/**
 * @fileoverview Rehype plugin that places an `<Aspects section="…" />` row in
 * every section and article whose anchor carries aspects in the article's
 * metadata.
 * @description Runs after `rehypeSectionize` and reads the bare slug it leaves
 * on `node.data.slug`. A row goes right after a section's heading, after the
 * label of an entry article (the lead paragraph splits at its first hard
 * break), and after the summary heading of an MDX container (Collapsible).
 * Keys are resolved record-first: `${record}/${slug}` when the enclosing stat
 * block has its own entry, else the bare `slug`. A record starts at a level-1
 * heading, or at a quoted heading (a statlet), whose slug is in `records`,
 * and holds for the siblings that follow it; a quote's records end with the
 * quote.
 * The component only receives the key; aspects are read from
 * `ArticleMetadataContext` at render time.
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
 * Name of the component this plugin emits; the MDX runtime resolves it via the component map.
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
 * Bare slug `rehypeSectionize` stamped on a section or article.
 *
 * @param {Element} node - Section or article element
 * @returns {string | undefined} The slug
 */
function slugOf(node: Element): string | undefined {
  return (node.data as { slug?: string } | undefined)?.slug;
}

/**
 * Splits an entry paragraph at its first `<br>` and places the row between
 * label and body; with no break the row follows the paragraph.
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
 * Rehype plugin factory. See file overview.
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

  /* `record` is scoped to one sibling list: a record heading changes it for
     the siblings that follow (a statlet's `---` closes the section but not
     the record), and a blockquote's records never leak out of the quote. */
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
