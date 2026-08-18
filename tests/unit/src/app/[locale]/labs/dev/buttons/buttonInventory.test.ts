/**
 * @fileoverview Unit tests for the `<button>` class inventory scanner.
 * @description Covers tag extraction across multi-line and expression-bearing tags,
 * class-reference reading, stylesheet import resolution, state-modifier detection,
 * module naming, and declaration similarity.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/buttonInventory.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/buttonInventory
 */

import {
  buttonTags,
  classRefsFromTag,
  isStateModifier,
  resolveModuleName,
  resolveScssImports,
  similarity,
} from '@/app/[locale]/labs/dev/buttons/buttonInventory';
import { describe, expect, it } from 'vitest';

describe('buttonTags', () => {
  it('finds every button open tag', () => {
    const source = '<button>a</button><div /><button type="button" />';
    expect(buttonTags(source)).toHaveLength(2);
  });

  it('does not terminate on a greater-than inside an expression', () => {
    const source = '<button disabled={count > 3} className={s.a}>x</button>';
    expect(buttonTags(source)[0].text).toContain('className={s.a}');
  });

  it('spans a tag written across several lines', () => {
    const source = ['<button', "  type='button'", '  className={s.a}>'].join(
      '\n',
    );
    expect(buttonTags(source)[0].text).toContain('className={s.a}');
  });

  it('reports the offset of each tag', () => {
    const source = 'xx<button />';
    expect(buttonTags(source)[0].index).toBe(2);
  });

  it('returns nothing when there are no buttons', () => {
    expect(buttonTags('<div className={s.a} />')).toEqual([]);
  });
});

describe('classRefsFromTag', () => {
  it('reads a single style reference', () => {
    expect(classRefsFromTag('<button className={styles.row}>')).toEqual([
      { ident: 'styles', prop: 'row' },
    ]);
  });

  it('reads every reference in a template expression', () => {
    const tag =
      '<button className={`${btn.tab} ${active ? btn.tabActive : n}`}>';
    expect(classRefsFromTag(tag).map((r) => r.prop)).toEqual([
      'tab',
      'tabActive',
    ]);
  });

  it('returns nothing for a bare button', () => {
    expect(classRefsFromTag('<button type="button">')).toEqual([]);
  });
});

describe('resolveScssImports', () => {
  const from = 'C:/repo/src/modules/x/Thing.tsx';

  it('resolves a relative stylesheet import', () => {
    const imports = resolveScssImports(
      "import styles from './thing.module.scss';",
      from,
    );
    expect(imports.styles.endsWith('src/modules/x/thing.module.scss')).toBe(
      true,
    );
  });

  it('resolves an alias import to the src root', () => {
    const imports = resolveScssImports(
      "import btn from '@/styles/buttons.module.scss';",
      from,
    );
    expect(imports.btn.endsWith('src/styles/buttons.module.scss')).toBe(true);
  });

  it('ignores non-stylesheet imports', () => {
    const imports = resolveScssImports("import x from './x';", from);
    expect(imports.x).toBeUndefined();
  });
});

describe('isStateModifier', () => {
  it('treats a class with no structural property as a modifier', () => {
    expect(isStateModifier({ color: 'red', opacity: '0.5' })).toBe(true);
  });

  it('treats a small background-only tweak as a modifier', () => {
    expect(isStateModifier({ background: 'red', color: 'white' })).toBe(true);
  });

  it('treats a class with padding and cursor as a real button', () => {
    expect(
      isStateModifier({
        padding: '0.5rem',
        cursor: 'pointer',
        border: 'none',
        color: 'red',
      }),
    ).toBe(false);
  });

  it('treats an empty declaration block as a modifier', () => {
    expect(isStateModifier({})).toBe(true);
  });
});

describe('resolveModuleName', () => {
  it('names a feature module by its directory', () => {
    expect(resolveModuleName('src/modules/character-builder/x/y.tsx')).toBe(
      'character-builder',
    );
  });

  it('names app routes app', () => {
    expect(resolveModuleName('src/app/[locale]/page.tsx')).toBe('app');
  });

  it('names shared library code lib', () => {
    expect(resolveModuleName('src/lib/components/ui/modal/modal.tsx')).toBe(
      'lib',
    );
  });
});

describe('similarity', () => {
  it('scores identical blocks as 1', () => {
    expect(similarity({ color: 'red' }, { color: 'red' })).toBe(1);
  });

  it('scores disjoint blocks as 0', () => {
    expect(similarity({ color: 'red' }, { padding: '0' })).toBe(0);
  });

  it('scores a differing value as no overlap', () => {
    expect(similarity({ color: 'red' }, { color: 'blue' })).toBe(0);
  });

  it('scores partial overlap between 0 and 1', () => {
    const score = similarity(
      { color: 'red', padding: '0' },
      { color: 'red', margin: '0' },
    );
    expect(score).toBeCloseTo(1 / 3);
  });

  it('scores an empty block as 0', () => {
    expect(similarity({}, { color: 'red' })).toBe(0);
  });
});
