/**
 * @fileoverview Unit tests for SpellTable shared type declarations
 * @module tests/unit/src/lib/components/mdx/spellTable/spellTable.types.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { SpellData } from '@/lib/services/api/spellSourceService';
import type { SpellTablesProps } from '@/lib/components/mdx/spellTable/spellTable.types';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('spellTable.types', () => {
  it('accepts minimal props shape', () => {
    const props: SpellTablesProps = {
      sources: ['/api/spells'],
    };

    expect(props.sources).toHaveLength(1);
    expect(props.sources[0]).toBe('/api/spells');
  });

  it('supports optional configuration props', () => {
    const props: SpellTablesProps = {
      sources: [['inline'] as unknown as SpellData[]],
      locale: 'en',
      levels: [0, 1, 2],
      levelLabels: { 0: 'Cantrip' },
      basePath: 'spells',
      showAllTab: true,
      spells: ['fireball'],
      listSource: 'wizard',
    };

    expect(props.locale).toBe('en');
    expect(props.showAllTab).toBe(true);
    expect(props.listSource).toBe('wizard');
  });

  it('defines sources as string or SpellData[] arrays', () => {
    expectTypeOf<SpellTablesProps['sources']>().toEqualTypeOf<
      (string | SpellData[])[]
    >();
  });
});
