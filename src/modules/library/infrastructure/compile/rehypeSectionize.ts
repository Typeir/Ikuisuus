/**
 * @fileoverview Rehype plugin that wraps MDX content between headings in semantic section
 * elements, then wraps feature entries in articles.
 * @description Pass 1 groups the sibling nodes that follow a heading into a `<section>`
 * (`data-heading-level`, `data-anchor`); a horizontal rule closes every open
 * section and opens an anonymous one for what follows. The pass recurses into
 * blockquotes and MDX JSX flow elements (statlets, collapsibles) so every
 * heading in the document owns a section. Pass 2 wraps feature entries —
 * bold-led list items and bold-led paragraphs inside a section — in
 * `<article data-anchor>` (`li > article`, never `ul > article`). Anchors use
 * the shared `anchorSlug` rule so headings, sections, articles and metadata
 * agree; a duplicate anchor inside one document is prefixed with its parent
 * section's anchor. Every section and article also carries its bare
 * (pre-dedup) slug on `node.data.slug` for `rehypeAspects`.
 *
 * @module rehypeSectionize
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';
import { Anchors, articleize, textOf, type Parent } from './sectionizeArticles';
import type { Element, ElementContent, Root, RootContent } from 'hast';
import { h } from 'hastscript';
import type { Plugin } from 'unified';

/**
 * Options accepted by the rehypeSectionize plugin.
 *
 * @property {string} [streamText] - Pre-composed doubled stream string to stamp as
 *   `data-stream` on every emitted `<section>` element. Read by the CSS
 *   terminal-stream animation via `content: attr(data-stream)`.
 *   When absent, no `data-stream` attribute is added.
 * @property {boolean} [articles=true] - Run the entry → article pass
 */
export type RehypeSectionizeOptions = {
  streamText?: string;
  articles?: boolean;
};


/**
 * Determines whether a HAST node is an H1–H6 heading element.
 *
 * @param {RootContent} node - HAST node to test
 * @returns {boolean} True when the node is a heading element
 */
function isHeading(node: RootContent): node is Element {
  return node.type === 'element' && /^h[1-6]$/.test((node as Element).tagName);
}

/**
 * Extracts the numeric heading level from an element's tagName.
 *
 * @param {Element} node - Heading element (h1–h6)
 * @returns {number} Heading level (1–6)
 */
function headingLevel(node: Element): number {
  return parseInt(node.tagName[1], 10);
}

/**
 * Determines whether a HAST node is a thematic break / horizontal rule.
 *
 * @param {RootContent} node - HAST node to test
 * @returns {boolean} True when the node is a horizontal rule
 */
function isHr(node: RootContent): boolean {
  return (
    (node.type === 'element' && (node as Element).tagName === 'hr') ||
    (node.type as unknown as string) === 'thematicBreak'
  );
}

/**
 * Containers the sectionizer descends into: blockquotes (statlets) and MDX
 * JSX flow elements (collapsibles and other authored wrappers).
 *
 * @param {RootContent} node - HAST node to test
 * @returns {boolean} True when the node's children should be sectioned
 */
function isContainer(node: RootContent): node is RootContent & Parent {
  if (node.type === 'element') return (node as Element).tagName === 'blockquote';
  return (node.type as unknown as string) === 'mdxJsxFlowElement';
}

/**
 * Anchor of a heading: slug of its text minus any trailing inline JSX
 * (a Collapsible's `<span>5 BP</span>` cost).
 *
 * @param {Element} heading - Heading element
 * @returns {string} Anchor slug
 */
export function headingAnchor(heading: Element): string {
  const own = heading.children.filter(
    (c) => (c.type as unknown as string) !== 'mdxJsxTextElement',
  );
  return anchorSlug(toPlainMeasure(own.map((c) => textOf(c)).join('')));
}

/* ─────────────────────────  Pass 1: sections  ───────────────────────── */

type StackItem = { level: number; section: Element; anchor: string };

/**
 * Sections one list of siblings in place, recursing into containers.
 *
 * @param {RootContent[]} nodes - Sibling nodes to section
 * @param {RehypeSectionizeOptions | undefined} opts - Plugin options
 * @param {Anchors} anchors - Document anchor registry
 * @param {string | undefined} parentAnchor - Anchor of the enclosing section, if any
 * @returns {RootContent[]} Sectioned siblings
 */
function sectionize(
  nodes: RootContent[],
  opts: RehypeSectionizeOptions | undefined,
  anchors: Anchors,
  parentAnchor: string | undefined,
  ownerHeading = false,
): RootContent[] {
  const result: RootContent[] = [];
  const stack: StackItem[] = [];
  let pendingAnonymousSection = false;
  /* An MDX component (Collapsible) reads its own first heading as its
     summary; that heading stays a direct child, everything after it is
     sectioned as usual. */
  let leadHeadingPending = ownerHeading;

  const attach = (section: Element) => {
    if (stack.length === 0) result.push(section);
    else stack[stack.length - 1].section.children.push(section as ElementContent);
  };
  const append = (node: RootContent) => {
    if (stack.length) stack[stack.length - 1].section.children.push(node as ElementContent);
    else result.push(node);
  };
  const props = (extra: Record<string, unknown>) => ({
    ...extra,
    ...(opts?.streamText ? { 'data-stream': opts.streamText } : {}),
  });

  for (const node of nodes) {
    if (isContainer(node)) {
      const owner = stack.length ? stack[stack.length - 1].anchor : parentAnchor;
      const isJsx = (node.type as unknown as string) === 'mdxJsxFlowElement';
      node.children = sectionize(node.children, opts, anchors, owner, isJsx);
      append(node);
      continue;
    }

    if (isHeading(node) && leadHeadingPending) {
      leadHeadingPending = false;
      result.push(node);
      continue;
    }

    if (isHeading(node)) {
      const level = headingLevel(node);
      pendingAnonymousSection = false;
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      const owner = stack.length ? stack[stack.length - 1].anchor : parentAnchor;
      const slug = headingAnchor(node);
      const anchor = anchors.claim(slug, owner);
      const section = (h as unknown as (t: string, p: object) => Element)(
        'section',
        props({ 'data-heading-level': level, 'data-anchor': anchor }),
      );
      section.data = { slug } as unknown as Element["data"];
      section.children = [node];
      attach(section);
      stack.push({ level, section, anchor });
      continue;
    }

    if (isHr(node)) {
      stack.length = 0;
      pendingAnonymousSection = true;
      result.push(node);
      continue;
    }

    if (pendingAnonymousSection && stack.length === 0) {
      pendingAnonymousSection = false;
      const section = (h as unknown as (t: string, p: object) => Element)(
        'section',
        props({ 'data-heading-level': 0 }),
      );
      section.children = [node as ElementContent];
      attach(section);
      stack.push({ level: 0, section, anchor: parentAnchor ?? '' });
      continue;
    }

    append(node);
  }

  return result;
}

/* ────────────────────────────  Plugin  ─────────────────────────────── */

/**
 * Rehype plugin: sections, then articles. See file overview.
 *
 * @param {RehypeSectionizeOptions} [opts] - Plugin options
 * @returns {(tree: Root) => void} Transformer
 */
const rehypeSectionize: Plugin<[RehypeSectionizeOptions?], Root> = (
  opts?: RehypeSectionizeOptions,
) => {
  return (tree: Root) => {
    const anchors = new Anchors();
    tree.children = sectionize(tree.children, opts, anchors, undefined);
    if (opts?.articles !== false) {
      articleize(tree as unknown as Parent, anchors, undefined, false, false, false);
    }
  };
};

export default rehypeSectionize;
