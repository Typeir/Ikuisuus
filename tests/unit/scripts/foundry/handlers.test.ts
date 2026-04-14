/**
 * @fileoverview Tests for the Foundry feature handler system.
 * @description Verifies the decorator metadata, parser registry dispatch,
 * and Yskeia's three text_pipe handler implementations against their
 * expected hardcoded Foundry item overrides.
 *
 * @module tests/unit/scripts/foundry/handlers.test
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import { describe, expect, it } from 'vitest';
import {
  HANDLER_MAP_KEY,
  PARSER_SHEET_KEY,
  type HandlerEntry,
} from '../../../../foundry/scripts/handlers/decorators';
import { ParserRegistry } from '../../../../foundry/scripts/handlers/registry';
import type { SaveActivity } from '../../../../foundry/scripts/handlers/types';
import { YskeiaParser } from '../../../../foundry/scripts/parsers/yskeiaParser';

describe('Foundry Handler Decorators', () => {
  it('stores the sheet slug via @parser', () => {
    const slug = (YskeiaParser as unknown as Record<symbol, string>)[
      PARSER_SHEET_KEY
    ];
    expect(slug).toBe('war-godess-yskeia');
  });

  it('stores handler entries via @handler', () => {
    const entries: HandlerEntry[] = (
      YskeiaParser.prototype as Record<symbol, HandlerEntry[]>
    )[HANDLER_MAP_KEY];
    expect(entries).toBeDefined();
    expect(entries.length).toBe(3);

    const featureIds = entries.map((e) => e.featureId);
    expect(featureIds).toContain('faterender-railgun-recharge-6');
    expect(featureIds).toContain('arms-race');
    expect(featureIds).toContain('tides-of-ruin');
  });
});

describe('ParserRegistry', () => {
  it('registers a parser class and populates the dispatch table', () => {
    const registry = new ParserRegistry([
      YskeiaParser as unknown as new () => any,
    ]);
    expect(registry.registeredSheets).toContain('war-godess-yskeia');
    expect(registry.registeredFeatures).toHaveLength(3);
  });

  it('dispatches to the correct handler method', () => {
    const registry = new ParserRegistry([
      YskeiaParser as unknown as new () => any,
    ]);
    const result = registry.dispatch(
      'war-godess-yskeia/faterender-railgun-recharge-6',
      '',
    );
    expect(result).not.toBeNull();
  });

  it('returns null for unregistered feature IDs', () => {
    const registry = new ParserRegistry([
      YskeiaParser as unknown as new () => any,
    ]);
    const result = registry.dispatch('unknown-monster/some-feature', '');
    expect(result).toBeNull();
  });

  it('checks existence with has()', () => {
    const registry = new ParserRegistry([
      YskeiaParser as unknown as new () => any,
    ]);
    expect(registry.has('war-godess-yskeia/arms-race')).toBe(true);
    expect(registry.has('war-godess-yskeia/nonexistent')).toBe(false);
  });

  it('throws if class is missing @parser decorator', () => {
    class UndecoratedParser {
      sheetSlug = '';
    }
    expect(() => {
      new ParserRegistry([UndecoratedParser as unknown as new () => any]);
    }).toThrow('missing the @parser() decorator');
  });
});

describe('YskeiaParser — Faterender Railgun', () => {
  const registry = new ParserRegistry([
    YskeiaParser as unknown as new () => any,
  ]);
  const result = registry.dispatch(
    'war-godess-yskeia/faterender-railgun-recharge-6',
    '',
  )!;

  it('returns a non-null result', () => {
    expect(result).not.toBeNull();
  });

  it('has a Save Activity keyed as dnd5eactivity000', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.type).toBe('save');
  });

  it('has DC 35 Dex save', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.save.ability).toBe('dex');
    expect(save.save.dc.formula).toBe('35');
  });

  it('has line target template on the Activity', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.target.template.type).toBe('line');
    expect(save.target.template.value).toBe('3000');
    expect(save.target.template.width).toBe('10');
  });

  it('has 3000 ft range on the Activity', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.range.value).toBe('3000');
    expect(save.range.units).toBe('ft');
  });

  it('has ability-score-sum custom damage formula', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.damage.parts).toHaveLength(1);
    expect(save.damage.parts[0].custom.enabled).toBe(true);
    expect(save.damage.parts[0].custom.formula).toBe('sum(abilities)');
    expect(save.damage.parts[0].types).toEqual(['force']);
  });

  it('has recharge activation condition', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.activation.condition).toBe('Costs 1 Deed; Recharge 6');
  });

  it('has correct mechanic flags', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.textPipe).toBe(true);
    expect(flags.sequentialTargeting).toBe(true);
    expect(flags.disintegrate).toBe(true);
    expect(flags.objectDamage).toBe(200);
    expect(flags.markSynergy).toBe(true);
    expect(flags.instantDeathThreshold).toBe(20);
    expect(flags.ignoresResistances).toBe(true);
    expect(flags.ignoresImmunities).toBe(true);
    expect(flags.ignoresCover).toBe(true);
  });
});

describe('YskeiaParser — Arms Race', () => {
  const registry = new ParserRegistry([
    YskeiaParser as unknown as new () => any,
  ]);
  const result = registry.dispatch('war-godess-yskeia/arms-race', '')!;

  it('returns a non-null result', () => {
    expect(result).not.toBeNull();
  });

  it('has a Save Activity keyed as dnd5eactivity000', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.type).toBe('save');
  });

  it('has lair activation', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.activation.type).toBe('lair');
  });

  it('has DC 25 Dex save', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.save.ability).toBe('dex');
    expect(save.save.dc.formula).toBe('25');
  });

  it('has dual damage types', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.damage.parts).toHaveLength(2);
    expect(save.damage.parts[0].types).toEqual(['fire']);
    expect(save.damage.parts[0].number).toBe('6');
    expect(save.damage.parts[0].denomination).toBe('10');
    expect(save.damage.parts[1].types).toEqual(['piercing']);
    expect(save.damage.parts[1].number).toBe('6');
    expect(save.damage.parts[1].denomination).toBe('10');
  });

  it('has 1-mile range on the Activity', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.range.value).toBe('1');
    expect(save.range.units).toBe('mi');
  });

  it('has radius target template', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.target.template.type).toBe('radius');
    expect(save.target.template.value).toBe('5');
  });

  it('has maelstrom flags', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.textPipe).toBe(true);
    expect(flags.maelstromCount).toBe(2);
    expect(flags.thickness).toBe(5);
    expect(flags.expansionRate).toBe(5);
    expect(flags.maxRadius).toBe(60);
    expect(flags.expandsPerTurn).toBe(true);
    expect(flags.hollow).toBe(true);
    expect(flags.affectsSelf).toBe(true);
  });

  it('has collision resonance data', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.collisionDamage).toBe(100);
    expect(flags.collisionDamageType).toBe('force');
    expect(flags.collisionBlastRadius).toBe(300);
  });
});

describe('YskeiaParser — Tides of Ruin', () => {
  const registry = new ParserRegistry([
    YskeiaParser as unknown as new () => any,
  ]);
  const result = registry.dispatch('war-godess-yskeia/tides-of-ruin', '')!;

  it('returns a non-null result', () => {
    expect(result).not.toBeNull();
  });

  it('has a Save Activity keyed as dnd5eactivity000', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.type).toBe('save');
  });

  it('has lair activation', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.activation.type).toBe('lair');
  });

  it('has wall target template', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.target.template.type).toBe('wall');
    expect(save.target.template.value).toBe('10');
  });

  it('has DC 30 Str save', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.save.ability).toBe('str');
    expect(save.save.dc.formula).toBe('30');
  });

  it('has primary bludgeoning damage', () => {
    const save = result.activities!['dnd5eactivity000'] as SaveActivity;
    expect(save.damage.parts).toHaveLength(1);
    expect(save.damage.parts[0].number).toBe('60');
    expect(save.damage.parts[0].denomination).toBe('10');
    expect(save.damage.parts[0].types).toEqual(['bludgeoning']);
  });

  it('has movement and restrain flags', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.textPipe).toBe(true);
    expect(flags.wallThickness).toBe(10);
    expect(flags.advanceRate).toBe(5);
    expect(flags.maxConcurrent).toBe(4);
    expect(flags.restrainOnFail).toBe(true);
    expect(flags.advancesPerTurn).toBe(true);
  });

  it('has escape DC', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.escapeDC).toBe(28);
  });

  it('has push on success', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.pushOnSuccess).toBe(30);
  });

  it('has shrapnel collapse data', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.shrapnelDamage).toBe('40d10');
    expect(flags.shrapnelDamageType).toBe('piercing');
    expect(flags.shrapnelRadius).toBe(40);
    expect(flags.shrapnelSaveDC).toBe(25);
  });

  it('has terrain destruction flags', () => {
    const flags = result.flags?.['ikuisuus-damocles'] as Record<
      string,
      unknown
    >;
    expect(flags.destroysTerrain).toBe(true);
    expect(flags.crushesObjects).toBe(true);
  });
});
