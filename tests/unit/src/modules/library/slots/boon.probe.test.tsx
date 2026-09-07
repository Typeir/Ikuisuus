/**
 * @fileoverview Throwaway probe: the markup around a bloodline boon.
 * @module tests/unit/src/modules/library/slots/boon.probe.test
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

describe('bloodline boons', () => {
  it('dumps the markup around the first boon', async () => {
    const file = path.resolve(
      process.cwd(),
      'src/content/en/character-creation/bloodlines/sunborn.bloodline.mdx',
    );
    const { content } = await compileStatic({
      source: fs.readFileSync(file, 'utf8'),
      components: { ...enrichedComponents, ...slotComponents },
      locale: 'en',
    });
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, content),
    );
    const at = html.indexOf('data-collapsible');
    fs.writeFileSync(
      path.resolve(process.cwd(), '.ignore/boon-probe.txt'),
      html.slice(Math.max(0, at - 1200), at + 900),
      'utf8',
    );
    expect(at).toBeGreaterThan(-1);
  }, 120000);
});
