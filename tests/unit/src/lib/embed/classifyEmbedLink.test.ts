/**
 * @fileoverview Embed Link Classifier Tests
 * @description Pins the rule that decides what an embedded frame does with a
 * clicked link: library content stays in the frame, everything else leaves it.
 *
 * @module tests/unit/src/lib/embed/classifyEmbedLink
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { classifyEmbedLink } from '@/lib/embed/classifyEmbedLink';
import { describe, expect, it } from 'vitest';

const ORIGIN = 'https://ikuisuus.test';

describe('classifyEmbedLink', () => {
  describe('ignored', () => {
    it.each([
      ['an empty href', ''],
      ['a missing href', null],
      ['an in-page anchor', '#traits'],
      ['a mail link', 'mailto:someone@example.com'],
      ['a phone link', 'tel:+358401234567'],
    ])('ignores %s', (_label, href) => {
      expect(classifyEmbedLink(href, ORIGIN)).toEqual({ kind: 'ignore' });
    });
  });

  describe('internal', () => {
    it('keeps a library link in the frame, rewritten onto the embed tree', () => {
      expect(
        classifyEmbedLink('/en/library/monsters/aboleth', ORIGIN),
      ).toEqual({
        kind: 'internal',
        href: '/en/embed/monsters/aboleth',
      });
    });

    it('keeps a link that is already an embed route', () => {
      expect(classifyEmbedLink('/en/embed/spells/aid', ORIGIN)).toEqual({
        kind: 'internal',
        href: '/en/embed/spells/aid',
      });
    });

    it('preserves query and hash', () => {
      expect(
        classifyEmbedLink('/en/library/monsters/aboleth?v=2#traits', ORIGIN),
      ).toEqual({
        kind: 'internal',
        href: '/en/embed/monsters/aboleth?v=2#traits',
      });
    });

    it('resolves relative hrefs against the origin', () => {
      expect(
        classifyEmbedLink(`${ORIGIN}/en/library/world`, ORIGIN),
      ).toEqual({
        kind: 'internal',
        href: '/en/embed/world',
      });
    });
  });

  describe('bubbled', () => {
    it('bubbles a search route', () => {
      expect(
        classifyEmbedLink('/en/search?aspect=school%3Aevocation', ORIGIN),
      ).toEqual({
        kind: 'bubble',
        href: `${ORIGIN}/en/search?aspect=school%3Aevocation`,
      });
    });

    it('bubbles a tool route', () => {
      expect(
        classifyEmbedLink('/en/utils/mdx-editor?slug=spells/aid', ORIGIN),
      ).toEqual({
        kind: 'bubble',
        href: `${ORIGIN}/en/utils/mdx-editor?slug=spells/aid`,
      });
    });

    it('bubbles the home page', () => {
      expect(classifyEmbedLink('/', ORIGIN)).toEqual({
        kind: 'bubble',
        href: `${ORIGIN}/`,
      });
    });

    it('bubbles a cross-origin link', () => {
      expect(classifyEmbedLink('https://example.com/docs', ORIGIN)).toEqual({
        kind: 'bubble',
        href: 'https://example.com/docs',
      });
    });
  });
});
