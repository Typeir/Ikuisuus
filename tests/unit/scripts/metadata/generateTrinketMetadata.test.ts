/**
 * @fileoverview Contract tests for generateTrinketMetadata script metadata compliance.
 * @module tests/unit/scripts/metadata/generateTrinketMetadata.test
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const targetFile = path.resolve('scripts/metadata/generateTrinketMetadata.ts');

describe('generateTrinketMetadata script', () => {
  it('declares required file heading tags', async () => {
    const content = await readFile(targetFile, 'utf8');

    expect(content).toContain('@fileoverview');
    expect(content).toContain('@module');
    expect(content).toContain('@author Typeir');
    expect(content).toContain('@version');
    expect(content).toContain('@since');
  });
});
