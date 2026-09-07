/**
 * @fileoverview Tests for the feat converter.
 * @description Prerequisite, origin and repeatable move into the tag; the
 * ability sentence moves into `ability` with its maximum clause dropped; a
 * stated absence of prerequisite goes, since the card shows none.
 *
 * @module tests/unit/scripts/content/migrate-feat.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import { migrateFeat } from '../../../../scripts/content/migrate-feat.mjs';

const FEAT = `---
source: Ikuisuus
contentType: feats
---

# Sharpshooter

_Prerequisite: **Archery** Fighting Style_

You can make shots that others find impossible.

---

Increase your Strength or Dexterity score by 1.

When you take this feat, you gain the following benefits:

- **Bypass Cover.** Your ranged weapon attacks ignore **half cover**.
`;

describe('migrateFeat', () => {
  it('moves prerequisite and ability into the tag and wraps the body', () => {
    const result = migrateFeat(FEAT);
    expect(result.notes).toEqual([]);
    expect(result.text).toBe(`---
source: Ikuisuus
contentType: feats
---

# Sharpshooter

<Feat
  prerequisite="**Archery** Fighting Style"
  ability="Strength or Dexterity">

You can make shots that others find impossible.

---

When you take this feat, you gain the following benefits:

- **Bypass Cover.** Your ranged weapon attacks ignore **half cover**.

</Feat>
`);
  });

  it('reads the misspelt label, an origin line and the repeatable frontmatter', () => {
    const text = FEAT.replace('contentType: feats', 'contentType: feats\nmultiSelect: true').replace(
      '_Prerequisite: **Archery** Fighting Style_',
      '_Prerrequisites: **Strength 13** or **Dexterity 13**, proficiency with a martial weapon._\n_Origin Feat_',
    );
    const result = migrateFeat(text);
    expect(result.text).not.toContain('multiSelect: true');
    expect(result.text).toContain('contentType: feats\n---');
    expect(result.text).toContain(
      '<Feat\n  category="origin"\n  prerequisite="**Strength 13** or **Dexterity 13**, proficiency with a martial weapon."\n  ability="Strength or Dexterity"\n  repeatable>',
    );
  });

  it('drops a stated absence of prerequisite and reads a bold ability line with a maximum clause', () => {
    const text = FEAT.replace('_Prerequisite: **Archery** Fighting Style_', '_No attribute prerequisite._').replace(
      'Increase your Strength or Dexterity score by 1.',
      'Increase your **Dexterity score by 1**, to a maximum of **20**.',
    );
    const result = migrateFeat(text);
    expect(result.text).toContain('<Feat ability="Dexterity">\n\nYou can make shots');
    expect(result.text).not.toContain('prerequisite');
    expect(result.text).not.toContain('maximum');
    expect(result.notes).toEqual([]);
  });

  it.each([
    ['Increase your Constitution, Strength, or Dexterity score by 1.', 'Constitution, Strength, or Dexterity'],
    ['Increase your **Intelligence** or **Wisdom** score by 1, up to a maximum of 30.', 'Intelligence or Wisdom'],
    ['Increase your Constitution by 1.', 'Constitution'],
    ['Increase your **Strength or Constitution score by 1**, to a maximum of **20**.', 'Strength or Constitution'],
  ])('reads "%s"', (line, ability) => {
    const result = migrateFeat(FEAT.replace('Increase your Strength or Dexterity score by 1.', line));
    expect(result.text).toContain(`ability="${ability}"`);
    expect(result.notes).toEqual([]);
  });

  it('keeps an ability line it cannot name as prose', () => {
    const result = migrateFeat(
      FEAT.replace('Increase your Strength or Dexterity score by 1.', 'Increase your **Any ability score** by 1, up to a maximum of **20**.'),
    );
    expect(result.text).not.toContain('ability=');
    expect(result.notes).toEqual([
      'ability line kept as prose: Increase your **Any ability score** by 1, up to a maximum of **20**.',
    ]);
  });

  it('wraps fourth-level headings in Feature blocks with their parentheticals lifted', () => {
    const result = migrateFeat(FEAT + '\n#### The Long Table (1/Repose)\n\nYou cook.\n\n#### Treats\n\nYou bake.\n');
    expect(result.text).toContain('<Feature charges="1/Repose">\n\n#### The Long Table\n\nYou cook.\n\n</Feature>\n\n<Feature>\n\n#### Treats\n\nYou bake.\n\n</Feature>\n\n</Feat>');
  });

  it('fills the category from an Epic Boon title and shortens the title', () => {
    const result = migrateFeat(FEAT.replace('# Sharpshooter', '# Epic Boon: Perfect Aim  '));
    expect(result.text).toContain('# Perfect Aim\n\n<Feat\n  category="epic boon"\n');
    expect(result.text).not.toContain('Epic Boon:');
    expect(result.notes).toEqual([]);
  });

  it('skips a converted feat', () => {
    const result = migrateFeat(FEAT.replace('_Prerequisite: **Archery** Fighting Style_', '<Feat category="general">'));
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe('already on the slot form');
  });
});
