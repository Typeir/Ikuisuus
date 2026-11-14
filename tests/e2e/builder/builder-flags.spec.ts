/**
 * @fileoverview Builder flag specs: builds through the UI and asserts flags on the hook and the warning surfaces.
 *
 * @module tests/e2e/builder/builder-flags.spec
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { anchorOf } from '@/modules/character-builder/lib/utils/shardKey';
import type { SlotOption } from '@/modules/character-builder/application/builderCore/types';
import { expect, test } from './builderFixture';

/** Flag codes the overview tab renders. */
const OVERVIEW_CODES = new Set([
  'UNASSIGNED_LEVELS',
  'UNASSIGNED_SKILL_PROFICIENCY',
  'UNASSIGNED_SKILL_EXPERTISE',
  'UNASSIGNED_TRADE',
]);

test.describe('builder flags', () => {
  test('a new character shows the unassigned-level flag on UI and hook', async ({ builder }) => {
    expect(await builder.uiFlagCodes()).toContain('UNASSIGNED_LEVELS');
    expect((await builder.flags()).map((f) => f.code)).toContain('UNASSIGNED_LEVELS');
  });

  test('picking a vocation clears the level flag; overview surfaces match the hook', async ({
    builder,
  }) => {
    const [vocation] = await builder.options('vocation');
    await builder.click('builder-vocation-add');
    await builder.select('builder-vocation-0', vocation.title);

    const hookCodes = (await builder.flags()).map((f) => f.code);
    expect(hookCodes).not.toContain('UNASSIGNED_LEVELS');
    expect(await builder.uiFlagCodes()).toEqual(
      hookCodes.filter((code) => OVERVIEW_CODES.has(code)).sort(),
    );
  });

  test('over-budget boons are flagged and never blocked', async ({ builder }) => {
    const character = await builder.character();
    let pick: { bloodline: SlotOption; boons: SlotOption[] } | undefined;
    for (const bloodline of await builder.options('bloodline')) {
      const budget = Number(bloodline.info?.boonBudget ?? 0);
      const body = await builder.api('options', {
        slot: 'boons',
        character: { ...character, bloodlineSlug: bloodline.slug, boonBudget: budget },
      });
      const priced = (body.options as SlotOption[])
        .filter((b) => typeof b.info?.bpValue === 'number' && b.info?.subOptionMode === null)
        .sort((a, b) => Number(b.info?.bpValue) - Number(a.info?.bpValue));
      const total = priced.reduce((sum, b) => sum + Number(b.info?.bpValue), 0);
      if (total > budget) {
        pick = { bloodline, boons: priced };
        break;
      }
    }
    test.skip(!pick, 'No bloodline has priced boons that exceed its budget');
    if (!pick) return;

    await builder.select('builder-bloodline', pick.bloodline.title);
    await builder.tab('Bloodline');
    let clicked = 0;
    for (const boon of pick.boons) {
      await builder.click(`builder-boon-${anchorOf(boon.slug)}-toggle`);
      clicked += 1;
      if ((await builder.state()).boonPoints.over) break;
    }

    expect((await builder.character()).selectedBoons).toHaveLength(clicked);
    expect((await builder.flags()).map((f) => f.code)).toContain('BP_OVER_BUDGET');
    expect(await builder.uiFlagCodes()).toContain('BP_OVER_BUDGET');
  });
});
