/**
 * @fileoverview Unit tests for the slot attribute desugaring plugin.
 *
 * @module tests/unit/src/lib/md/desugarSlotAttributes.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-03
 */

import desugarSlotAttributes from '@/lib/md/desugarSlotAttributes';
import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';

/**
 * Host table under test.
 */
const HOSTS = {
  Feature: { cost: 'Cost', targets: 'Targets' },
  Heirloom: { damage: 'Damage', rarity: 'Rarity' },
};

/**
 * Parses MDX and runs the plugin over it.
 *
 * @param {string} source - MDX source
 * @returns {Root} Transformed tree
 */
function run(source: string): Root {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .parse(source) as Root;
  (desugarSlotAttributes as unknown as (o: unknown) => (t: Root) => void)({
    hosts: HOSTS,
  })(tree);
  return tree;
}

/**
 * The first JSX flow element of a tree.
 *
 * @param {Root} tree - Tree to read
 * @returns {Record<string, unknown>} The element
 */
function hostOf(tree: Root): Record<string, unknown> {
  return tree.children.find(
    (child) => (child as { type: string }).type === 'mdxJsxFlowElement',
  ) as unknown as Record<string, unknown>;
}

/**
 * The slot elements the plugin moved, by element name.
 *
 * @param {Record<string, unknown>} host - Host element
 * @returns {Record<string, unknown>} Slot elements keyed by name
 */
function slotsOf(host: Record<string, unknown>): Record<string, unknown> {
  const children = host.children as Array<Record<string, unknown>>;
  const paragraph = children.find(
    (child) =>
      child.type === 'paragraph' &&
      ((child.children ?? []) as Array<Record<string, unknown>>).every(
        (kid) => kid.type === 'mdxJsxTextElement',
      ),
  );
  const slots = (paragraph?.children ?? []) as Array<Record<string, unknown>>;
  return Object.fromEntries(slots.map((slot) => [slot.name as string, slot]));
}

describe('desugarSlotAttributes', () => {
  it('moves a shortcode-bearing attribute into its slot element', () => {
    const tree = run(
      '<Feature cost="1 Major Action, 1/[# kw:Repose #]">\n\n#### Probe\n\nTail.\n\n</Feature>\n',
    );
    const host = hostOf(tree);
    expect(host.attributes).toHaveLength(0);

    const cost = slotsOf(host).Cost as { children: Array<{ type: string; value?: string }> };
    expect(cost).toBeTruthy();
    expect(cost.children).toHaveLength(1);
    expect(cost.children[0].type).toBe('text');
    expect(cost.children[0].value).toBe('1 Major Action, 1/[# kw:Repose #]');
  });

  it('parses markdown in the value into real nodes', () => {
    const tree = run(
      '<Feature cost="see _Repose_ and [Bane](/en/library/spells/bane)">\n\n#### Probe\n\nTail.\n\n</Feature>\n',
    );
    const cost = slotsOf(hostOf(tree)).Cost as {
      children: Array<{ type: string; url?: string }>;
    };
    const types = cost.children.map((child) => child.type);
    expect(types).toContain('emphasis');
    expect(types).toContain('link');
    expect(cost.children.find((child) => child.type === 'link')?.url).toBe(
      '/en/library/spells/bane',
    );
  });

  it('stamps the slot name, on its own elements and on an author\'s', () => {
    const tree = run(
      '<Feature cost="[% 1d6 %]">\n\n#### Probe\n\n<Targets>you</Targets>\n\nTail.\n\n</Feature>\n',
    );
    const host = hostOf(tree);
    const moved = slotsOf(host).Cost as { attributes: Array<{ name: string; value: string }> };
    expect(moved.attributes).toEqual([
      { type: 'mdxJsxAttribute', name: 'data-slot', value: 'cost' },
    ]);

    const authored = ((host.children as Array<Record<string, unknown>>)
      .flatMap((child) => (child.children ?? []) as Array<Record<string, unknown>>)
      .find((child) => child.name === 'Targets') ?? {}) as {
      attributes?: Array<{ name: string; value: string }>;
    };
    expect(authored.attributes).toEqual([
      { type: 'mdxJsxAttribute', name: 'data-slot', value: 'targets' },
    ]);
  });

  it('leaves plain prose as a string attribute', () => {
    const tree = run(
      '<Feature cost="1 Minor Action" targets="you">\n\n#### Probe\n\nTail.\n\n</Feature>\n',
    );
    const host = hostOf(tree);
    expect(host.attributes).toHaveLength(2);
    expect(Object.keys(slotsOf(host))).toHaveLength(0);
  });

  it('keeps the heading first, so the block still sectionizes', () => {
    const tree = run(
      '<Feature cost="[% 1d6 %]">\n\n#### Probe\n\nTail.\n\n</Feature>\n',
    );
    const children = (hostOf(tree).children ?? []) as Array<{ type: string }>;
    const heading = children.findIndex((child) => child.type === 'heading');
    const paragraph = children.findIndex(
      (child, index) => child.type === 'paragraph' && index > heading,
    );
    expect(heading).toBeGreaterThanOrEqual(0);
    expect(paragraph).toBe(heading + 1);
  });

  it('puts the run at the front of a host that opens with something else, not under a group heading inside it', () => {
    const tree = run(
      '<Heirloom damage="[% 1d10 %]">\n\nPrimer.\n\n### Attributes\n\n### Traits\n\n</Heirloom>\n',
    );
    const children = (hostOf(tree).children ?? []) as Array<{ type: string }>;
    const runIndex = children.findIndex(
      (child, index) =>
        child.type === 'paragraph' &&
        ((children[index] as unknown as { children: Array<{ type: string }> })
          .children ?? []).every((kid) => kid.type === 'mdxJsxTextElement'),
    );
    const firstHeading = children.findIndex((child) => child.type === 'heading');
    expect(runIndex).toBe(0);
    expect(firstHeading).toBeGreaterThan(runIndex);
  });

  it('ignores attributes that are not slots, and components that are not hosts', () => {
    const tree = run(
      '<Feature id="[% 1d6 %]">\n\n#### Probe\n\n</Feature>\n\n<Collapsible cost="[% 1d6 %]">\n\n#### Other\n\n</Collapsible>\n',
    );
    const hosts = tree.children.filter(
      (child) => (child as { type: string }).type === 'mdxJsxFlowElement',
    ) as unknown as Array<Record<string, unknown>>;
    expect(hosts[0].attributes).toHaveLength(1);
    expect(hosts[1].attributes).toHaveLength(1);
  });
});
