/**
 * @fileoverview Tests for the bloodline converter.
 * @description A bloodline gains a `<Bloodline>` wrapper carrying its boon
 * budget, `<Feature>` around each core feature, and `<Feature collapsible>` in
 * place of each boon's `<Collapsible>`. Its two Core Features tables are left
 * exactly as written.
 *
 * @module tests/unit/scripts/content/migrate-bloodline.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { describe, expect, it } from 'vitest';
import {
  foldBoons,
  migrateBloodline,
  readBudget,
  wrapCoreFeatures,
} from '../../../../scripts/content/migrate-bloodline.mjs';

const PAGE = `---
source: Ikuisuus
contentType: bloodlines
---

# Empyrean

They came from beyond the Black Cradle.

---

## Core Features

| **Ability Scores** | **Movement Speeds** |
| ------------------ | ------------------- |
| <ul><li>DEX +2</li></ul> | <ul><li>Walk: [= 6 stride =]</li></ul> |

### Blade and Brush

You gain proficiency with **one martial weapon**.

### Languages

You can speak **Common**.

---

## Boons

You have a budget of **10 Boon Points**.

<Collapsible>

###### Extended Reach <span>6 BP</span>

Your limbs are longer than most.

</Collapsible>

<Collapsible open>

###### First Step <span>5 BP</span>

You move first.

</Collapsible>
`;

describe('readBudget', () => {
  it('reads the stated budget and where it is stated', () => {
    const lines = PAGE.split('\n');
    expect(readBudget(lines)).toEqual({ points: '10', at: lines.indexOf('You have a budget of **10 Boon Points**.') });
    expect(readBudget(['nothing here'])).toBeNull();
  });
});

describe('wrapCoreFeatures', () => {
  it('wraps each core feature and leaves the section rule outside the last one', () => {
    const notes: string[] = [];
    const out = wrapCoreFeatures(PAGE.split('\n'), notes).join('\n');
    expect(notes).toContain('core features wrapped: 2');
    expect(out).toContain('<Feature>\n\n### Blade and Brush');
    expect(out).toContain('You can speak **Common**.\n\n</Feature>\n\n---\n\n## Boons');
  });

  it('leaves a page with no core features alone', () => {
    const notes: string[] = [];
    expect(wrapCoreFeatures(['# Title', '', 'Prose.'], notes)).toEqual(['# Title', '', 'Prose.']);
    expect(notes).toContain('no Core Features section');
  });
});

describe('foldBoons', () => {
  it('turns each collapsible into a collapsible feature, keeping the open flag', () => {
    const notes: string[] = [];
    const out = foldBoons(['<Collapsible>', '</Collapsible>', '<Collapsible open>', '</Collapsible>'], notes);
    expect(out).toEqual(['<Feature collapsible>', '</Feature>', '<Feature collapsible open>', '</Feature>']);
    expect(notes).toContain('boons folded into features: 2');
  });
});

describe('migrateBloodline', () => {
  it('wraps the page from Core Features on, and moves the budget onto the tag', () => {
    const { text, changed } = migrateBloodline(PAGE);
    expect(changed).toBe(true);
    expect(text).toContain('<Bloodline boonPoints="10">');
    expect(text.trimEnd().endsWith('</Bloodline>')).toBe(true);
    expect(text).not.toContain('You have a budget of');
    expect(text).not.toMatch(/<\/?Collapsible/);
    // the lede stays outside the wrapper, the tables stay exactly as written
    expect(text).toMatch(/They came from beyond the Black Cradle\.[\s\S]*<Bloodline/);
    expect(text).toContain('| <ul><li>DEX +2</li></ul> | <ul><li>Walk: [= 6 stride =]</li></ul> |');
  });

  it('is idempotent, and folds a shared boon list without wrapping it', () => {
    const once = migrateBloodline(PAGE).text;
    expect(migrateBloodline(once).changed).toBe(false);

    const shared = '---\nsource: Ikuisuus\n---\n\n# Selenic Boons\n\n<Collapsible>\n\n###### Moonlit <span>3 BP</span>\n\nProse.\n\n</Collapsible>\n';
    const result = migrateBloodline(shared);
    expect(result.changed).toBe(true);
    expect(result.text).toContain('<Feature collapsible>');
    expect(result.text).not.toContain('<Bloodline');
  });

  it('skips a page with neither core features nor boons', () => {
    const result = migrateBloodline('---\nsource: Ikuisuus\n---\n\n# Nothing\n\nProse.\n');
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe('no Core Features section and no boons');
  });
});
