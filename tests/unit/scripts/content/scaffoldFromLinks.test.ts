/**
 * Scaffold From Links Script Test
 *
 * @fileoverview Contract tests for scaffoldFromLinks script metadata compliance.
 * @module tests/unit/scripts/content/scaffoldFromLinks
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const targetFile = path.resolve('scripts/content/scaffoldFromLinks.ts');

describe('scaffoldFromLinks script', () => {
  it('starts with file-level JSDoc and required tags', async () => {
    const content = await readFile(targetFile, 'utf8');

    expect(content.startsWith('/**')).toBe(true);
    expect(content).toContain('@fileoverview');
    expect(content).toContain('@module');
    expect(content).toContain('@author Typeir');
    expect(content).toContain('@version');
    expect(content).toContain('@since');
  });
});
