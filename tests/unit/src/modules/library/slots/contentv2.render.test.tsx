/**
 * @fileoverview Content-v2 fixtures through the real compile pipeline.
 * @description Each fixture is compiled by `compileStatic` with the attribute
 * rewrite on, exactly as a page is, and rendered to markup. These assert the
 * card reached the page — that the shortcodes inside slot attributes became
 * real nodes, that derived values were worked out, and that the body survived.
 *
 * @module tests/unit/src/modules/library/slots/contentv2.render.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import { renderNamed } from './harness';

describe('spell fixture', () => {
  it('compiles to a spell card with its brief and rows', async () => {
    const html = await renderNamed('spell.mdx');
    expect(html).toContain('data-spell="true"');
    expect(html).toContain('3rd-level Evocation');
    expect(html).toContain('data-slot="cost"');
    expect(html).toContain('1 Major Action');
    expect(html).toContain('data-slot="overcast"');
  });

  it('parses shortcodes written inside slot attributes', async () => {
    const html = await renderNamed('spell.mdx');
    /* `range="[= 30 stride =]"` and the overcast dice reach the page as
       rendered units and dice, never as the literal shortcode text. */
    expect(html).not.toContain('[= 30 stride =]');
    expect(html).not.toContain('[% 1d6 %]');
    expect(html).toContain('data-slot="range"');
  });

  it('keeps the prose body', async () => {
    const html = await renderNamed('spell.mdx');
    expect(html).toContain('A bright streak flashes from your pointing finger');
  });
});

describe('spell fixture with a tiered overcast', () => {
  it('renders each overcast tier as its own titled block', async () => {
    const html = await renderNamed('spell-overcast.mdx');
    expect(html).toContain('data-overcast-at="5th+"');
    expect(html).toContain('data-overcast-at="7th+"');
    expect(html).toContain('Somatic damage strata');
    expect(html).toContain('Akashic damage strata');
  });

  it('keeps the tables inside their tiers', async () => {
    const html = await renderNamed('spell-overcast.mdx');
    /* Three authored tables: the base cantrip list and one per tier. */
    expect((html.match(/<table/g) ?? []).length).toBe(3);
  });

  it('still prints a one-line overcast as a row', async () => {
    const html = await renderNamed('spell-overcast.mdx');
    expect(html).toContain('data-slot="overcast"');
  });
});

describe('trinket fixture', () => {
  it('compiles to a trinket card', async () => {
    const html = await renderNamed('trinket.mdx');
    expect(html).toContain('data-item-kind="trinket"');
    expect(html).toContain('Adventuring Gear');
    expect(html).toContain('data-slot="properties"');
    expect(html).toContain('data-slot="burden"');
    expect(html).not.toContain('[= 3 burden =]');
  });
});

describe('monster fixture', () => {
  it('compiles to a stat block with both tables', async () => {
    const html = await renderNamed('monster.mdx');
    expect(html).toContain('data-monster="true"');
    expect(html).toContain('Large Monstrosity, Unaligned');
    expect(html).toContain('data-monster-defences');
    expect(html).toContain('data-monster-abilities');
  });

  it('prints every ability score with its derived modifier', async () => {
    const html = await renderNamed('monster.mdx');
    for (const cell of [
      '18 (+4)',
      '12 (+1)',
      '14 (+2)',
      '8 (-1)',
      '10 (+0)',
      '9 (-1)',
    ]) {
      expect(html, cell).toContain(cell);
    }
  });

  it('derives the tier bonus the sheet no longer carries', async () => {
    const html = await renderNamed('monster.mdx');
    expect(html).toContain('data-derived-from="challenge"');
    expect(html).toContain('data-slot="tierBonus"');
  });

  it('renders its action blocks', async () => {
    const html = await renderNamed('monster.mdx');
    expect(html).toContain('data-kind="action"');
    expect(html).toContain('Multiattack');
    expect(html).toContain('Grappling Strike');
    expect(html).toContain('data-slot="trigger"');
  });
});

describe('vocation fixture', () => {
  it('compiles to the core traits list', async () => {
    const html = await renderNamed('vocation.mdx');
    expect(html).toContain('data-vocation="true"');
    expect(html).toContain('data-slot="primaryAbility"');
    expect(html).toContain('data-slot="hitDie"');
    expect(html).toContain('data-slot="equipment"');
  });

  it('carries the level on its feature blocks', async () => {
    const html = await renderNamed('vocation.mdx');
    expect(html).toContain('data-slot="level"');
    expect(html).toContain('Martial Arts');
    expect(html).toContain('Extra Attack');
  });

  it('parses links written inside a slot attribute', async () => {
    const html = await renderNamed('vocation.mdx');
    expect(html).toContain('/en/library/items/tools');
    expect(html).not.toContain('[Trade](');
  });
});

describe('feat fixture', () => {
  it('compiles to a feat card', async () => {
    const html = await renderNamed('feat.mdx');
    expect(html).toContain('data-feat="true"');
    expect(html).toContain('data-feat-brief');
    expect(html).toContain('data-slot="prerequisite"');
  });

  it('writes the ability sentence rather than reading it', async () => {
    const html = await renderNamed('feat.mdx');
    expect(html).toContain('data-feat-ability');
  });

  it('renders its feature blocks with cost and trigger', async () => {
    const html = await renderNamed('feat.mdx');
    expect(html).toContain('Shadowmeld');
    expect(html).toContain('Umbral Ambush');
    expect(html).toContain('data-slot="trigger"');
  });
});
