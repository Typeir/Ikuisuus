/**
 * @fileoverview Tests for the feat converter.
 * @description Prerequisite, origin and repeatable move into the tag; the
 * plain ability sentence moves into `ability`; every other wording stays.
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
    expect(result.text).toContain('multiSelect: true');
    expect(result.text).toContain(
      '<Feat\n  category="origin"\n  prerequisite="**Strength 13** or **Dexterity 13**, proficiency with a martial weapon."\n  ability="Strength or Dexterity"\n  repeatable>',
    );
  });

  it('keeps a stated absence of prerequisite and a bold ability line as prose', () => {
    const text = FEAT.replace('_Prerequisite: **Archery** Fighting Style_', '_No prerequisite._').replace(
      'Increase your Strength or Dexterity score by 1.',
      'Increase your **Dexterity score by 1**, to a maximum of **20**.',
    );
    const result = migrateFeat(text);
    expect(result.text).toContain('<Feat>\n\n_No prerequisite._\n');
    expect(result.text).toContain('\nIncrease your **Dexterity score by 1**, to a maximum of **20**.\n');
    expect(result.notes).toEqual([
      'kept as prose: _No prerequisite._',
      'ability line kept as prose: Increase your **Dexterity score by 1**, to a maximum of **20**.',
    ]);
  });

  it('accepts a list of abilities', () => {
    const result = migrateFeat(
      FEAT.replace('Increase your Strength or Dexterity score by 1.', 'Increase your Constitution, Strength, or Dexterity score by 1.'),
    );
    expect(result.text).toContain('ability="Constitution, Strength, or Dexterity"');
  });

  it('wraps fourth-level headings in Feature blocks with their parentheticals lifted', () => {
    const result = migrateFeat(FEAT + '\n#### The Long Table (1/Repose)\n\nYou cook.\n\n#### Treats\n\nYou bake.\n');
    expect(result.text).toContain('<Feature charges="1/Repose">\n\n#### The Long Table\n\nYou cook.\n\n</Feature>\n\n<Feature>\n\n#### Treats\n\nYou bake.\n\n</Feature>\n\n</Feat>');
  });

  it('notes an Epic Boon title with no category', () => {
    const result = migrateFeat(FEAT.replace('# Sharpshooter', '# Epic Boon: Perfect Aim'));
    expect(result.text).not.toContain('category=');
    expect(result.notes).toContain('title says Epic Boon; no category written');
  });

  it('skips a converted feat', () => {
    const result = migrateFeat(FEAT.replace('_Prerequisite: **Archery** Fighting Style_', '<Feat category="general">'));
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe('already on the slot form');
  });
});
