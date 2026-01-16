/**
 * Integration test helper for MetadataTable components
 * 
 * This file helps verify that the metadata table system is working correctly.
 * Run this to check if all pieces are in place.
 */

import fs from 'fs/promises';
import path from 'path';

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
    const monstersDir = path.join(process.cwd(), 'src', 'content', 'en', 'monsters');
    await fs.access(monstersDir);
    results.monstersDir = true;

    // Count monster metadata files
    const monsterFiles = await fs.readdir(monstersDir);
    results.monsterMetadata = monsterFiles.filter(f => f.endsWith('.metadata.json')).length;

    // Check for main.mdx
    try {
      await fs.access(path.join(monstersDir, 'main.mdx'));
      results.monsterMainMdx = true;
    } catch {
      results.monsterMainMdx = false;
    }
  } catch (error) {
    console.error('Error checking monsters directory:', error);
  }

  try {
    // Check heirlooms directory
    const heirloomsDir = path.join(process.cwd(), 'src', 'content', 'en', 'items', 'heirlooms');
    await fs.access(heirloomsDir);
    results.heirloomsDir = true;

    // Count heirloom metadata files
    const heirloomFiles = await fs.readdir(heirloomsDir);
    results.heirloomMetadata = heirloomFiles.filter(f => f.endsWith('.metadata.json')).length;

    // Check for main.mdx
    try {
      await fs.access(path.join(heirloomsDir, 'main.mdx'));
      results.heirloomMainMdx = true;
    } catch {
      results.heirloomMainMdx = false;
    }
  } catch (error) {
    console.error('Error checking heirlooms directory:', error);
  }

  try {
    // Check component files
    const componentsDir = path.join(process.cwd(), 'src', 'lib', 'components', 'mdx', 'MetadataTable');
    
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
    console.error('Error checking components:', error);
  }

  // Print results
  console.log('\n=== Metadata Table System Status ===\n');
  
  console.log('📁 Directories:');
  console.log(`  Monsters: ${results.monstersDir ? '✅' : '❌'}`);
  console.log(`  Heirlooms: ${results.heirloomsDir ? '✅' : '❌'}`);
  
  console.log('\n📊 Metadata Files:');
  console.log(`  Monsters: ${results.monsterMetadata} files`);
  console.log(`  Heirlooms: ${results.heirloomMetadata} files`);
  
  console.log('\n📄 Index Pages (main.mdx):');
  console.log(`  Monsters: ${results.monsterMainMdx ? '✅' : '❌'}`);
  console.log(`  Heirlooms: ${results.heirloomMainMdx ? '✅' : '❌'}`);
  
  console.log('\n⚛️  Components:');
  console.log(`  MetadataTable: ${results.components.MetadataTable ? '✅' : '❌'}`);
  console.log(`  MonsterTable: ${results.components.MonsterTable ? '✅' : '❌'}`);
  console.log(`  HeirloomTable: ${results.components.HeirloomTable ? '✅' : '❌'}`);
  
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

  console.log('\n' + '='.repeat(35));
  if (allGood) {
    console.log('✅ All systems operational!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run dev');
    console.log('  2. Visit: http://localhost:3000/en/library/monsters/main');
    console.log('  3. Visit: http://localhost:3000/en/library/items/heirlooms/main');
  } else {
    console.log('⚠️  Some issues detected. Review the checks above.\n');
    
    if (results.monsterMetadata === 0) {
      console.log('💡 Tip: Run "npm run generate-monster-metadata"');
    }
    if (results.heirloomMetadata === 0) {
      console.log('💡 Tip: Run "npm run generate-heirloom-metadata"');
    }
  }
  console.log('');
}

// Run the test
testMetadataSystem().catch(console.error);
