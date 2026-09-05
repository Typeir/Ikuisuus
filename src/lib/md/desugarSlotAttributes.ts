/**
 * @fileoverview Slot attributes as markdown.
 * @description Turns `<Feature cost="1/[# kw:Repose #]">` into the element
 * form, `<Cost>1/[# kw:Repose #]</Cost>`, before any other plugin runs, so a
 * slot value written as an attribute is ordinary markdown from there on: the
 * shortcode plugins reach it with their usual text visit, emphasis and links
 * become real nodes through the component registry, and the card reads the
 * value through the element path it already supports.
 *
 * Only a value that needs parsing is moved. Plain prose stays a string
 * attribute, since the heirloom brief assembles its sentences from strings.
 *
 * @module lib/md/desugarSlotAttributes
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-03
 */

import type { Paragraph, PhrasingContent, Root, RootContent } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Plugin } from 'unified';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';
import { DICE_EXPR_REGEX } from './diceExpressionParser';
import { KEYWORD_EXPR_REGEX } from './keywordExpressionParser';
import { ASPECT_EXPR_REGEX } from './remarkAspect';
import { UNIT_EXPR_REGEX } from './unitExpressionParser';

/**
 * Slot name to authored element name, for one host component.
 */
export type SlotElementMap = Readonly<Record<string, string>>;

/**
 * Options accepted by the plugin.
 *
 * @property {Readonly<Record<string, SlotElementMap>>} hosts - Component name to its slots
 */
export interface DesugarSlotAttributesOptions {
  hosts: Readonly<Record<string, SlotElementMap>>;
}

/**
 * MDAST node type for an MDX JSX element.
 */
interface MdxJsxElementNode extends Node {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
  name: string | null;
  attributes: Array<{ type: string; name?: string; value?: unknown }>;
  children: RootContent[];
}

/**
 * Any shortcode family. A value carrying one needs parsing even when markdown
 * reads it as plain text.
 */
const SHORTCODE_REGEX = new RegExp(
  [
    UNIT_EXPR_REGEX.source,
    DICE_EXPR_REGEX.source,
    KEYWORD_EXPR_REGEX.source,
    ASPECT_EXPR_REGEX.source,
  ].join('|'),
);

/**
 * Inline parser, the document's own minus the MDX extension: an attribute
 * value is phrasing, never a component.
 */
const parser = unified().use(remarkParse).use(remarkGfm);

/**
 * Where a host's slot run goes: after the heading the host opens with, which
 * titles it and has to stay first for sectionize, and at the front otherwise.
 * A heading deeper in the children belongs to a group inside the host, and
 * putting the run after that one would file the slots under it.
 *
 * @param {RootContent[]} children - Host children
 * @returns {number} Insertion index
 */
function slotRunIndex(children: RootContent[]): number {
  const first = children.findIndex(
    (child) => !(child.type === 'text' && !child.value.trim()),
  );
  return first >= 0 && children[first].type === 'heading' ? first + 1 : 0;
}

/**
 * Phrasing content of an attribute value, or null when the value is not one
 * paragraph of phrasing.
 *
 * @param {string} value - Attribute value
 * @returns {PhrasingContent[] | null} Parsed phrasing
 */
function phrasingOf(value: string): PhrasingContent[] | null {
  const root = parser.parse(value) as Root;
  if (root.children.length !== 1 || root.children[0].type !== 'paragraph') {
    return null;
  }
  return (root.children[0] as Paragraph).children;
}

/**
 * Whether a value has to become an element: markdown parsed it into something
 * other than one plain text run, or it carries a shortcode.
 *
 * @param {string} value - Attribute value
 * @param {PhrasingContent[]} phrasing - Its parsed phrasing
 * @returns {boolean} True when the value needs parsing
 */
function needsParsing(value: string, phrasing: PhrasingContent[]): boolean {
  if (SHORTCODE_REGEX.test(value)) return true;
  if (phrasing.length !== 1) return true;
  const only = phrasing[0];
  return only.type !== 'text' || only.value !== value;
}

/**
 * Attribute naming the slot a JSX element fills. A card reads its slots off
 * this, never off the component's identity, which a server boundary hides.
 */
export const SLOT_NAME_ATTRIBUTE = 'data-slot';

/**
 * Slot element node holding the parsed value.
 *
 * @param {string} element - Authored element name
 * @param {string} slot - Slot name
 * @param {PhrasingContent[]} children - Parsed value
 * @returns {RootContent} Inline MDX JSX element
 */
function slotElement(
  element: string,
  slot: string,
  children: PhrasingContent[],
): RootContent {
  return {
    type: 'mdxJsxTextElement',
    name: element,
    attributes: [
      { type: 'mdxJsxAttribute', name: SLOT_NAME_ATTRIBUTE, value: slot },
    ],
    children,
  } as unknown as RootContent;
}

/**
 * Stamps the slot name on a slot element an author wrote by hand, so both
 * spellings reach the card the same way.
 *
 * @param {RootContent} node - Candidate node
 * @param {Readonly<Record<string, string>>} elementSlots - Element name to slot name
 * @returns {void}
 */
function stampAuthoredSlot(
  node: RootContent,
  elementSlots: Readonly<Record<string, string>>,
): void {
  const element = node as unknown as MdxJsxElementNode;
  const type = element.type as string;
  if (type !== 'mdxJsxTextElement' && type !== 'mdxJsxFlowElement') return;

  const slot = elementSlots[element.name ?? ''];
  if (!slot) return;
  if (
    element.attributes.some(
      (attribute) => attribute.name === SLOT_NAME_ATTRIBUTE,
    )
  ) {
    return;
  }
  element.attributes.push({
    type: 'mdxJsxAttribute',
    name: SLOT_NAME_ATTRIBUTE,
    value: slot,
  });
}

/**
 * Moves a host's parseable slot attributes into slot elements, gathered in one
 * paragraph among the host's own children, where the card's slot-run reader
 * finds them and sectionize still sees the host's heading first.
 *
 * @param {MdxJsxElementNode} node - Host element
 * @param {SlotElementMap} slots - Its slots
 * @returns {void}
 */
function desugarHost(node: MdxJsxElementNode, slots: SlotElementMap): void {
  const moved: RootContent[] = [];
  const kept: MdxJsxElementNode['attributes'] = [];
  const elementSlots = Object.fromEntries(
    Object.entries(slots).map(([slot, element]) => [element, slot]),
  );

  const stampAll = (children: RootContent[]): void => {
    for (const child of children) {
      stampAuthoredSlot(child, elementSlots);
      const inner = (child as unknown as { children?: RootContent[] }).children;
      if (inner) stampAll(inner);
    }
  };
  stampAll(node.children);

  for (const attribute of node.attributes) {
    const name = attribute.name ?? '';
    const element = slots[name];
    if (
      attribute.type !== 'mdxJsxAttribute' ||
      !element ||
      typeof attribute.value !== 'string'
    ) {
      kept.push(attribute);
      continue;
    }

    const phrasing = phrasingOf(attribute.value);
    if (!phrasing || !needsParsing(attribute.value, phrasing)) {
      kept.push(attribute);
      continue;
    }

    moved.push(slotElement(element, name, phrasing));
  }

  if (moved.length === 0) return;

  node.attributes = kept;
  const paragraph = {
    type: 'paragraph',
    children: moved,
  } as unknown as RootContent;
  node.children.splice(slotRunIndex(node.children), 0, paragraph);
}

/**
 * Plugin factory.
 *
 * @param {DesugarSlotAttributesOptions} [options] - Plugin options
 * @returns {(tree: Root) => void} Transformer
 */
const desugarSlotAttributes: Plugin<
  [DesugarSlotAttributesOptions?],
  Root
> = (options) => {
  const hosts = options?.hosts ?? {};

  return (tree: Root) => {
    if (Object.keys(hosts).length === 0) return;

    visit(tree, (node: Node) => {
      const type = node.type as string;
      if (type !== 'mdxJsxFlowElement' && type !== 'mdxJsxTextElement') {
        return;
      }
      const element = node as unknown as MdxJsxElementNode;
      const slots = hosts[element.name ?? ''];
      if (slots) desugarHost(element, slots);
    });
  };
};

export default desugarSlotAttributes;
