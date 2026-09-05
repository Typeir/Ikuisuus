/**
 * @fileoverview Tests for the lab index page.
 *
 * @module tests/unit/src/app/[locale]/labs/page.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import LabsIndexPage, { generateMetadata } from '@/app/[locale]/labs/page';

describe('LabsIndexPage', () => {
  it('lists every discovered lab as a locale-prefixed link', async () => {
    render(await LabsIndexPage({ params: Promise.resolve({ locale: 'en' }) }));
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toContain('/en/labs/dev/slots');
    expect(links).toContain('/en/labs/dev/deeds');
    for (const href of links) expect(href).toMatch(/^\/en\/labs\//);
  });

  it('never lists itself', async () => {
    render(await LabsIndexPage({ params: Promise.resolve({ locale: 'en' }) }));
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).not.toContain('/en/labs');
  });

  it('keeps the index out of search engines', () => {
    expect(generateMetadata().robots).toEqual({ index: false, follow: false });
  });
});
