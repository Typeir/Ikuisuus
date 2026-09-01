/**
 * @fileoverview Nested-heading Extraction Tests
 * @description Covers the case heading level alone cannot resolve: a heading
 * that sits inside a component. Level matching runs to the next same-level
 * heading and carries the enclosing element's closing tag with it, so the
 * extracted source no longer compiles.
 *
 * @module tests/unit/src/lib/utils/contentShardResolverNesting.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/utils/contentShardResolver Module under test
 */

import { resolveShards } from '@/lib/utils/contentShardResolver';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { describe, expect, it } from 'vitest';

/**
 * Asserts a block is still valid MDX.
 *
 * @param {string} source - Block to compile
 * @returns {void}
 */
function expectCompiles(source: string): void {
  expect(() => compileRuntimeSync({ source, components: {} })).not.toThrow();
}

/** A heading nested one level inside a component, with a sibling after it. */
const NESTED = [
  '## Boons',
  '',
  '<Collapsible open>',
  '',
  '##### Mind',
  '',
  'Pick one.',
  '',
  '<Collapsible>',
  '',
  '###### Urban Explorer',
  '',
  'City work.',
  '',
  '</Collapsible>',
  '',
  '</Collapsible>',
  '',
  '<Collapsible open>',
  '',
  '##### Matter',
  '',
  'Other pick.',
  '',
  '</Collapsible>',
].join('\n');

describe('extractByHeadingText nesting', () => {
  it('should stop where the enclosing component closes', () => {
    const block = resolveShards(NESTED, [], ['Mind']).Mind ?? '';

    expect(block).toContain('Urban Explorer');
    expect(block).not.toContain('Matter');
    expect((block.match(/<Collapsible/g) ?? []).length).toBe(1);
    expect((block.match(/<\/Collapsible>/g) ?? []).length).toBe(1);
  });

  it('should return a block that still compiles', () => {
    expectCompiles(resolveShards(NESTED, [], ['Mind']).Mind ?? '');
  });

  it('should still stop at the next same-level heading when nothing is nested', () => {
    const flat = [
      '## Briefly',
      '',
      'The default duration.',
      '',
      '## Resist',
      '',
      'Save against it.',
    ].join('\n');

    const block = resolveShards(flat, [], ['Briefly']).Briefly ?? '';

    expect(block).toContain('default duration');
    expect(block).not.toContain('Save against it');
  });

  it('should not treat a self-closing component as an open', () => {
    const source = [
      '## Attack',
      '',
      'Deal <Unit value={3} /> damage.',
      '',
      '## Next',
      '',
      'Other.',
    ].join('\n');

    const block = resolveShards(source, [], ['Attack']).Attack ?? '';

    expect(block).toContain('Deal');
    expect(block).not.toContain('Other.');
  });

  it('should ignore markup inside a fenced code block', () => {
    const source = [
      '## Example',
      '',
      '```mdx',
      '</Collapsible>',
      '```',
      '',
      'After the fence.',
      '',
      '## Next',
      '',
      'Other.',
    ].join('\n');

    const block = resolveShards(source, [], ['Example']).Example ?? '';

    expect(block).toContain('After the fence.');
    expect(block).not.toContain('Other.');
  });

  it('should keep honouring an explicit line range', () => {
    const source = ['## A', '', 'first', '', '## B', '', 'second'].join('\n');

    const block =
      resolveShards(source, [{ name: 'A', anchor: 'a', startLine: 5, endLine: 7 }], [
        'a',
      ]).a ?? '';

    expect(block).toContain('second');
  });
});
