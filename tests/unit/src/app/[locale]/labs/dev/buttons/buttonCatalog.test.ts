/**
 * @fileoverview Unit tests for canonical button catalogue parsing.
 * @description Covers stylesheet parsing (names, docs, group headers), class-block
 * location, mixin extraction, and signature-mixin attribution including the rules
 * that keep generic helpers and shared mixins from being attributed.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/buttonCatalog.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/buttonCatalog
 */

import {
  classMixins,
  findClassLine,
  parseVariants,
  signatureMixins,
} from '@/app/[locale]/labs/dev/buttons/buttonCatalog';
import { describe, expect, it } from 'vitest';

const STYLESHEET = [
  "@use 'mixins' as *;",
  '',
  '/* ── Filled / solid ─────────────────────────────── */',
  '',
  '/** Neutral filled button. Secondary action. */',
  '.neutral {',
  '  @include button-base;',
  '  @include button-hover-scale;',
  '}',
  '',
  '/** Solid danger (filled). */',
  '.danger {',
  '  @include button-base;',
  '  @include button-danger;',
  '}',
  '',
  '/* ── Icon-only ──────────────────────────────────── */',
  '',
  '/**',
  ' * Bordered icon — resting border+fill,',
  ' * accent border/text on hover.',
  ' */',
  '.iconBordered {',
  '  @include button-icon-bordered;',
  '  @include disabled-state(0.4);',
  '}',
  '',
  '.undocumented {',
  '  color: red;',
  '}',
].join('\n');

const LINES = STYLESHEET.split('\n');

describe('parseVariants', () => {
  it('returns variants in declaration order', () => {
    expect(parseVariants(STYLESHEET).map((v) => v.name)).toEqual([
      'neutral',
      'danger',
      'iconBordered',
      'undocumented',
    ]);
  });

  it('captures single-line doc comments', () => {
    const neutral = parseVariants(STYLESHEET).find((v) => v.name === 'neutral');
    expect(neutral?.doc).toBe('Neutral filled button. Secondary action.');
  });

  it('joins multi-line doc comments into one string', () => {
    const bordered = parseVariants(STYLESHEET).find(
      (v) => v.name === 'iconBordered',
    );
    expect(bordered?.doc).toBe(
      'Bordered icon — resting border+fill, accent border/text on hover.',
    );
  });

  it('assigns the nearest preceding group header', () => {
    const variants = parseVariants(STYLESHEET);
    expect(variants.find((v) => v.name === 'danger')?.group).toBe(
      'Filled / solid',
    );
    expect(variants.find((v) => v.name === 'iconBordered')?.group).toBe(
      'Icon-only',
    );
  });

  it('leaves the doc empty for an undocumented class', () => {
    const undocumented = parseVariants(STYLESHEET).find(
      (v) => v.name === 'undocumented',
    );
    expect(undocumented?.doc).toBe('');
  });
});

describe('findClassLine', () => {
  it('returns the 1-indexed line a class opens on', () => {
    expect(LINES[findClassLine(LINES, 'danger') - 1].trim()).toBe('.danger {');
  });

  it('does not match a class that merely shares a prefix', () => {
    const lines = ['.iconBorderedWide {', '  color: red;', '}'];
    expect(findClassLine(lines, 'iconBordered')).toBe(0);
  });

  it('returns 0 when the class is absent', () => {
    expect(findClassLine(LINES, 'missing')).toBe(0);
  });
});

describe('classMixins', () => {
  it('collects the includes inside a class block', () => {
    expect(classMixins(LINES, 'danger')).toEqual([
      'button-base',
      'button-danger',
    ]);
  });

  it('stops at the closing brace of the block', () => {
    expect(classMixins(LINES, 'neutral')).not.toContain('button-danger');
  });

  it('returns an empty list for a class with no includes', () => {
    expect(classMixins(LINES, 'undocumented')).toEqual([]);
  });
});

describe('signatureMixins', () => {
  it('attributes a mixin used by exactly one variant', () => {
    const owners = signatureMixins({
      neutral: ['button-base', 'button-hover-scale'],
      danger: ['button-base', 'button-danger'],
    });
    expect(owners['button-danger']).toBe('danger');
  });

  it('attributes nothing when several variants share a mixin', () => {
    const owners = signatureMixins({
      icon: ['icon-transparent'],
      iconDanger: ['icon-transparent'],
    });
    expect(owners['icon-transparent']).toBeUndefined();
  });

  it('ignores generic helpers outside the button and icon families', () => {
    const owners = signatureMixins({ tertiary: ['disabled-state'] });
    expect(owners['disabled-state']).toBeUndefined();
  });

  it('keeps icon-family mixins that only one variant uses', () => {
    const owners = signatureMixins({
      iconRound: ['icon-rounded'],
      icon: ['icon-transparent'],
    });
    expect(owners['icon-rounded']).toBe('iconRound');
  });
});
