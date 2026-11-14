/**
 * @fileoverview Runs every character fixture with a payload through the hook and checks the owner's expected outcomes.
 *
 * @module tests/e2e/builder/builder-fixtures.spec
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { loadCharacterFixtures } from '../../fixtures/characters/characterFixture';
import { expect, test } from './builderFixture';

for (const fixture of loadCharacterFixtures()) {
  test(`fixture ${fixture.id}`, async ({ builder }) => {
    test.info().annotations.push({ type: 'descriptor', description: fixture.descriptor });
    test.skip(fixture.payload === null, 'Descriptor only; no payload derived yet');
    if (fixture.payload === null) return;

    const result = await builder.create(fixture.payload);
    await builder.checkpoint(`fixture-${fixture.id}`);
    const codes = result.flags.map((f) => f.code);
    const { flags, state, character, notes } = fixture.expected;

    for (const code of flags?.include ?? []) expect(codes).toContain(code);
    for (const code of flags?.exclude ?? []) expect(codes).not.toContain(code);
    if (state) expect(result.state).toMatchObject(state);
    if (character) expect(result.character).toMatchObject(character);
    if (notes) expect(result.notes).toEqual(notes);
    expect(await builder.flags()).toEqual(result.flags);
  });
}
