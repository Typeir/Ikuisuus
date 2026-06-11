/**
 * Spell Refactoring Processor
 *
 * @fileoverview Core logic for processing spell refactoring records
 * @module scripts/migration/spellRefactorSwarmCSV/processor
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 1.0.0
 */

import {
  slugify,
  splitSpellNames,
  updateH1,
  updateYAMLSource,
  updateDescription,
} from './utils.js';
import {
  spellFileExists,
  readSpellFile,
  writeSpellFile,
  deleteSpellFile,
  renameSpellFiles,
} from './files.js';

export type RefactorAction = 'delete' | 'rename' | 'describe' | 'skip' | 'error';

export interface RefactorResult {
  spellName: string;
  action: RefactorAction;
  message: string;
}

export function processSpellRecord(record: Record<string, string>): RefactorResult[] {
  const results: RefactorResult[] = [];
  const spellNames = splitSpellNames(record['spell name']);
  let newSpellName = record['new spell name']?.trim() || '';

  newSpellName = cleanNewSpellName(newSpellName);

  const description = record['description']?.trim() || '';
  const errata = record['errata']?.toLowerCase() || '';
  const shouldDelete = errata.includes('borrar');

  for (const spellName of spellNames) {
    try {
      const oldSlug = slugify(spellName);

      if (!spellFileExists(oldSlug)) {
        results.push({
          spellName,
          action: 'skip',
          message: `File not found: ${oldSlug}.mdx`,
        });
        continue;
      }

      if (shouldDelete) {
        deleteSpellFile(oldSlug);
        results.push({
          spellName,
          action: 'delete',
          message: `Deleted: ${oldSlug}.mdx`,
        });
        continue;
      }

      let fileContent = readSpellFile(oldSlug);

      let newSlug = oldSlug;
      if (newSpellName) {
        newSlug = slugify(newSpellName);

        if (newSlug !== oldSlug) {
          renameSpellFiles(oldSlug, newSlug);
          results.push({
            spellName,
            action: 'rename',
            message: `Renamed file: ${oldSlug}.mdx → ${newSlug}.mdx`,
          });

          fileContent = readSpellFile(newSlug);
        }

        fileContent = updateH1(fileContent, newSpellName);
        fileContent = updateYAMLSource(fileContent, 'Ikuisuus');

        results.push({
          spellName,
          action: 'rename',
          message: `Updated H1 to "${newSpellName}" and set source to "Ikuisuus"`,
        });
      } else if (description) {
        fileContent = updateYAMLSource(fileContent, 'Ikuisuus');
      }

      if (description) {
        fileContent = updateDescription(fileContent, description);
        results.push({
          spellName,
          action: 'describe',
          message: `Updated description`,
        });
      }

      writeSpellFile(newSlug, fileContent);

    } catch (err) {
      results.push({
        spellName,
        action: 'error',
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return results;
}

function cleanNewSpellName(name: string): string {
  if (!name) return '';

  let cleaned = name;

  cleaned = cleaned.replace(/\s*<-.*?$/, '');

  const slashIdx = cleaned.indexOf('/');
  if (slashIdx > -1) {
    cleaned = cleaned.substring(0, slashIdx);
  }

  return cleaned.trim();
}
