---
applyTo: 'src/lib/components/encounterPlanner/**'
---

# Encounter Module Architecture Analysis

Before modifying the encounter planner or Play Mode, you MUST:

1. **Read** `.github/docs/encounter-module.md` for the full architecture (mechanics flags, Play Mode turn tracker, round-start notifications, Heroic Awakening).
2. **Read** `.github/docs/phase-deeds.md` for HP-threshold phase mechanics (Wounded, Bloodied, Doomed).
3. **Mechanics flags** (`lair`, `stratagem`, `legendaryDeed`, `resist`) are parsed from monster metadata tags — never hard-code flag values.
4. **Round-start logic** resets legendary deeds and fires lair notifications — changes here affect all combatants.
5. **Notifications** use `NotificationProvider` context, never `alert()`. Wrap tests accordingly.
6. **Storage** uses `encounterStorage.ts` (CRUD) and `inProgressCombatStorage.ts` (Play Mode state) — both in `src/lib/utils/`.

## Key Types

- `CombatantMechanics` in `src/lib/types/inProgressCombat.ts` — mechanics flag interface
- Encounter/creature types in `src/lib/types/encounterPlanner.ts`

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which subsystem is affected (encounter planner, Play Mode, comboboxes, list editors)
- Mechanics flag changes and their notification impact
- Storage format changes (localStorage schema)
- Test coverage for round-start and notification behavior

## Hard Rule Verification

After implementation, `npm test` must produce zero act() warnings. Notification tests require fake timers and `NotificationProvider` wrapping.
