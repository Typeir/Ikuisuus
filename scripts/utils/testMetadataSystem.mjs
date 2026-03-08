/**
 * Integration test helper for MetadataTable components
 *
 * This file helps verify that the metadata table system is working correctly.
 * Run this to check if all pieces are in place.
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../core/logger.mjs';
const log = createLogger({ module: 'testMetadataSystem' });

async function testMetadataSystem() {
  const results = {
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
    // Check monsters directory
    const monstersDir = path.join(
      process.cwd(),
      'src',
      'content',
      'en',
      'monsters',
    );
    await fs.access(monstersDir);
    results.monstersDir = true;

    // Count monster metadata files
    const monsterFiles = await fs.readdir(monstersDir);
    results.monsterMetadata = monsterFiles.filter((f) =>
      f.endsWith('.metadata.json'),
    ).length;

    // Check for main.mdx
    try {
      await fs.access(path.join(monstersDir, 'main.mdx'));
      results.monsterMainMdx = true;
    } catch {
      results.monsterMainMdx = false;
    }
  } catch (error) {
    log.error('Error checking monsters directory', { error: error.message });
  }

  try {
    // Check heirlooms directory
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

    // Count heirloom metadata files
    const heirloomFiles = await fs.readdir(heirloomsDir);
    results.heirloomMetadata = heirloomFiles.filter((f) =>
      f.endsWith('.metadata.json'),
    ).length;

    // Check for main.mdx
    try {
      await fs.access(path.join(heirloomsDir, 'main.mdx'));
      results.heirloomMainMdx = true;
    } catch {
      results.heirloomMainMdx = false;
    }
  } catch (error) {
    log.error('Error checking heirlooms directory', { error: error.message });
  }

  try {
    // Check component files
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
    } catch {}

    try {
      await fs.access(path.join(componentsDir, 'MonsterTable.tsx'));
      results.components.MonsterTable = true;
    } catch {}

    try {
      await fs.access(path.join(componentsDir, 'HeirloomTable.tsx'));
      results.components.HeirloomTable = true;
    } catch {}
  } catch (error) {
    log.error('Error checking components', { error: error.message });
  }

  // Print results
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

// Run the test
testMetadataSystem().catch((error) =>
  log.error('Fatal error', { error: error.message }),
);
