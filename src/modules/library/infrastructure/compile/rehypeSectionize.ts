/**
 * @fileoverview Rehype plugin that wraps MDX content between headings in semantic section elements.
 * @description Groups sibling nodes that follow a heading into a `<section>` with a
 * `data-heading-level` attribute. Sections are visually transparent — they are plain
 * block containers with no inherent styles — so prose layout is unaffected.
 *
 * @module rehypeSectionize
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

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
 */
export type RehypeSectionizeOptions = {
  streamText?: string;
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
 * Accepts both the HAST `element` form (`<hr>`) and a literal
 * `thematicBreak` node in case upstream transforms emit it.
 *
 * @param {RootContent} node - HAST node to test
 * @returns {boolean} True when the node is a horizontal rule
 */
function isHr(node: RootContent): boolean {
  return (
    (node.type === 'element' && (node as Element).tagName === 'hr') ||
    (node.type as any) === 'thematicBreak'
  );
}

/**
 * Stack item representing an open section and its heading level.
 */
type StackItem = { level: number; section: Element };

/**
 * Close any open sections whose level is greater than or equal to `level`.
 *
 * This utility centralizes the stack-popping logic so the main transformer
 * body does not contain inline comments or ad-hoc control flow notes.
 */
function closeOpenSections(stack: StackItem[], level: number): void {
  while (stack.length && stack[stack.length - 1].level >= level) {
    stack.pop();
  }
}

/**
 * Attach `section` to its parent section if available; otherwise append it
 * to the top-level `result` array.
 */
function attachSection(
  result: RootContent[],
  stack: StackItem[],
  section: Element,
): void {
  if (stack.length === 0) {
    result.push(section);
  } else {
    const parent = stack[stack.length - 1].section;
    parent.children.push(section as ElementContent);
  }
}

/**
 * Clear all open sections (used when a thematic break is encountered).
 */
function clearSections(stack: StackItem[]): void {
  stack.length = 0;
}

/**
 * Append a non-heading node either to the deepest open section or to the
 * top-level `result` array if no section is open.
 */
function appendNode(
  result: RootContent[],
  stack: StackItem[],
  node: RootContent,
): void {
  if (stack.length) {
    const parent = stack[stack.length - 1].section;
    parent.children.push(node as ElementContent);
  } else {
    result.push(node);
  }
}
/**
 * Rehype plugin that sectionizes MDX output by wrapping content between headings.
 *
 * Each heading and the nodes that follow it (up to the next heading of the same
 * or higher level) are grouped into a `<section data-heading-level="N">` element.
 * Content before the first heading is left unwrapped.
 *
 * @returns {(tree: Root) => void} Unified transformer function
 *
 * @example
 * // Source MDX:
 * // ## Overview
 * // Some text.
 * // ## Details
 * // More text.
 *
 * // Output HAST structure:
 * // <section data-heading-level="2">
 * //   <h2>Overview</h2>
 * //   <p>Some text.</p>
 * // </section>
 * // <section data-heading-level="2">
 * //   <h2>Details</h2>
 * //   <p>More text.</p>
 * // </section>
 */
const rehypeSectionize: Plugin<[RehypeSectionizeOptions?], Root> = (
  opts?: RehypeSectionizeOptions,
) => {
  return (tree: Root) => {
    const result: RootContent[] = [];

    type StackItem = { level: number; section: Element };
    const stack: StackItem[] = [];
    let pendingAnonymousSection = false;

    for (const node of tree.children) {
      if (isHeading(node)) {
        const level = headingLevel(node);

        pendingAnonymousSection = false;

        closeOpenSections(stack, level);

        const sectionProps: Record<string, unknown> = {
          'data-heading-level': level,
        };
        if (opts?.streamText) {
          sectionProps['data-stream'] = opts.streamText;
        }
        const section = (h as any)('section', sectionProps) as Element;
        section.children = [node];

        attachSection(result, stack, section);

        stack.push({ level, section });
      } else if (isHr(node)) {
        clearSections(stack);
        pendingAnonymousSection = true;
        result.push(node);
      } else {
        if (pendingAnonymousSection && stack.length === 0 && !isHeading(node)) {
          pendingAnonymousSection = false;

          const anonSectionProps: Record<string, unknown> = {
            'data-heading-level': 0,
          };
          if (opts?.streamText) {
            anonSectionProps['data-stream'] = opts.streamText;
          }
          const anonSection = (h as any)(
            'section',
            anonSectionProps,
          ) as Element;
          anonSection.children = [node as ElementContent];

          attachSection(result, stack, anonSection);
          stack.push({ level: 0, section: anonSection });
        } else {
          appendNode(result, stack, node);
        }
      }
    }

    tree.children = result;
  };
};

export default rehypeSectionize;
