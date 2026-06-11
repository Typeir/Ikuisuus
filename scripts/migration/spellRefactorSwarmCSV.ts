/**
 * Spell Refactoring Script - CSV-driven batch operations
 *
 * @fileoverview Main entry point for CSV-driven spell refactoring
 * @module scripts/migration/spellRefactorSwarmCSV
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 1.0.0
 */

import path from 'path';
import { parseCSV } from './spellRefactorSwarmCSV/parser.js';
import { processSpellRecord, type RefactorAction } from './spellRefactorSwarmCSV/processor.js';

const CSV_FILE = path.resolve('Spell fixes - Sheet1.csv');

const log = {
  info: (msg: string) => {
    process.stderr.write(`ℹ️  ${msg}\n`);
  },
  success: (msg: string) => {
    process.stderr.write(`✅ ${msg}\n`);
  },
  warn: (msg: string) => {
    process.stderr.write(`⚠️  ${msg}\n`);
  },
  error: (msg: string) => {
    process.stderr.write(`❌ ${msg}\n`);
  },
  debug: (msg: string) => {
    process.stderr.write(`🔍 ${msg}\n`);
  },
};

const actionEmojis: Record<RefactorAction, string> = {
  delete: '🗑️',
  rename: '✏️',
  describe: '📝',
  skip: '⏭️',
  error: '❌',
};

async function main() {
  log.info('🔧 Spell Refactoring Script');
  log.info(`📄 CSV file: ${CSV_FILE}`);

  try {
    const records = parseCSV(CSV_FILE);
    log.info(`📊 Parsed ${records.length} records from CSV`);

    let totalDeleted = 0;
    let totalRenamed = 0;
    let totalDescribed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const results = processSpellRecord(record);

      for (const result of results) {
        const emoji = actionEmojis[result.action];
        const msg = `${emoji} [${result.spellName}] ${result.message}`;

        switch (result.action) {
          case 'delete':
            log.debug(msg);
            totalDeleted++;
            break;
          case 'rename':
            log.debug(msg);
            totalRenamed++;
            break;
          case 'describe':
            log.debug(msg);
            totalDescribed++;
            break;
          case 'skip':
            log.warn(msg);
            totalSkipped++;
            break;
          case 'error':
            log.error(msg);
            totalErrors++;
            break;
        }
      }
    }

    log.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log.info('📊 Summary:');
    log.info(`  🗑️  Deleted:     ${totalDeleted}`);
    log.info(`  ✏️  Renamed:     ${totalRenamed}`);
    log.info(`  📝 Described:   ${totalDescribed}`);
    log.info(`  ⏭️  Skipped:     ${totalSkipped}`);
    log.info(`  ❌ Errors:      ${totalErrors}`);
    log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (totalErrors > 0) {
      log.warn('Some errors occurred. Review above for details.');
      process.exit(1);
    } else {
      log.success('Refactoring complete!');
      log.info('\n📌 Next steps:');
      log.info('   1. Review changes in src/content/en/spells/');
      log.info('   2. Run: npm run generate-metadata');
      log.info('   3. Run: npm run pre-init');
      log.info('   4. Test build: npm run build');
    }
  } catch (err) {
    log.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
