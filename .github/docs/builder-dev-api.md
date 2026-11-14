# Builder Dev API

Dev-only API, browser hooks, and Playwright fixture for the character builder. Agents use it to build, inspect, and check characters.

The builder is a tool, not a GM. Flags are advisory and never block a build. A flag repeats a red flair the UI already shows. No rule exists here that the UI does not already show.

## Enable

| Env var                        | Turns on                    | Read by                         |
| ------------------------------ | --------------------------- | ------------------------------- |
| `IK_DEV_BUILDER=1`             | `/api/dev/builder/*` routes | `isDevBuilderApiEnabled()` (`src/lib/debug/devBuilderGate.ts`) |
| `NEXT_PUBLIC_IK_DEV_BUILDER=1` | `window.ik.builder` bridge  | Inline check in `presentation/CharacterSheet/characterSheet.tsx` |

Both gates are false when `NODE_ENV=production`. A production build gives 404 on every route, even with the vars set. The bridge check is inline, so the production bundle drops the bridge import. `compiler.reactRemoveProperties` strips `data-testid` and `data-screenshot-action` from production bundles.

## HTTP API

All routes take and return JSON. Every endpoint except the index is `POST`. The API is stateless: send the character in the body, get the new character back. Errors are `{ error }` with status 400 (bad input), 404 (gate off), or 500.

| Endpoint                          | Body                                                       | Returns                                                              |
| --------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/dev/builder`            | —                                                          | `{ endpoints, slots, flagCodes }`                                    |
| `POST /api/dev/builder/create`    | `{ payload, locale?, threshold?, carry? }`                 | `{ character, state, flags, resolution, notes }`                     |
| `POST /api/dev/builder/state`     | `{ character, carry? }`                                    | `{ character, state, flags }`                                        |
| `POST /api/dev/builder/patch`     | `{ character, patch?, payload?, locale?, threshold?, carry? }` | `{ character, state, flags, resolution, notes, diff }`           |
| `POST /api/dev/builder/options`   | `{ slot, character?, vocationIndex?, locale? }`            | `{ slot, options: [{ slug, title, info }] }`                         |

### Payload

`BuilderPayload` (`src/modules/character-builder/application/builderCore/types.ts`). Every name is fuzzy-resolved.

```json
{
  "name": "Ari",
  "experience": 900,
  "bloodline": "bilupine",
  "vocations": [{ "vocation": "wizard", "level": 3, "specialization": "evoker" }],
  "boons": ["Monument Builder", { "name": "Cognitive Matrix", "subOptions": ["Monady"] }],
  "feats": ["tough", "tough"],
  "abilityScores": { "str": 8, "wis": 16 },
  "skills": { "arcana": "proficient" },
  "trades": { "thieves tools": "proficient" },
  "savingThrows": { "wis": "proficient" },
  "heirlooms": ["dreamcatcher"],
  "trinkets": [],
  "spells": ["fireball"],
  "equipment": [{ "name": "Rope", "quantity": 1, "weightLb": 10 }],
  "carrying": { "size": "small" }
}
```

Build order is the same as the UI: scalars, bloodline, vocations (with specialization), XP, boons, feats, skill and trade tiers, imports. Then the sheet's sync effects run once (vocation base data, hit dice, max HP).

- Repeating a repeatable feat adds an instance. A non-repeatable repeat is skipped and noted.
- A boon with sub-options needs `subOptions`. Without them it is skipped and noted.
- Spells resolve inside the spell lists of the character's vocations, as the UI import does. They resolve against the whole library when there are no vocations.
- `notes` lists skipped inputs. Notes are input problems, never rules checks.

### Resolution

One `Resolution` per resolved name, in payload order.

```json
{ "field": "vocations[0].vocation", "query": "wizrd",
  "match": { "slug": "wizard", "title": "Wizard", "similarity": 0.833 },
  "alternates": [{ "slug": "witch", "title": "Witch", "similarity": 0.6 }],
  "ambiguous": false }
```

- The top score always wins, so a build never stops on ambiguity.
- `ambiguous` is true when the match scores below 1 and the runner-up is within `threshold` (default `0.05`).
- Scores below `0.3` never match. `match: null` adds a note.
- Scoring is the same as `/api/browse/search`: Levenshtein similarity on slug and title, with a 0.9 floor for substring hits (`scoreFuzzy`).

### Patch

`patch` is a raw merge into the character, run through the sheet reducer (level, tier, and XP recompute). `payload` adds on top of the character. You can send both: `patch` runs first. `diff` holds:

- `diff.character`, `diff.state` — `[{ path, before, after }]`, one per changed leaf.
- `diff.flags` — `{ added, removed, changed }`, keyed by flag code.

### Slots

| Slot             | Context used                        | `info`                                                          |
| ---------------- | ----------------------------------- | --------------------------------------------------------------- |
| `bloodline`      | —                                   | `boonBudget`                                                    |
| `vocation`       | —                                   | `hitDie`                                                        |
| `specialization` | `vocations[vocationIndex].slug`     | `vocation`                                                      |
| `boons`          | `bloodlineSlug`, selected boons     | `bpValue`, `bpLabel`, `subOptionMode`, `subOptions`, `selected`, `affordable` |
| `feats`          | selected feats                      | `repeatable`, `hasPrerequisite`, `prerequisite`, `selectedCount` |
| `skills`, `trades` | tiers, grant floors              | `tier`, `floor`, `hinted`, `eligibleGrants`                     |
| `heirlooms`, `trinkets` | —                            | —                                                               |
| `spells`         | vocation titles as list sources     | `level`                                                         |
| `features`       | vocation levels                     | `category`, `level`, `vocationIndex`, `unlocked`                |

`affordable`, `hasPrerequisite`, and `unlocked` are information only. Nothing filters on them.

### Carry inputs

Creature size, quadruped, and extra carried pounds are stored on the character as `carrying: { size?, quadruped?, extraLb? }`. The carry widget writes them, in or out of edit mode. A missing key means a medium biped with 0 extra pounds.

- Set them in a build with `payload.carrying`, or in a patch with `patch.carrying`.
- The request field `carry` (and `getState(carry)` / `getFlags(carry)` on the bridge) is a what-if override for one call. It wins key by key and is never stored.

## Flags

`BuilderFlag`: `{ code, severity: 'warning', messageKey, params, message, source: { kind, features: [{ id, label }] } }`. `message` is the English UI text. `messageKey` is the `characterSheet` i18n key, or null when the UI text is hardcoded.

| Code                           | Condition                                         | UI surface                         | Source kind |
| ------------------------------ | ------------------------------------------------- | ---------------------------------- | ----------- |
| `BP_OVER_BUDGET`               | `boonBudget − BP spent < 0`                       | Boon picker (Bloodline tab); header BP counter turns red (`data-over`) | `boons`     |
| `UNASSIGNED_LEVELS`            | character level above summed vocation levels      | Header badge                       | `vocations` |
| `UNASSIGNED_SKILL_PROFICIENCY` | open `skill:proficient` grant picks               | Overview chips                     | `grants`    |
| `UNASSIGNED_SKILL_EXPERTISE`   | open `skill:expertise` grant picks                | Overview chips                     | `grants`    |
| `UNASSIGNED_TRADE`             | open `trade:proficient` grant picks               | Overview chips                     | `grants`    |
| `UNASSIGNED_FEAT`              | open feat or ASI slots                            | Feats tab chips                    | `grants`    |
| `CARRY_HEAVY_LOAD`             | carried weight in the heavy tier                  | Carry widget (Equipment tab)       | `equipment` |
| `CARRY_OVER_CAPACITY`          | carried weight above the heavy limit              | Carry widget (Equipment tab)       | `equipment` |

Unassigned groups the UI does not show (trade expertise, saves, armour, weapons, familiarity, savanthood) appear in `state.grants.unassigned` and are not flags.

One source feeds every surface: `builderFlags.ts` and `builderMetrics.ts` in `src/modules/character-builder/application/builderCore/`. UI flairs import the same metrics.

## State

`BuilderState` (`builderState.ts`):

| Key          | Content                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `level`      | XP and level block (`getCharacterDerived`)                                 |
| `boonPoints` | `{ budget, spent, remaining, over }`                                       |
| `grants`     | `granted`, `floors`, `assignable` (with `assigned`), `unassigned`, `hints` |
| `features`   | Vocation and specialization features with `unlocked`                       |
| `hitPoints`  | `{ base, effective }`                                                      |
| `carry`      | `{ carriedLb, thresholds, tier }`                                          |

## Browser hooks: `window.ik.builder`

Registered while a character sheet is mounted and `NEXT_PUBLIC_IK_DEV_BUILDER=1`. The hooks act on live UI state.

| Member                       | Does                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| `getCharacter()`             | Displayed character (the draft while editing)                            |
| `getState(carry?)`           | Computed state                                                           |
| `getFlags(carry?)`           | Flags                                                                    |
| `patch(partial)`             | Merges through the sheet mutators, waits for commit and settle, returns snapshot and `diff` |
| `load(character)`            | Upserts and activates a character, waits for settle                      |
| `create(payload, options?)`  | `POST create`, then `load`. Returns snapshot plus `resolution`, `notes`  |
| `options(slot, vocationIndex?)` | `POST options` for the displayed character                            |
| `edit()` `save()` `cancel()` | Edit-mode controls                                                       |
| `isSettled()`                | True when no builder task is pending and state has been quiet for 120 ms |
| `whenSettled(timeoutMs?)`    | Resolves when settled. Rejects after the timeout (default 10 s)          |

Settle tracks shard fetches (vocation, specialization, and boon picks) and the 300 ms XP debounce. For a no-JS check, the hidden `[data-testid="builder-settled"]` carries `data-settled="true|false"`.

## Test ids

| Test id                                         | Element                                  |
| ----------------------------------------------- | ---------------------------------------- |
| `builder-sheet`                                 | Sheet root                               |
| `builder-settled`                               | Hidden settle marker                     |
| `builder-edit` / `builder-save` / `builder-cancel` | Header buttons                        |
| `builder-experience`                            | XP input wrapper (edit mode)             |
| `builder-bp-counter` / `builder-bp-meter`       | Header BP counter / boon picker meter    |
| `builder-bloodline`                             | Bloodline select wrapper                 |
| `builder-vocation-add`                          | Add-vocation wrapper                     |
| `builder-vocation-{i}`                          | Vocation select wrapper                  |
| `builder-vocation-{i}-level`                    | Vocation level input wrapper             |
| `builder-vocation-{i}-remove`                   | Remove-vocation wrapper                  |
| `builder-specialization-{i}`                    | Specialization select wrapper            |
| `builder-tabs`                                  | Tab strip wrapper                        |
| `builder-boon-{anchor}` (`-toggle`)             | Boon card (toggle button)                |
| `builder-boon-{anchor}-option-{anchor}`         | Boon sub-option pip                      |
| `builder-feat-{slug}` (`-toggle`, `-remove`)    | Feat card (toggle, remove instance)      |
| `builder-skills-{camel}-{tier}`                 | Skill tier pip                           |
| `builder-tools-{camel}-{tier}`                  | Trade tier pip                           |
| `builder-save-{ability}-{tier}`                 | Saving-throw tier pip                    |
| `builder-ability-{ability}`                     | Ability score input wrapper              |
| `builder-equipment-add` / `builder-equipment-{i}` | Add-item wrapper / item row            |
| `builder-flag`                                  | Any warning flair; `data-flag-code` holds space-separated codes |
| `builder-carry-tier`                            | Carry tier label with no flag            |
| `builder-carry-size` / `builder-carry-quadruped` / `builder-carry-extra` | Carry input wrappers |

`{anchor}` is `anchorOf(name)` from `lib/utils/shardKey.ts`. Shared UI atoms do not forward `data-*`, so selects, inputs, and icon buttons carry the ids on a wrapper.

## Checkpoint names (`data-screenshot-action`)

`begin-edit`, `save-edit`, `cancel-edit`, `set-experience`, `select-bloodline`, `add-vocation`, `select-vocation`, `set-vocation-level`, `remove-vocation`, `select-specialization`, `switch-tab`, `toggle-boon`, `select-boon-sub-option`, `toggle-feat`, `remove-instance`, `set-skill-tier`, `set-trade-tier`, `set-save-tier`, `set-ability-score`, `add-equipment`, `set-equipment-name`, `set-equipment-quantity`, `set-equipment-weight`, `set-carry-size`, `toggle-carry-quadruped`, `set-carry-extra`.

The name sits on the control or on its nearest wrapper. The fixture reads it with `closest('[data-screenshot-action]')`. A boon with sub-options has no `toggle-boon`; its pips carry `select-boon-sub-option`. The ability import panel has no checkpoints.

## Playwright

- Config: `playwright.config.ts`, project `builder` (chromium, 1440×900, 180 s timeout). `webServer.env` sets both flags. A reused server without the flags has no bridge, and the fixture fails with a clear message.
- Fixture: `tests/e2e/builder/builderFixture.ts`. `test` gives `builder: BuilderDriver`, which opens the builder page.

| Driver member                            | Does                                                        |
| ---------------------------------------- | ----------------------------------------------------------- |
| `act(locator, 'click' \| 'fill' \| 'select', value?)` | Runs `test.step(name)`, performs the action, settles, saves `NN-name.png` |
| `click(testId)` `fill(testId, v)` `select(testId, label)` `tab(label)` | `act` shortcuts            |
| `settle()`                               | Waits for `isSettled()`                                     |
| `character()` `state()` `flags()`        | Hook reads                                                  |
| `uiFlagCodes()`                          | Codes rendered by `builder-flag` elements                   |
| `options(slot, i?)` `create(payload)` `api(path, body)` | API access                                   |
| `checkpoint(name)`                       | Extra screenshot                                            |

- Specs: `builder-flags.spec.ts` (UI build, flag assertions), `builder-parity.spec.ts` (UI path versus API path, comparing character, state, and flags), `builder-fixtures.spec.ts` (fixture runner). The specs pick content through `options`, so content edits do not break them.
- Run: `npx playwright install chromium` once, then `npx playwright test --project=builder`.

## Character fixtures

`tests/fixtures/characters/<id>.character.json`. Files starting with `_` are templates and are skipped.

```json
{
  "id": "<id>",
  "descriptor": "free-text character description",
  "payload": null,
  "expected": {}
}
```

- `descriptor`: written by the owner.
- `payload`: written by an agent from the descriptor (`BuilderPayload`). `null` skips the fixture.
- `expected`: written by the owner. Agents leave it `{}`. Keys: `flags.include`, `flags.exclude`, `state` (partial, `toMatchObject`), `character` (partial), `notes` (exact).

The loader and validator are `tests/fixtures/characters/characterFixture.ts`.

## Code map

| Path                                                              | Role                                     |
| ----------------------------------------------------------------- | ---------------------------------------- |
| `src/modules/character-builder/application/builderCore/`          | Pure core: types, metrics, flags, state, mutations, diff, activity |
| `src/modules/character-builder/infrastructure/devApi/`            | Server: content source, resolver, builder, slot options, HTTP helpers |
| `src/app/api/dev/builder/**/route.ts`                             | Routes                                   |
| `src/modules/character-builder/presentation/dev/builderDevBridge.tsx` | `window.ik.builder`                  |
| `src/lib/debug/devBuilderGate.ts`                                 | Env gates                                |
