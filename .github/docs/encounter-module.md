# Encounter Module Architecture

> **Purpose**: Document the Encounter Planner and Play Mode systems, including mechanics flags, trackers, and notification patterns.

## Module Location

```
src/lib/components/encounterPlanner/
├── encounterPlanner.tsx           # Main encounter management UI
├── encounterPlanner.module.scss
├── creatureRow.tsx                # Individual creature row
├── creatureRow.module.scss
├── combatantDetailsColumns.tsx    # Details column components
├── comboboxes/                    # Creature/spell selection
│   └── creatureCombobox.tsx
├── listEditors/                   # Buff, item, spell, affix editors
│   ├── buffListEditor.tsx
│   ├── itemListEditor.tsx
│   ├── spellListEditor.tsx
│   └── affixListEditor.tsx
├── playMode/                      # Combat runner (Play Mode)
│   ├── playMode.tsx               # Turn tracker
│   ├── playMode.module.scss
│   ├── playModeCombatantRow.tsx   # Combatant row in Play Mode
│   └── playModeCombatantRow.module.scss
└── index.ts
```

## Type Definitions

```
src/lib/types/
├── encounterPlanner.ts    # Base encounter/creature types
└── inProgressCombat.ts    # Play Mode runtime types
```

## Storage Utilities

```
src/lib/utils/
├── encounterStorage.ts           # Encounter CRUD operations
└── inProgressCombatStorage.ts    # Play Mode state management
```

---

## Mechanics Flags System

Monster metadata tags are parsed into mechanic flags for DM quality-of-life features.

### CombatantMechanics Interface

**File**: `src/lib/types/inProgressCombat.ts`

```typescript
interface CombatantMechanics {
  /** True if creature has mechanic:lair tag - triggers alert on round start */
  lair: boolean;
  /** True if creature has mechanic:stratagem tag - shows tactical badge */
  stratagem: boolean;
  /** True if creature has mechanic:legendary-deed tag - enables deed tracker */
  legendaryDeed: boolean;
  /** True if creature has Legendary Deed: Resist ability - enables resist tracker */
  resist: boolean;
}
```

### Tag-to-Flag Mapping

| Monster Metadata Tag      | Mechanic Flag         | Feature                          |
| ------------------------- | --------------------- | -------------------------------- |
| `mechanic:lair`           | `lair: true`          | Round-start warning notification |
| `mechanic:stratagem`      | `stratagem: true`     | Purple tactical badge in UI      |
| `mechanic:legendary-deed` | `legendaryDeed: true` | Deed usage tracker               |
| `mechanic:resist`         | `resist: true`        | Legendary Resist counter         |

### Flag Detection

When importing a monster from the library, tags are parsed:

```typescript
// From monster metadata
{
  "tags": [
    "mechanic:lair",
    "mechanic:legendary-deed",
    "mechanic:multiattack"
  ]
}

// Resulting mechanics object
mechanics: {
  lair: true,
  stratagem: false,
  legendaryDeed: true,
  resist: false
}
```

---

## Play Mode Turn Tracker

### Round Start Behavior

**File**: `src/lib/components/encounterPlanner/playMode/playMode.tsx`

When a new round begins:

1. **Round counter increments**
2. **Legendary deeds reset** for all combatants
3. **Lair Legendary Deed reminder** triggers if any non-slain combatant has `lair: true`

```typescript
const isNewRound =
  nextIndex <= prev.activeTurnIndex && prev.turnOrder.length > 0;
if (isNewRound) {
  roundNumber++;

  // Reset legendary deeds
  combatants = combatants.map((c) => ({
    ...c,
    legendaryDeedsUsed: c.legendaryDeedsUsed.map(() => false),
  }));

  // Check for lair creatures
  if (combatants.some((c) => !c.slain && c.mechanics?.lair)) {
    notifications.warning(t('lairAlert'), {
      title: t('lairAlertTitle'),
      duration: 8000,
    });
  }
}
```

### Notification Pattern

**Provider**: Notifications use `useNotifications()` hook from `@/lib/components/ui`.

```typescript
import { useNotifications } from '@/lib/components/ui';

const notifications = useNotifications();

// Warning with title (lair reminder)
notifications.warning(t('lairAlert'), {
  title: t('lairAlertTitle'),
  duration: 8000,
});

// Success (save confirmation)
notifications.success(t('encounterSaved'));

// Error (operation failed)
notifications.error(t('importFailed'), {
  duration: 10000,
});
```

---

## Combatant Trackers

### Legendary Deed Tracker

Tracks usage of legendary deeds per round.

```typescript
interface InProgressCombatant {
  // ...
  legendaryDeedsUsed: boolean[]; // Array of deed slots (e.g., [false, false, false])
}
```

- **Reset**: All deeds reset to `false` at round start
- **Usage**: Click to toggle deed usage
- **Display**: Only shown if `mechanics.legendaryDeed === true`

### Legendary Resist Counter

Tracks remaining uses of Legendary Resistance.

```typescript
interface InProgressCombatant {
  // ...
  resistRemaining: number; // Typically starts at 3
}
```

- **Decrement**: Click to use a resist
- **Display**: Only shown if `mechanics.resist === true`
- **No Reset**: Resists do not regenerate each round

---

## Heroic Awakening System

Tracks creature awakening state and tier bonuses.

```typescript
interface HeroicAwakeningState {
  fateDieResult: number; // D20 roll result
  heroicDc: number; // Target DC
  awakened: boolean; // Whether triggered
  tier: 'none' | 'awakened' | 'legendary' | 'mythic';
  affixes: AffixEntry[]; // Applied heroic affixes
  bonuses: {
    proficiencyBonus: number;
    acBonus: number;
    savingThrowBonus: number;
  };
  hpOverride: number | null; // Scaled HP if awakened
}
```

---

## Translation Keys

Encounter planner translations are in `messages/{locale}/encounterPlanner.json`:

```json
{
  "lairAlert": "A creature with a Lair Legendary Deed is in combat!",
  "lairAlertTitle": "Lair Legendary Deed Reminder",
  "encounterSaved": "Encounter saved",
  "importFailed": "Failed to import encounter"
}
```

---

## Testing Play Mode

### Mock Setup

```typescript
import { NotificationProvider } from '@/lib/components/ui';

describe('PlayMode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show lair reminder on round start', async () => {
    const combat = createMockCombat({
      combatants: [
        createMockCombatant({ mechanics: { lair: true } }),
      ],
    });

    render(
      <NotificationProvider>
        <PlayMode combat={combat} onExit={vi.fn()} locale="en" />
      </NotificationProvider>
    );

    // Advance to next round
    await userEvent.click(screen.getByText('End Turn'));

    // Verify notification
    expect(screen.getByText('Lair Legendary Deed Reminder')).toBeInTheDocument();
  });
});
```

### Mechanic Flag Tests

```typescript
it('should display stratagem badge when flag is set', () => {
  const combatant = createMockCombatant({
    mechanics: { stratagem: true },
  });

  render(<PlayModeCombatantRow combatant={combatant} />);

  expect(screen.getByTestId('stratagem-badge')).toBeInTheDocument();
});
```

---

## Adding New Mechanics

1. **Add to metadata generator** (`scripts/metadata/generateMonsterMetadata.ts`):

   ```javascript
   // Add tag detection
   if (tags.includes('mechanic:new-mechanic')) {
     mechanics.newMechanic = true;
   }
   ```

2. **Update type definitions** (`src/lib/types/inProgressCombat.ts`):

   ```typescript
   interface CombatantMechanics {
     // ...existing
     newMechanic: boolean;
   }
   ```

3. **Add UI behavior** in Play Mode components

4. **Add translation keys** if user-facing text needed

5. **Write tests** following patterns in `tests/unit/src/lib/components/encounterPlanner/playMode/`

---

## Related Documentation

- [Testing Rules](./testing-rules.md) - Test patterns for notifications
- [Metadata Generation](./metadata-generation.md) - How monster tags are extracted
- [Build Pipeline](./build-pipeline.md) - Pre-init requirements
