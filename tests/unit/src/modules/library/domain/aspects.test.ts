/**
 * @fileoverview Aspect Domain Tests
 * @description Guards parsing, display ordering and glyph selection for the
 * faceted aspect vocabulary. These decide what a reader sees on a pill, so a
 * mistake here is silent — a wrong aspect looks exactly like a right one.
 *
 * @module tests/unit/src/modules/library/domain/aspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 *
 * @requires vitest Testing framework
 */

import {
  ASPECT_GROUP_ORDER,
  aspectColour,
  aspectMark,
  displayAspects,
  isInternalAspect,
  parseAspect,
} from '@/modules/library/domain/aspects';
import { describe, expect, it } from 'vitest';

describe('parseAspect', () => {
  it('should split a plain aspect on its colon', () => {
    expect(parseAspect('damage:fire')).toEqual({
      raw: 'damage:fire',
      group: 'damage',
      value: 'fire',
    });
  });

  /**
   * Internal aspects carry a second colon, so splitting on the first would make
   * `meta:source:ikuisuus` parse as group `meta`.
   */
  it('should split an internal aspect on its last colon', () => {
    expect(parseAspect('meta:source:ikuisuus')).toEqual({
      raw: 'meta:source:ikuisuus',
      group: 'meta:source',
      value: 'ikuisuus',
    });
  });

  it('should reject tokens without a usable colon', () => {
    expect(parseAspect('damage')).toBeNull();
    expect(parseAspect('damage:')).toBeNull();
    expect(parseAspect(':fire')).toBeNull();
  });
});

describe('isInternalAspect', () => {
  it('should treat meta-prefixed aspects as internal', () => {
    expect(isInternalAspect('meta:source:ikuisuus')).toBe(true);
    expect(isInternalAspect('damage:fire')).toBe(false);
  });
});

describe('displayAspects', () => {
  it('should return nothing for an empty list', () => {
    expect(displayAspects(undefined)).toEqual([]);
    expect(displayAspects([])).toEqual([]);
  });

  /** Internal aspects reach the facet rail and are never drawn in prose. */
  it('should drop internal aspects', () => {
    const result = displayAspects([
      'damage:fire',
      'meta:locale:en',
      'meta:source:ikuisuus',
    ]);

    expect(result.map((aspect) => aspect.raw)).toEqual(['damage:fire']);
  });

  it('should discard malformed tokens rather than rendering them', () => {
    expect(displayAspects(['damage:fire', 'nonsense', 'damage:'])).toHaveLength(
      1,
    );
  });

  /**
   * Order comes from the taxonomy, not from the order tags happen to be
   * generated in, so the same axis sits in the same place on every page.
   */
  it('should order groups by the taxonomy rather than alphabetically', () => {
    const result = displayAspects([
      'tempo:major',
      'creature:construct',
      'damage:fire',
    ]);

    expect(result.map((aspect) => aspect.group)).toEqual([
      'creature',
      'damage',
      'tempo',
    ]);
  });

  it('should sort values alphabetically inside a group', () => {
    const result = displayAspects(['save:wis', 'save:cha', 'save:dex']);

    expect(result.map((aspect) => aspect.value)).toEqual(['cha', 'dex', 'wis']);
  });

  it('should place unknown groups after every known one', () => {
    const result = displayAspects(['zzz:thing', 'creature:construct']);

    expect(result[0].group).toBe('creature');
    expect(result[1].group).toBe('zzz');
  });
});

describe('aspectColour', () => {
  it('should resolve damage per value with a group fallback', () => {
    expect(aspectColour(parseAspect('damage:fire')!)).toBe(
      'var(--aspect-damage-fire, var(--aspect-damage))',
    );
  });

  /** One state must not be two colours across the wiki. */
  it('should borrow the encounter tracker palette for phases, behind a pill-only override', () => {
    expect(aspectColour(parseAspect('phase:bloodied')!)).toBe(
      'var(--aspect-phase-bloodied, var(--color-phase-bloodied, var(--aspect-default)))',
    );
  });

  it('should fall back for a group with no declared colour', () => {
    expect(aspectColour(parseAspect('madeup:value')!)).toBe(
      'var(--aspect-madeup, var(--aspect-default))',
    );
  });
});

describe('aspectMark', () => {
  /**
   * Scoped defences are drawn as a modifier over the element they apply to, so
   * `resistance:` needs no glyph of its own.
   */
  it('should compose a scoped defence from a modifier and its element', () => {
    const mark = aspectMark(parseAspect('resistance:fire')!);

    expect(mark.Badge).toBeDefined();
    expect(mark.badgeVar).toBe('--aspect-damage-fire');
  });

  /** Immunity to being charmed is the same kind of fact as immunity to fire. */
  it('should compose a scoped defence over a condition as well as a damage type', () => {
    const mark = aspectMark(parseAspect('immunity:charmed')!);

    expect(mark.Badge).toBeDefined();
    expect(mark.badgeVar).toBe('--aspect-condition');
  });

  it('should leave a scoped defence unbadged for a value it cannot resolve', () => {
    const mark = aspectMark(parseAspect('immunity:nonsense')!);

    expect(mark.Badge).toBeUndefined();
  });

  it('should give every ordered group a glyph', () => {
    for (const group of ASPECT_GROUP_ORDER) {
      const mark = aspectMark({
        raw: `${group}:value`,
        group,
        value: 'value',
      });

      expect(mark.Icon).toBeTruthy();
    }
  });
});

/**
 * The 23 conditions and the defences scoped over them. These are the groups whose
 * values have been drawn; every other group still falls back to one glyph for the
 * whole group, which is graceful degradation rather than a finished mapping.
 */
describe('drawn groups render a distinguishable mark per value', () => {
  const CONDITIONS = [
    'bleeding', 'blinded', 'burning', 'charmed', 'deafened', 'exhaustion',
    'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed',
    'petrified', 'poisoned', 'prone', 'restrained', 'slowed', 'staggered',
    'stunned', 'suffocating', 'sundered', 'terrified', 'unconscious',
    'unsteady',
  ];

  const DAMAGE = [
    'chemical', 'bludgeoning', 'frost', 'fire', 'force', 'lightning', 'dark',
    'piercing', 'poison', 'psychic', 'holy', 'slashing', 'true',
    'physical', 'elemental', 'somatic', 'akashic',
  ];

  /**
   * A mark is the glyphs *and* the badge's hue. `immunity:fire` and
   * `immunity:burning` both draw a flame under a Ban, and they are still
   * distinguishable because one is tinted with the fire hue and the other with
   * the condition hue — colour carries the group, which is what lets glyphs be
   * reused across vocabularies at all.
   *
   * @param {string} group - Aspect group
   * @param {string} value - Aspect value
   * @returns {string} A stable key for the rendered mark
   */
  const markKey = (group: string, value: string): string => {
    const mark = aspectMark(parseAspect(`${group}:${value}`)!);
    return [
      mark.Icon?.displayName ?? mark.Icon?.name,
      mark.Badge?.displayName ?? mark.Badge?.name ?? '-',
      mark.badgeVar ?? '-',
      mark.strata?.map((m) => m.value).join(',') ?? '-',
    ].join('+');
  };

  it.each([
    ['condition', CONDITIONS],
    ['damage', DAMAGE],
    ['immunity', CONDITIONS],
    ['resistance', DAMAGE],
  ])('should draw a unique mark for every %s value', (group, values) => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const value of values) {
      const key = markKey(group as string, value);
      const previous = seen.get(key);
      if (previous) collisions.push(`${previous} / ${value} both draw ${key}`);
      else seen.set(key, value);
    }

    expect(collisions).toEqual([]);
  });

  /**
   * Identity must survive being shrunk to a badge, so family members do not
   * share a base glyph — the chevron carries the relationship instead.
   */
  it('should give each member of a family its own glyph', () => {
    const base = (value: string) =>
      aspectMark(parseAspect(`condition:${value}`)!).Icon;

    expect(base('frightened')).not.toBe(base('terrified'));
    expect(base('grappled')).not.toBe(base('restrained'));
    expect(base('incapacitated')).not.toBe(base('stunned'));
    expect(base('staggered')).not.toBe(base('slowed'));
  });

  /** Paralyzed is stunned plus auto-crits, so it sits a rung higher. */
  it('should escalate the chevron across the incapacitation ladder', () => {
    const badge = (value: string) =>
      aspectMark(parseAspect(`condition:${value}`)!).Badge;

    expect(badge('incapacitated')).toBeUndefined();
    expect(badge('stunned')).toBeDefined();
    expect(badge('paralyzed')).toBeDefined();
    expect(badge('stunned')).not.toBe(badge('paralyzed'));
  });

  /**
   * `staggered` only forbids reactions; `slowed` forbids reactions and halves
   * speed and caps attacks. The lighter of the two is the one that looks heavier.
   */
  it('should mark the heavier member of a family with a chevron', () => {
    expect(aspectMark(parseAspect('condition:staggered')!).Badge).toBeUndefined();
    expect(aspectMark(parseAspect('condition:slowed')!).Badge).toBeDefined();
    expect(
      aspectMark(parseAspect('condition:frightened')!).Badge,
    ).toBeUndefined();
    expect(aspectMark(parseAspect('condition:terrified')!).Badge).toBeDefined();
  });

  /** A scoped defence over a condition badges the condition, not a bare Ban. */
  it('should compose a scoped defence over a condition', () => {
    const mark = aspectMark(parseAspect('immunity:stunned')!);

    expect(mark.Badge).toBeDefined();
    expect(mark.badgeVar).toBe('--aspect-condition');
  });
});

/**
 * A stratum is permanently three damage types, so it draws as those three marks
 * rather than as a new symbol a reader would have to learn.
 */
describe('damage strata', () => {
  const STRATA = ['physical', 'elemental', 'somatic', 'akashic'];

  it.each(STRATA)('should draw %s as its three member types', (stratum) => {
    const mark = aspectMark(parseAspect(`damage:${stratum}`)!);

    expect(mark.strata).toHaveLength(3);
  });

  it('should give each member its own glyph and its own hue', () => {
    const mark = aspectMark(parseAspect('damage:elemental')!);
    const members = mark.strata ?? [];

    expect(members.map((m) => m.value)).toEqual(['frost', 'fire', 'lightning']);
    expect(new Set(members.map((m) => m.Icon)).size).toBe(3);
    expect(members.map((m) => m.colourVar)).toEqual([
      '--aspect-damage-frost',
      '--aspect-damage-fire',
      '--aspect-damage-lightning',
    ]);
  });

  it('should draw a scoped defence over a stratum as modifier plus members', () => {
    const mark = aspectMark(parseAspect('immunity:somatic')!);

    expect(mark.Icon).toBeDefined();
    expect(mark.strata).toHaveLength(3);
    expect(mark.Badge).toBeUndefined();
  });

  it('should draw a single damage type as one glyph, not a stratum', () => {
    const mark = aspectMark(parseAspect('damage:fire')!);

    expect(mark.strata).toBeUndefined();
  });

  /**
   * The chip stays neutral so its three member hues read. A fourth colour on the
   * carrier would compete with the thing it is carrying.
   */
  it('should colour a stratum neutrally on every group it appears in', () => {
    for (const aspect of [
      'damage:elemental',
      'resistance:physical',
      'immunity:somatic',
      'vulnerability:akashic',
    ]) {
      expect(aspectColour(parseAspect(aspect)!)).toBe(
        'var(--aspect-stratum, var(--aspect-default))',
      );
    }
  });

  it('should still colour a single damage type by its own hue', () => {
    expect(aspectColour(parseAspect('damage:fire')!)).toBe(
      'var(--aspect-damage-fire, var(--aspect-damage))',
    );
  });

  /** True damage stands outside every stratum and cannot be resisted. */
  it('should give true damage no stratum mark', () => {
    expect(aspectMark(parseAspect('damage:true')!).strata).toBeUndefined();
  });
});
