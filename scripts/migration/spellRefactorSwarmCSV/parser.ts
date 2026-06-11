/**
 * CSV Parser for Spell Refactoring
 *
 * @fileoverview Simple CSV parser for spell refactoring records
 * @module scripts/migration/spellRefactorSwarmCSV/parser
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 1.0.0
 */

import fs from 'fs-extra';
import { parseCSVLine, isCompleteCSVLine } from './utils.js';

export function parseCSV(filePath: string): Array<Record<string, string>> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);

  const records: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    let currentLine = lines[i];
    while (i + 1 < lines.length && !isCompleteCSVLine(currentLine)) {
      i++;
      currentLine += '\n' + lines[i];
    }

    const values = parseCSVLine(currentLine);
    if (values.length === 0) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });

    if (record['spell name'] && record['spell name'].trim()) {
      records.push(record);
    }
  }

  return records;
}
