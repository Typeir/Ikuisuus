/**
 * @fileoverview Slot card render checks: shortcodes in slots (T2) and no
 * shortcode literals in static output (T8), in both spellings.
 *
 * @module tests/unit/src/modules/library/slots/slots.render.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { describe, expect, it } from 'vitest';
import { elementFeature, renderFixture, renderSource } from './harness';

/**
 * Shortcode literal markers that must never reach static output.
 */
const RAW_SHORTCODES = ['[=', '[%', '[#'];

describe('T2 shortcodes render in slots', () => {
  it('attributes: DiceRoll in the damage line and Unit in targets', async () => {
    const html = await renderFixture();
    const damageLine = html.match(
      /<span[^>]*data-slot="damage"[^>]*>[\s\S]*?<\/span><\/span>/,
    );
    expect(damageLine?.[0] ?? '').toContain('1d10 slashing');
    expect(damageLine?.[0] ?? '').toContain('1d12');
    expect(html).toContain('data-unit="stride"');
  });

  it('the authored ### Traits and ### Features headings section the blocks beneath them', async () => {
    const html = await renderFixture();
    const traits = html.match(
      /<section data-heading-level="3" data-anchor="traits">[\s\S]*?(?=<section data-heading-level="3" data-anchor="features">)/,
    )?.[0] ?? '';
    const features = html.match(
      /<section data-heading-level="3" data-anchor="features">[\s\S]*/,
    )?.[0] ?? '';
    expect(traits).toMatch(/<h3[^>]*data-anchor="traits"/);
    expect(features).toMatch(/<h3[^>]*data-anchor="features"/);
    for (const anchor of ['blessing-of-küütar', 'moonlight-glow']) {
      expect(traits, anchor).toMatch(new RegExp(`<h4[^>]*data-anchor="${anchor}"`));
      expect(features, anchor).not.toMatch(new RegExp(`data-anchor="${anchor}"`));
    }
    for (const anchor of ['lunar-dissolution', 'moon-step', 'mooncleave']) {
      expect(features, anchor).toMatch(new RegExp(`<h4[^>]*data-anchor="${anchor}"`));
      expect(traits, anchor).not.toMatch(new RegExp(`data-anchor="${anchor}"`));
    }
  });

  it('attributes: the brief and the stats row come from the header slots', async () => {
    const html = await renderFixture();
    const brief = html.match(/<p[^>]*data-heirloom-brief[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(brief).toContain('Very rare kind, requiresAttunement');
    expect(brief).toContain(
      'Enhanced curved longsword (Finesse, Versatile), enchanted +1 accuracy and damage',
    );
    expect(brief).toContain('Spellcasting focus while attuned');
    expect(html).not.toContain('data-slot="attunement"');
    const attributes = html.match(
      /<section data-heading-level="3" data-anchor="attributes">[\s\S]*?(?=<section data-heading-level="3")/,
    )?.[0] ?? '';
    expect(attributes, 'stats filed under Attributes').toContain(
      'data-heirloom-stats',
    );
    const stats = attributes.match(/<ul data-heirloom-stats="true">[\s\S]*?<\/ul>/)?.[0] ?? '';
    const rows = stats.match(/data-slot="([a-zA-Z]+)"/g) ?? [];
    expect(rows).toEqual([
      'data-slot="damage"',
      'data-slot="mastery"',
      'data-slot="masterfulBlow"',
      'data-slot="burden"',
    ]);
    expect(html).not.toContain('<table');
  });

  it('cost prints as the heading span, targets as a labelled line', async () => {
    const html = await renderFixture();
    const heading = html.match(/<h4[^>]*data-anchor="lunar-dissolution"[^>]*>[\s\S]*?<\/h4>/)?.[0] ?? '';
    expect(heading).toContain('data-feature-cost');
    expect(heading).toContain('1 Minor Action');
    expect(html).not.toContain('data-slot="cost"');
    expect(html).toContain('data-slot="targets"');
  });

  it('elements: Unit and DiceRoll in slot children', async () => {
    const html = await renderSource(
      elementFeature('[% 1d6 %] per turn', 'within [= 6 stride;ADJ =]'),
    );
    expect(html).toContain('1d6');
    expect(html).toContain('data-unit="stride"');
  });
});

describe('T8 static output carries no shortcode literals', () => {
  it('attributes', async () => {
    const html = await renderFixture();
    for (const marker of RAW_SHORTCODES) {
      expect(html, `must not contain ${marker}`).not.toContain(marker);
    }
  }, 120000);

  it('elements', async () => {
    const html = await renderSource(
      elementFeature('[% 1d6 %] and [= 2 stride =]', '[# kw:Repose #]'),
    );
    for (const marker of RAW_SHORTCODES) {
      expect(html, `must not contain ${marker}`).not.toContain(marker);
    }
  }, 120000);
});
