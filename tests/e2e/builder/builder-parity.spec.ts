/**
 * @fileoverview Parity spec: the UI path and the dev API path produce identical character, state, and flags.
 *
 * @module tests/e2e/builder/builder-parity.spec
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { anchorOf } from '@/modules/character-builder/lib/utils/shardKey';
import type { SlotOption } from '@/modules/character-builder/application/builderCore/types';
import { expect, normalizeForParity, test, type ApiSnapshot } from './builderFixture';

/** Vocation level the parity build uses. */
const LEVEL = 3;

test('UI path and API path produce identical state and flags', async ({ builder }) => {
  const character = await builder.character();
  const [vocation] = await builder.options('vocation');
  let bloodline: SlotOption | undefined;
  let boon: SlotOption | undefined;
  for (const candidate of await builder.options('bloodline')) {
    const body = await builder.api('options', {
      slot: 'boons',
      character: { ...character, bloodlineSlug: candidate.slug },
    });
    boon = (body.options as SlotOption[]).find(
      (b) => typeof b.info?.bpValue === 'number' && b.info?.subOptionMode === null,
    );
    if (boon) {
      bloodline = candidate;
      break;
    }
  }
  test.skip(!bloodline || !boon, 'No bloodline with a single-cost boon');
  if (!bloodline || !boon) return;

  await builder.select('builder-bloodline', bloodline.title);
  await builder.click('builder-vocation-add');
  await builder.select('builder-vocation-0', vocation.title);
  await builder.fill('builder-vocation-0-level', LEVEL);
  const [spec] = await builder.options('specialization', 0);
  if (spec) await builder.select('builder-specialization-0', spec.title);
  await builder.tab('Bloodline');
  await builder.click(`builder-boon-${anchorOf(boon.slug)}-toggle`);
  await builder.click('builder-save');

  const ui = {
    character: await builder.character(),
    state: await builder.state(),
    flags: await builder.flags(),
  };
  const api = (await builder.api('create', {
    payload: {
      bloodline: bloodline.slug,
      vocations: [{ vocation: vocation.slug, level: LEVEL, specialization: spec?.slug }],
      boons: [boon.slug],
    },
  })) as unknown as ApiSnapshot;

  expect(normalizeForParity(api.state)).toEqual(normalizeForParity(ui.state));
  expect(normalizeForParity(api.flags)).toEqual(normalizeForParity(ui.flags));
  expect(normalizeForParity(api.character)).toEqual(normalizeForParity(ui.character));
});
