#!/usr/bin/env tsx
/**
 * @fileoverview Emits the DDL MikroORM derives from the entity metadata and a
 * sorted metadata manifest, without a database connection.
 *
 * @module scripts/db/pg/dumpSchema
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-28
 */

import { MikroORM } from '@mikro-orm/postgresql';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/** Destination for the rendered DDL snapshot. */
const OUTPUT_DIR = path.join(process.cwd(), '.ignore', 'schema');

/**
 * Renders the create-schema DDL for the configured entities with no database
 * connection.
 *
 * @returns {Promise<string>} Newline-terminated DDL.
 */
const renderSchema = async (): Promise<string> => {
  const { ormConfig } = await import('../../../src/lib/db/orm/ormConfig');

  const orm = await MikroORM.init({
    ...ormConfig,
    clientUrl: 'postgresql://schema:schema@127.0.0.1:5432/schema',
    connect: false,
    debug: false,
  });

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  await orm.close(true);

  return sql;
};

/**
 * Sorts entity metadata into a stable order and summarises it.
 *
 * @returns {Promise<string>} Sorted metadata manifest.
 */
const renderManifest = async (): Promise<string> => {
  const { ormConfig } = await import('../../../src/lib/db/orm/ormConfig');

  const orm = await MikroORM.init({
    ...ormConfig,
    clientUrl: 'postgresql://schema:schema@127.0.0.1:5432/schema',
    connect: false,
    debug: false,
  });

  const all = orm.getMetadata().getAll();
  const lines: string[] = [];

  for (const name of Object.keys(all).sort()) {
    const meta = all[name];
    lines.push(
      `entity ${name} table=${meta.tableName ?? '-'} pk=${(meta.primaryKeys ?? []).join('+') || '-'} embeddable=${Boolean(meta.embeddable)}`,
    );
    for (const propName of Object.keys(meta.properties ?? {}).sort()) {
      const p = meta.properties[propName];
      lines.push(
        [
          `  ${propName}`,
          `kind=${p.kind}`,
          `type=${p.type}`,
          `columnTypes=${JSON.stringify(p.columnTypes ?? null)}`,
          `fieldNames=${JSON.stringify(p.fieldNames ?? null)}`,
          `nullable=${Boolean(p.nullable)}`,
          `primary=${Boolean(p.primary)}`,
          `autoincrement=${Boolean(p.autoincrement)}`,
          `default=${JSON.stringify(p.default ?? null)}`,
          `entity=${p.type ?? '-'}`,
          `mappedBy=${p.mappedBy ?? '-'}`,
          `inversedBy=${p.inversedBy ?? '-'}`,
          `orphanRemoval=${Boolean(p.orphanRemoval)}`,
        ].join(' '),
      );
    }
    for (const idx of [...(meta.indexes ?? [])].sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b)),
    )) {
      lines.push(`  index ${JSON.stringify(idx)}`);
    }
    for (const uq of [...(meta.uniques ?? [])].sort((a, b) =>
      JSON.stringify(a).localeCompare(JSON.stringify(b)),
    )) {
      lines.push(`  unique ${JSON.stringify(uq)}`);
    }
  }

  await orm.close(true);
  return `${lines.join('\n')}\n`;
};

/**
 * Writes the DDL and manifest snapshots under a caller-supplied label.
 */
const main = async (): Promise<void> => {
  const label = process.argv[2] ?? 'current';
  await mkdir(OUTPUT_DIR, { recursive: true });

  const sql = await renderSchema();
  const manifest = await renderManifest();

  const sqlPath = path.join(OUTPUT_DIR, `${label}.sql`);
  const manifestPath = path.join(OUTPUT_DIR, `${label}.manifest.txt`);

  await writeFile(sqlPath, sql, 'utf-8');
  await writeFile(manifestPath, manifest, 'utf-8');

  const entities = manifest.split('\n').filter((l) => l.startsWith('entity ')).length;
  const props = manifest.split('\n').filter((l) => l.startsWith('  ') && !l.startsWith('  index') && !l.startsWith('  unique')).length;

  process.stdout.write(
    `[dumpSchema] ${label}: ${entities} entities, ${props} properties, ${sql.split('\n').filter(Boolean).length} DDL lines\n`,
  );
  process.stdout.write(`[dumpSchema] wrote ${sqlPath}\n[dumpSchema] wrote ${manifestPath}\n`);
};

main().catch((err: unknown) => {
  process.stderr.write(`[dumpSchema] failed: ${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
