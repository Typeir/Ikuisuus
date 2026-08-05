/**
 * Remark Aspects Plugin
 *
 * @fileoverview Places an `<Aspects>` element directly beneath the headings that
 * have aspects, so a section's facets sit with the section they describe rather
 * than in a block of metadata above the article.
 *
 * The plugin carries **placement only**. It is handed the list of section names
 * that have aspects and emits a `section` key; the aspects themselves are read at
 * render time from the article metadata context. Keeping the data out of the
 * compile step means no per-file IO in the MDX pipeline and nothing to
 * invalidate when metadata changes.
 *
 * **Order matters: this must run before `remarkUnit`.** A heading's measures are
 * normalised here exactly as the generator normalises a feature name, so the two
 * agree. Once `remarkUnit` has run the measure is a `<Unit>` element instead,
 * and `headingText` skips JSX — the heading would resolve to
 * `Aura of Stillness ( radius)` and match nothing.
 *
 * @module lib/md/remarkAspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import type { Heading, Root } from 'mdast';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

/**
 * Name of the component this plugin emits. The MDX runtime resolves it through
 * the component map, so any registry that renders content must provide it.
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
 * Concatenates the literal text of a heading's children.
 *
 * Only value-bearing nodes contribute, so emphasis and inline code inside a
 * heading collapse to their text the same way the extractor saw them.
 *
 * Embedded JSX is skipped whole. A boon is written
 * `###### Cognitive Matrix <span>7 BP</span>`, and the generator's `spanHeading`
 * pattern captures the name alone — so reading the badge back in produced
 * "Cognitive Matrix 7 BP", which matched no section and left every annotated
 * heading without its aspects. Every heading of that shape sits inside a
 * `<Collapsible>`, which is why the gap read as a Collapsible problem.
 *
 * @param {Heading} heading - The heading node
 * @returns {string} The heading's text
 */
function headingText(heading: Heading): string {
  let text = '';

  visit(heading, (node) => {
    /* Only the text-level form can appear here — a heading holds phrasing
       content, so there is no flow element to skip. */
    if (node.type === 'mdxJsxTextElement') return SKIP;

    if (
      (node.type === 'text' ||
        node.type === 'inlineCode' ||
        node.type === 'html') &&
      'value' in node &&
      typeof node.value === 'string'
    ) {
      text += node.value;
    }

    return undefined;
  });

  /* Normalised the same way the generator normalises a feature name. A heading
     reads `### Aura of Stillness ([= 12 stride;ADJ =] radius)` and the stored
     name is `Aura of Stillness (12 stride radius)`; without this the two never
     meet and the section silently loses its aspects. */
  return toPlainMeasure(text.trim());
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
 * Remark plugin factory that inserts an aspect row after each heading whose text
 * appears in `sections`.
 *
 * @param {RemarkAspectsOptions} [options] - Plugin options
 * @returns {Plugin<[], Root>} A unified plugin that transforms the MDAST
 */
const remarkAspects: Plugin<[RemarkAspectsOptions?], Root> = (options) => {
  const sections = new Set(options?.sections ?? []);

  return (tree: Root) => {
    if (sections.size === 0) return;

    const insertions: Array<{ parent: Root; index: number; section: string }> =
      [];

    visit(tree, 'heading', (node, index, parent) => {
      if (!parent || index === null || index === undefined) return;

      const text = headingText(node as Heading);
      if (!sections.has(text)) return;

      insertions.push({ parent: parent as Root, index, section: text });
    });

    for (const { parent, index, section } of insertions.reverse()) {
      parent.children.splice(index + 1, 0, aspectsNode(section) as never);
    }
  };
};

export default remarkAspects;
