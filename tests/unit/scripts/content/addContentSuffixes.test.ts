/**
 * @fileoverview Contract tests for addContentSuffixes script metadata compliance.
 * @module tests/unit/scripts/content/addContentSuffixes
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const targetFile = path.resolve('scripts/content/addContentSuffixes.ts');

describe('addContentSuffixes script', () => {
  it('declares required file heading tags', async () => {
    const content = await readFile(targetFile, 'utf8');

    expect(content).toContain('@fileoverview');
    expect(content).toContain('@module');
    expect(content).toContain('@author Typeir');
    expect(content).toContain('@version');
    expect(content).toContain('@since');
  });
});
