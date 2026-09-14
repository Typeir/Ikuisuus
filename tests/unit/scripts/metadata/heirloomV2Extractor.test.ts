/**
 * @fileoverview Slot card T6
 * @description Asserts parseHeirloomV2 deep-equals the golden shape for the
 * fixture (attribute spelling), reads the element spelling
 *
 * @module tests/unit/scripts/metadata/heirloomV2Extractor.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  parseHeirloomSource,
  parseHeirloomV2,
} from '@scripts/metadata/generateHeirloomMetadata';
import { loadSharedData } from '@scripts/metadata';

/**
 * Fixture directory.
 */
const FIXTURES = path.resolve(process.cwd(), 'tests/fixtures/slots');

/**
 * Fixture file.
 */
const FIXTURE = path.join(FIXTURES, 'alfanjon.mdx');

/**
 * Report directory for the before/after capture.
 */
const REPORT_DIR = path.resolve(process.cwd(), '.ignore/reports/contentv2');

/**
 * Shared game data, loaded once.
 */
let sharedData: unknown;

beforeAll(async () => {
  sharedData = await loadSharedData();
});

/**
 * Reads the golden shape.
 *
 * @returns {object} Golden JSON
 */
function golden(): object {
  return JSON.parse(
    readFileSync(path.join(FIXTURES, 'alfanjon.golden.json'), 'utf8'),
  ) as object;
}

describe('parseHeirloomSource with a built base', () => {
  it('reads pattern, chassis, finish, art, attributes and catalyst', () => {
    const source = [
      '---',
      'source: Ikuisuus',
      'contentType: heirlooms',
      '---',
      '',
      '# Probe',
      '',
      '<Heirloom',
      '  rarity="legendary"',
      '  attunement="required"',
      '  pattern="rifle"',
      '  base="Hammered, Pointed, Hammering"',
      '  attributes="Unwieldy, Two-handed, Catalyst (Key, Fold)"',
      '  enchantment="+2 accuracy and damage"',
      '  damage="[% 1d12 holy %] + [% 1d12 poison %]"',
      '  mastery="Slow"',
      '  burden="[= 5 burden =]">',
      '',
      'Prose.',
      '',
      '</Heirloom>',
    ].join('\n');
    const meta = parseHeirloomSource(
      source,
      'src/content/en/items/heirlooms/probe.heirloom.mdx',
      sharedData as Parameters<typeof parseHeirloomSource>[2],
    ) as Record<string, unknown>;
    expect(meta.itemType).toBe('weapon');
    expect(meta.weaponType).toBe('rifle');
    expect(meta.chassis).toBe('hammered');
    expect(meta.finish).toBe('pointed');
    expect(meta.art).toBe('hammering');
    expect(meta.weaponProperties).toEqual(['catalyst', 'two-handed', 'unwieldy']);
    expect(meta.catalyst).toEqual(['key', 'fold']);
    expect(meta.mastery).toEqual(['slow']);
    expect(meta.weaponDamage).toBe('1d12');
    expect(meta.weaponDamageType).toBe('holy');
    expect(meta.hitModifier).toBe(2);
  });
});

describe('parseHeirloomV2', () => {
  it('extracts the golden shape from the attribute spelling', () => {
    expect(parseHeirloomV2(readFileSync(FIXTURE, 'utf8'))).toEqual(golden());
  });

  it('reads header and feature slots in the element spelling', () => {
    const source = [
      '<Heirloom>',
      '',
      '<Rarity>Very rare</Rarity>',
      '<Attunement>required</Attunement>',
      '<Mastery>Slow; Quick</Mastery>',
      '',
      '<Feature>',
      '',
      '#### ◆ Probe <span>Tag</span>',
      '',
      '<Cost>1 Minor Action</Cost>',
      '<Targets>you</Targets>',
      '',
      'Prose.',
      '',
      '</Feature>',
      '',
      '</Heirloom>',
      '',
    ].join('\n');
    expect(parseHeirloomV2(source)).toEqual({
      rarity: 'very rare',
      attunement: 'required',
      mastery: ['slow', 'quick'],
      features: [
        {
          name: 'Probe',
          kind: 'feature',
          tag: 'Tag',
          cost: '1 Minor Action',
          targets: 'you',
        },
      ],
    });
  });

  it('returns an empty shape when no Heirloom element is present', () => {
    expect(parseHeirloomV2('# Plain article\n\nProse only.\n')).toEqual({
      rarity: '',
      features: [],
    });
  });

  it('reads subtype and weapon properties from the base slot', () => {
    const parsed = parseHeirloomSource(
      readFileSync(FIXTURE, 'utf8'),
      FIXTURE,
      sharedData as never,
    ) as {
      weaponType?: string;
      weaponProperties?: string[];
      tags: string[];
    };

    expect(parsed.weaponType).toBe('curved longsword');
    expect(parsed.weaponProperties).toEqual(['finesse', 'versatile']);
    expect(parsed.tags).toEqual(
      expect.arrayContaining(['property:finesse', 'property:versatile']),
    );
  });

  it('takes the subtype from the parenthetical of a base category', () => {
    const parsed = parseHeirloomSource(
      '# Robe\n\n<Heirloom rarity="rare" base="Clothing (Robes, Unarmored)">\n\nProse.\n\n</Heirloom>\n',
      FIXTURE,
      sharedData as never,
    ) as { itemType?: string; weaponType?: string };

    expect(parsed.itemType).toBe('clothing');
    expect(parsed.weaponType).toBe('robes');
  });

  it('reads the subtype of a comma-spelled base', () => {
    const parsed = parseHeirloomSource(
      '# Helm\n\n<Heirloom rarity="rare" base="Armor, Helmet">\n\nProse.\n\n</Heirloom>\n',
      FIXTURE,
      sharedData as never,
    ) as { itemType?: string; weaponType?: string };

    expect(parsed.itemType).toBe('armor');
    expect(parsed.weaponType).toBe('helmet');
  });

  it('keeps a qualified property out of the unique tags', () => {
    const parsed = parseHeirloomSource(
      '# Rifle\n\n<Heirloom rarity="rare" base="Rifle (Unwieldy, Ranged 60/120, Reach ([= 6 stride =]), Special)">\n\nProse.\n\n</Heirloom>\n',
      FIXTURE,
      sharedData as never,
    ) as { weaponProperties?: string[]; tags: string[] };

    expect(parsed.weaponProperties).toEqual([
      'ranged',
      'reach',
      'special',
      'unwieldy',
    ]);
    expect(parsed.tags.filter((tag) => tag.startsWith('unique:'))).toEqual([]);
  });

  it('captures the current parser before/after for the report', () => {
    const source = readFileSync(FIXTURE, 'utf8');
    const before = parseHeirloomSource(source, FIXTURE, sharedData as never);
    const after = parseHeirloomV2(source);
    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(
      path.join(REPORT_DIR, 't6-before-after.json'),
      JSON.stringify({ before, after }, null, 2),
    );
    expect(before).toBeTruthy();
  });
});
