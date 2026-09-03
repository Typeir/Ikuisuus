/**
 * @fileoverview Slot card T4 sectionize anchors and T5 aspects rows.
 *
 * @module tests/unit/src/modules/library/slots/slots.sectionize.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { compileSource, renderFixture } from './harness';

/**
 * Stub Aspects row exposing its section key.
 */
function AspectsStub({ section }: { section?: string }) {
  return <div data-aspects-section={section ?? ''} />;
}

describe('T4 sectionize anchors', () => {
  it('heading anchors exist and stay unique, groups at h3 and blocks at h4', async () => {
    const html = await renderFixture();
    const levels: Record<string, string> = {
      attributes: 'h3',
      traits: 'h3',
      features: 'h3',
      mooncleave: 'h4',
      'lunar-dissolution': 'h4',
      'moon-step': 'h4',
      'blessing-of-küütar': 'h4',
      'moonlight-glow': 'h4',
    };
    for (const [anchor, tag] of Object.entries(levels)) {
      expect(
        html.match(new RegExp(`<h[1-6][^>]*data-anchor="${anchor}"`, 'g')) ?? [],
      ).toHaveLength(1);
      expect(html).toMatch(new RegExp(`<${tag}[^>]*data-anchor="${anchor}"`));
    }
  }, 120000);

  it('the group sections carry both rails, the blocks only the left one', async () => {
    const html = await renderFixture();
    const traits = html.match(
      /<section data-heading-level="3" data-anchor="traits">[\s\S]*?(?=<section data-heading-level="3" data-anchor="features">)/,
    )?.[0] ?? '';
    expect(traits).toContain('data-stream-rail="left"');
    expect(traits).toContain('data-stream-rail="right"');
    const firstBlock = traits.match(
      /<section data-heading-level="4"[\s\S]*?<\/section>/,
    )?.[0] ?? '';
    expect(firstBlock).toContain('data-stream-rail="left"');
    expect(firstBlock).not.toContain('data-stream-rail="right"');
  }, 120000);

  it('duplicated feature: the second gets a distinct anchor, and each sits in its own section', async () => {
    const duplicate = `<Feature cost="1 Minor Action">\n\n#### Mooncleave\n\nOne.\n\n</Feature>\n\n<Feature cost="1 Minor Action">\n\n#### Mooncleave\n\nTwo.\n\n</Feature>\n`;
    const content = await compileSource(duplicate);
    const markup = renderToStaticMarkup(content);
    const headingAnchors = (
      markup.match(/<h4[^>]*data-anchor="([^"]*)"/g) ?? []
    ).map((tag) => tag.replace(/.*data-anchor="([^"]*)".*/, '$1'));
    expect(headingAnchors).toHaveLength(2);
    expect(headingAnchors[0]).toBe('mooncleave');
    expect(headingAnchors[1]).not.toBe('mooncleave');
    expect(
      markup.match(/<section data-heading-level="4" data-anchor="/g) ?? [],
    ).toHaveLength(2);
  });
});

describe('T5 aspects row placement', () => {
  const ASPECTS = { keys: ['mooncleave'], records: [] };

  it('row lands inside the mooncleave feature after the heading', async () => {
    const html = await renderFixture({
      components: { Aspects: AspectsStub },
      aspects: ASPECTS,
    });
    const article = html.match(
      /<article data-kind="feature" data-anchor="mooncleave">[\s\S]*?<\/article>/,
    );
    expect(article?.[0] ?? '').toContain('data-aspects-section="mooncleave"');
    expect(article?.[0] ?? '').not.toContain(
      'data-aspects-section="lunar-dissolution"',
    );
  }, 120000);

  it('heading below the slot run is no longer the block\'s own: it sections on its own and takes the row', async () => {
    const scratch = `<Feature>\n\n<Cost>1 Minor Action</Cost>\n\n#### Mooncleave\n\nProse.\n\n</Feature>\n`;
    const content = await compileSource(scratch, {
      components: { Aspects: AspectsStub },
      aspects: ASPECTS,
    });
    const markup = renderToStaticMarkup(content);
    expect(markup).not.toMatch(/<article data-kind="feature" data-anchor=/);
    expect(markup).toMatch(
      /<article data-kind="feature">[\s\S]*<section data-heading-level="4" data-anchor="mooncleave">[\s\S]*data-aspects-section="mooncleave"/,
    );
  });
});
