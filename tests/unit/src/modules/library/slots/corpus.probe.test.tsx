/**
 * @fileoverview Throwaway probe: compile every spell in the corpus.
 * @module tests/unit/src/modules/library/slots/corpus.probe.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { compileStatic } from '@/modules/library/infrastructure/compile/compileStatic';
import enrichedComponents from '@/modules/library/presentation/components';
import { slotComponents } from '@/modules/library/presentation/components/slots';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('spell corpus', () => {
  it('compiles', async () => {
    const dir = path.resolve(process.cwd(), 'src/content/en/spells');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.spell.mdx'));
    const failures: string[] = [];
    const bold: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      try {
        const { content } = await compileStatic({
          source,
          components: { ...enrichedComponents, ...slotComponents },
          locale: 'en',
        });
        const html = renderToStaticMarkup(
          React.createElement(React.Fragment, null, content),
        );
        if (/<p><strong>[^<]{1,60}\.<\/strong>/.test(html)) bold.push(file);
      } catch (error) {
        failures.push(`${file}: ${(error as Error).message.split('\n')[0]}`);
      }
    }
    fs.writeFileSync(
      path.resolve(process.cwd(), '.ignore/corpus-probe.txt'),
      [
        `compiled ${files.length} failures ${failures.length}`,
        ...failures.map((line) => `  FAIL ${line}`),
        `still bold-led: ${bold.length}`,
        ...bold.map((line) => `  BOLD ${line}`),
      ].join('\n'),
      'utf8',
    );
    expect(failures).toEqual([]);
  }, 600000);
});
