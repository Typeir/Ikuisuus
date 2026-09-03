/**
 * @fileoverview Rehype plugin: wraps content between headings in sections, entries in articles. Adds anchors, slugs and stream rails.
 *
 * @module modules/library/infrastructure/compile/rehypeSectionize
 * @version 2.1.0
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
 * Plugin options.
 *
 * @property {string} [streamText] - Stream string for terminal-stream animation
 * @property {boolean} [articles=true] - Run entry → article pass
 * @property {readonly string[]} [entryComponents] - MDX components that are entries: one that opens with a heading is wrapped in a section of that heading's level, beside its siblings, with its anchor claimed
 */
export type RehypeSectionizeOptions = {
  streamText?: string;
  articles?: boolean;
  entryComponents?: readonly string[];
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
 * Determines whether a HAST node is whitespace-only text, the newlines the
 * converter leaves between an MDX component's block children.
 *
 * @param {RootContent} node - HAST node to test
 * @returns {boolean} True for a text node with no visible content
 */
function isBlankText(node: RootContent): boolean {
  return node.type === 'text' && node.value.trim().length === 0;
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
 * Test if node's children should be sectioned.
 *
 * @param {RootContent} node - HAST node to test
 * @returns {boolean} True when the node's children should be sectioned
 */
function isContainer(node: RootContent): node is RootContent & Parent {
  if (node.type === 'element') return (node as Element).tagName === 'blockquote';
  return (node.type as unknown as string) === 'mdxJsxFlowElement';
}

/**
 * The heading an MDX component opens with, when its first non-blank child is
 * one.
 *
 * @param {Parent} container - MDX flow element
 * @returns {Element | null} The lead heading, or null
 */
function leadHeadingOf(container: Parent): Element | null {
  const first = (container.children as RootContent[]).find(
    (child) => !isBlankText(child),
  );
  return first && isHeading(first) ? first : null;
}

/**
 * Slug of heading text without trailing inline JSX.
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
  /* A heading that opens an MDX component is its summary and stays a direct
     child. Once any other content has come first, the component is a wrapper
     and its headings section normally. */
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
    if (leadHeadingPending && !isHeading(node) && !isBlankText(node)) {
      leadHeadingPending = false;
    }

    if (isContainer(node)) {
      const owner = stack.length ? stack[stack.length - 1].anchor : parentAnchor;
      const isJsx = (node.type as unknown as string) === 'mdxJsxFlowElement';
      node.children = sectionize(node.children, opts, anchors, owner, isJsx);

      const isEntry =
        isJsx &&
        (opts?.entryComponents ?? []).includes(
          (node as unknown as { name?: string }).name ?? '',
        );
      const lead = isEntry ? leadHeadingOf(node) : null;
      if (lead) {
        /* An entry sections like a heading of its own level, beside its
           siblings; the heading stays its first child so the component still
           finds it, and both carry the claimed anchor. */
        const level = headingLevel(lead);
        pendingAnonymousSection = false;
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        const entryOwner = stack.length ? stack[stack.length - 1].anchor : parentAnchor;
        const slug = headingAnchor(lead);
        const anchor = anchors.claim(slug, entryOwner);
        lead.properties = { ...lead.properties, 'data-anchor': anchor };
        const section = (h as unknown as (t: string, p: object) => Element)(
          'section',
          props({
            'data-heading-level': level,
            'data-anchor': anchor,
            'data-entry': true,
          }),
        );
        section.data = { slug } as unknown as Element['data'];
        section.children = [node as ElementContent];
        attach(section);
        stack.push({ level, section, anchor });
        continue;
      }

      append(node);
      continue;
    }

    if (isHeading(node) && leadHeadingPending) {
      leadHeadingPending = false;
      /* Unclaimed on purpose: duplicate lead headings keep identical slugs. */
      node.properties = {
        ...node.properties,
        'data-anchor': headingAnchor(node),
      };
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
      node.properties = { ...node.properties, 'data-anchor': anchor };
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

/* ─────────────────────────  Pass 3: stream rails  ───────────────────── */

/**
 * Rail element the stream text scrolls inside. Hidden from assistive tech;
 * the text is ornament.
 *
 * @param {'left' | 'right'} side - Section edge the rail hugs
 * @returns {Element} Rail element
 */
function streamRail(side: 'left' | 'right'): Element {
  return (h as unknown as (t: string, p: object) => Element)('span', {
    'aria-hidden': 'true',
    'data-stream-rail': side,
  });
}

/**
 * Whether a node is one of a section's entries: a list, or an entry component
 * wrapped in its own section.
 *
 * @param {ElementContent} node - Child node of a section
 * @returns {boolean} True when the node is an entry holder
 */
function isEntryChild(node: ElementContent): boolean {
  if (node.type !== 'element') return false;
  if (node.tagName === 'ul' || node.tagName === 'ol') return true;
  return (
    node.tagName === 'section' &&
    (node.properties?.['data-entry'] ?? node.properties?.dataEntry) !== undefined
  );
}

/**
 * Adds rails to every heading section: a left rail always, a right rail when
 * the section holds entries. The text comes from the host's inherited
 * `--stream-text`, so no option gates this. Rails go after the heading so
 * `children[0]` stays the heading for later passes.
 *
 * @param {Parent} node - Node whose subtree to walk
 */
function addStreamRails(node: Parent): void {
  for (const c of node.children) {
    if (!Array.isArray((c as unknown as Partial<Parent>).children)) continue;
    const el = c as Element;
    const level =
      el.properties?.['data-heading-level'] ?? el.properties?.dataHeadingLevel;
    const headed =
      c.type === 'element' && el.tagName === 'section' && level !== undefined;
    if (headed) {
      const rails = [streamRail('left')];
      const hasList = el.children.some((x) => isEntryChild(x));
      if (hasList) rails.push(streamRail('right'));
      const lead = el.children[0];
      el.children.splice(lead && isHeading(lead as RootContent) ? 1 : 0, 0, ...rails);
    }
    addStreamRails(c as unknown as Parent);
  }
}

/* ────────────────────────────  Plugin  ─────────────────────────────── */

/**
 * Plugin: sections, articles, then stream rails.
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
    addStreamRails(tree as unknown as Parent);
  };
};

export default rehypeSectionize;
