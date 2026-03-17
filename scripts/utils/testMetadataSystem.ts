/**
 * Integration test helper for MetadataTable components
 *
 * @fileoverview Verifies that the metadata table system is working correctly.
 * Checks directories, metadata files, and component files.
 *
 * @module testMetadataSystem
 * @version 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/testMetadataSystem.ts
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

const log = createLogger({ module: 'testMetadataSystem' });

/** System status results */
interface SystemStatus {
  /** Whether the monsters directory exists */
  monstersDir: boolean;
  /** Whether the heirlooms directory exists */
  heirloomsDir: boolean;
  /** Number of monster metadata files */
  monsterMetadata: number;
  /** Number of heirloom metadata files */
  heirloomMetadata: number;
  /** Whether the monster main.mdx exists */
  monsterMainMdx: boolean;
  /** Whether the heirloom main.mdx exists */
  heirloomMainMdx: boolean;
  /** Component file existence */
  components: {
    /** MetadataTable component exists */
    MetadataTable: boolean;
    /** MonsterTable component exists */
    MonsterTable: boolean;
    /** HeirloomTable component exists */
    HeirloomTable: boolean;
  };
}

async function testMetadataSystem(): Promise<void> {
  const results: SystemStatus = {
    monstersDir: false,
    heirloomsDir: false,
    monsterMetadata: 0,
    heirloomMetadata: 0,
    monsterMainMdx: false,
    heirloomMainMdx: false,
    components: {
      MetadataTable: false,
      MonsterTable: false,
      HeirloomTable: false,
    },
  };

  try {
    const monstersDir = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'monsters',
    );
    await fs.access(monstersDir);
    results.monstersDir = true;

    const monsterFiles = await fs.readdir(monstersDir);
    results.monsterMetadata = monsterFiles.filter((f) =>
      f.endsWith('.metadata.json'),
    ).length;

    try {
      await fs.access(path.join(monstersDir, 'main.mdx'));
      results.monsterMainMdx = true;
    } catch {
      results.monsterMainMdx = false;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error checking monsters directory', { error: msg });
  }

  try {
    const heirloomsDir = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'items',
      'heirlooms',
    );
    await fs.access(heirloomsDir);
    results.heirloomsDir = true;

    const heirloomFiles = await fs.readdir(heirloomsDir);
    results.heirloomMetadata = heirloomFiles.filter((f) =>
      f.endsWith('.metadata.json'),
    ).length;

    try {
      await fs.access(path.join(heirloomsDir, 'main.mdx'));
      results.heirloomMainMdx = true;
    } catch {
      results.heirloomMainMdx = false;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error checking heirlooms directory', { error: msg });
  }

  try {
    const componentsDir = path.join(
      process.cwd(),
      'src',
      'lib',
      'components',
      'mdx',
      'MetadataTable',
    );

    try {
      await fs.access(path.join(componentsDir, 'MetadataTable.tsx'));
      results.components.MetadataTable = true;
    } catch {
      /* empty */
    }

    try {
      await fs.access(path.join(componentsDir, 'MonsterTable.tsx'));
      results.components.MonsterTable = true;
    } catch {
      /* empty */
    }

    try {
      await fs.access(path.join(componentsDir, 'HeirloomTable.tsx'));
      results.components.HeirloomTable = true;
    } catch {
      /* empty */
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error checking components', { error: msg });
  }

  log.message('\n=== Metadata Table System Status ===\n');

  log.message('📁 Directories:');
  log.message(`  Monsters: ${results.monstersDir ? '✅' : '❌'}`);
  log.message(`  Heirlooms: ${results.heirloomsDir ? '✅' : '❌'}`);

  log.message('\n📊 Metadata Files:');
  log.message(`  Monsters: ${results.monsterMetadata} files`);
  log.message(`  Heirlooms: ${results.heirloomMetadata} files`);

  log.message('\n📄 Index Pages (main.mdx):');
  log.message(`  Monsters: ${results.monsterMainMdx ? '✅' : '❌'}`);
  log.message(`  Heirlooms: ${results.heirloomMainMdx ? '✅' : '❌'}`);

  log.message('\n⚛️  Components:');
  log.message(
    `  MetadataTable: ${results.components.MetadataTable ? '✅' : '❌'}`,
  );
  log.message(
    `  MonsterTable: ${results.components.MonsterTable ? '✅' : '❌'}`,
  );
  log.message(
    `  HeirloomTable: ${results.components.HeirloomTable ? '✅' : '❌'}`,
  );

  const allGood =
    results.monstersDir &&
    results.heirloomsDir &&
    results.monsterMetadata > 0 &&
    results.heirloomMetadata > 0 &&
    results.monsterMainMdx &&
    results.heirloomMainMdx &&
    results.components.MetadataTable &&
    results.components.MonsterTable &&
    results.components.HeirloomTable;

  log.message('\n' + '='.repeat(35));
  if (allGood) {
    log.message('✅ All systems operational!\n');
    log.message('Next steps:');
    log.message('  1. Run: npm run dev');
    log.message('  2. Visit: http://localhost:3000/en/library/monsters/main');
    log.message(
      '  3. Visit: http://localhost:3000/en/library/items/heirlooms/main',
    );
  } else {
    log.message('⚠️  Some issues detected. Review the checks above.\n');

    if (results.monsterMetadata === 0) {
      log.message('💡 Tip: Run "npm run generate-monster-metadata"');
    }
    if (results.heirloomMetadata === 0) {
      log.message('💡 Tip: Run "npm run generate-heirloom-metadata"');
    }
  }
  log.message('');
}

testMetadataSystem().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  log.error('Fatal error', { error: msg });
});
