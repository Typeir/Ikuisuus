/**
 * ORM Schema Types Unit Tests
 *
 * @fileoverview Compile-time assertions that the option shapes still accept the
 * decorator arguments the entity modules actually pass.
 *
 * @module tests/unit/lib/db/orm/schema/types
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type {
  EmbeddedFieldOptions,
  EntityOptions,
  ManyToOneOptions,
  OneToManyOptions,
  ScalarFieldOptions,
  TableConstraintOptions,
} from '@/lib/db/orm/schema/types';
import { describe, expect, it } from 'vitest';

describe('schema option types', () => {
  it('should accept the scalar shapes used across the entity modules', () => {
    const columns = [
      { type: 'string' },
      { type: 'text', nullable: true },
      { type: 'number', fieldName: 'boon_budget', columnType: 'smallint', nullable: true },
      { type: 'string[]' },
      { type: 'json', fieldName: 'sub_options', columnType: 'jsonb', nullable: true },
      { type: 'Date', columnType: 'timestamptz', defaultRaw: 'now()' },
      { type: 'number', autoincrement: true, primary: true },
    ] satisfies ScalarFieldOptions[];

    expect(columns).toHaveLength(7);
  });

  it('should require a literal entity name on relations', () => {
    const owning = {
      entity: 'BloodlineEntity',
      fieldName: 'bloodline_id',
      deleteRule: 'cascade',
    } satisfies ManyToOneOptions;

    const inverse = {
      entity: 'BloodlineBoonEntity',
      mappedBy: 'bloodline',
      orphanRemoval: true,
    } satisfies OneToManyOptions;

    expect(typeof owning.entity).toBe('string');
    expect(typeof inverse.entity).toBe('string');
  });

  it('should accept embedded, constraint and entity option shapes', () => {
    const embedded = { entity: 'HeirloomChargesEmbed', prefix: 'charges_' } satisfies EmbeddedFieldOptions;
    const constraint = { properties: ['locale', 'slug'] } satisfies TableConstraintOptions;
    const entity = { tableName: 'bloodlines' } satisfies EntityOptions;

    expect(embedded.entity).toBe('HeirloomChargesEmbed');
    expect(constraint.properties).toHaveLength(2);
    expect(entity.tableName).toBe('bloodlines');
  });
});
