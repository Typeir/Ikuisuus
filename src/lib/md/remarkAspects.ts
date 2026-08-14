/**
 * @fileoverview Inserts an `<Aspects section="..." />` element after each heading
 * and inside each qualifying bold-label list entry whose text appears in
 * `sections`. Rows go inside the `<li>`; the entry splits at its first hard break.
 * Emits a `section` key only; aspects are read from metadata at render time.
 * Must run before `remarkUnit`, which replaces measures with `<Unit>` elements.
 *
 * @module lib/md/remarkAspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import type { Heading, ListItem, Paragraph, Root } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { SKIP, visit } from 'unist-util-visit';

/**
 * Name of the component this plugin emits; the MDX runtime resolves it via the component map.
 *
 * @constant
 */
export const ASPECTS_COMPONENT_NAME = 'Aspects';

/**
 * Options accepted by the plugin.
 *
 * @property {string[]} [sections] - Raw heading texts that have aspects
 */
export interface RemarkAspectsOptions {
  sections?: string[];
}

/**
 * Concatenates text/inlineCode/html values of a node's inline children. JSX is skipped whole.
 *
 * @param {Node} node - The node whose text to gather
 * @returns {string} The concatenated text
 */
function inlineText(node: Node): string {
  let text = '';

  visit(node, (child) => {
    if (child.type === 'mdxJsxTextElement') return SKIP;

    if (
      (child.type === 'text' ||
        child.type === 'inlineCode' ||
        child.type === 'html') &&
      'value' in child &&
      typeof child.value === 'string'
    ) {
      text += child.value;
    }

    return undefined;
  });

  return text;
}

/**
 * Heading section key, measure-normalised the same way the generator
 * normalises feature names (`[= 12 stride;ADJ =]` → `12 stride`).
 *
 * @param {Heading} heading - The heading node
 * @returns {string} The heading's text
 */
function headingText(heading: Heading): string {
  return toPlainMeasure(inlineText(heading).trim());
}

/**
 * Section key of a bold-label list entry (`- **Pseudopod Slam.** prose`).
 * Qualifies with prose after the label — inline or as a following block; a
 * label holding only a nested list does not. Key mirrors the extractor's
 * bold-label normalisation: plain text, periods removed.
 *
 * @param {ListItem} item - The list entry to inspect
 * @returns {string | undefined} The section key, or undefined for a non-feature entry
 */
function listItemSection(item: ListItem): string | undefined {
  const [lead, next] = item.children;
  if (lead?.type !== 'paragraph') return undefined;

  const [label, ...rest] = lead.children;
  if (label?.type !== 'strong') return undefined;

  const hasInlineProse = rest.some(
    (node) =>
      node.type !== 'break' &&
      !(node.type === 'text' && node.value.trim() === ''),
  );
  if (!hasInlineProse && next?.type !== 'paragraph') return undefined;

  return toPlainMeasure(inlineText(label).replace(/\./g, '').trim());
}

/**
 * Builds the `<Aspects section="…" />` flow element.
 *
 * @param {string} section - The section key, matched against metadata at render time
 * @returns {object} An MDX JSX flow element node
 */
function aspectsNode(section: string) {
  return {
    type: 'mdxJsxFlowElement',
    name: ASPECTS_COMPONENT_NAME,
    attributes: [
      { type: 'mdxJsxAttribute', name: 'section', value: section },
    ],
    children: [],
  };
}

/**
 * Remark plugin factory that inserts an aspect row after each heading — and
 * inside each qualifying bold-label list entry — whose text appears in
 * `sections`.
 *
 * @param {RemarkAspectsOptions} [options] - Plugin options
 * @returns {Plugin<[], Root>} A unified plugin that transforms the MDAST
 */
const remarkAspects: Plugin<[RemarkAspectsOptions?], Root> = (options) => {
  const sections = new Set(options?.sections ?? []);

  return (tree: Root) => {
    if (sections.size === 0) return;

    const insertions: Array<{
      parent: Parent;
      index: number;
      section: string;
    }> = [];

    visit(tree, 'heading', (node, index, parent) => {
      if (!parent || index === null || index === undefined) return;

      const text = headingText(node as Heading);
      if (!sections.has(text)) return;

      insertions.push({ parent: parent as Parent, index, section: text });
    });

    const entries: Array<{ item: ListItem; section: string }> = [];

    visit(tree, 'listItem', (node) => {
      const item = node as ListItem;
      const section = listItemSection(item);
      if (!section || !sections.has(section)) return;

      entries.push({ item, section });
    });

    for (const { parent, index, section } of insertions.reverse()) {
      parent.children.splice(index + 1, 0, aspectsNode(section) as never);
    }

    /* Inside the entry, not between list items — keeps the ul intact. The
       lead paragraph splits at its first hard break so the row sits between
       label and prose, matching heading placement. */
    for (const { item, section } of entries) {
      const lead = item.children[0] as Paragraph;
      const breakIndex = lead.children.findIndex(
        (child) => child.type === 'break',
      );

      if (breakIndex === -1) {
        item.children.splice(1, 0, aspectsNode(section) as never);
        continue;
      }

      const label: Paragraph = {
        type: 'paragraph',
        children: lead.children.slice(0, breakIndex),
      };
      const body = lead.children.slice(breakIndex + 1);
      const rest: Paragraph[] = body.length
        ? [{ type: 'paragraph', children: body }]
        : [];

      item.children.splice(
        0,
        1,
        ...([label, aspectsNode(section), ...rest] as never[]),
      );
    }
  };
};

export default remarkAspects;
