# Phase Deeds System

**Purpose**: Document the Phase Deeds mechanic system for creature lifecycle tracking during combat.

## Overview

Phase Deeds are a special mechanic flag for creatures that have actions or abilities tied to specific HP thresholds. The system tracks three distinct phases:

- **Wounded** (75%-51% HP)
- **Bloodied** (50%-26% HP)
- **Doomed** (25%-0% HP)

## Phase Markers

### Display

Phase markers appear as colored badges in the HP input section:
- **Wounded**: Orange badge (#FFA500)
- **Bloodied**: Red badge (#FF6B6B)
- **Doomed**: Dark red badge (#8B0000)

### Implementation

**File**: `src/lib/components/encounterPlanner/playMode/playModeCombatantRow.tsx`

```typescript
// Calculate phase based on HP percentage
function getPhaseMarker(hpCurrent: number, hpMax: number): 'Wounded' | 'Bloodied' | 'Doomed' | null {
  const hpPercentage = (hpCurrent / hpMax) * 100;
  
  if (hpPercentage > 75) return null;
  if (hpPercentage > 50) return 'Wounded';
  if (hpPercentage > 25) return 'Bloodied';
  return 'Doomed';
}
```

**Location in UI**: Absolutely positioned within HP input row, right of temp HP input

## Phase Deeds Tracking

### Type Definition

**File**: `src/lib/types/inProgressCombat.ts`

```typescript
interface InProgressCombatant {
  // ... existing fields
  
  /** Phase Deeds tracking: tracks which phases have been used */
  phaseDeeds: {
    wounded: boolean;
    bloodied: boolean;
    doomed: boolean;
  };
}
```

### Mechanics Flag

```typescript
interface CombatantMechanics {
  // ... existing flags
  
  /** True if creature has mechanic:phase tag - enables phase marker and tracker */
  phase: boolean;
}
```

## Initialization

Phase deeds are initialized for all combatants:

**New Combatant** (`createInProgressCombatant`):
```javascript
phaseDeeds: {
  wounded: false,
  bloodied: false,
  doomed: false,
}
```

**Migrated Combatant** (`migrateCombatant`):
```javascript
if (!combatant.phaseDeeds) {
  combatant.phaseDeeds = {
    wounded: false,
    bloodied: false,
    doomed: false,
  };
}
```

## Future Integration

### Metadata Extraction

Future updates to metadata generators will extract phase deed information:

- `metadata:phase-wounded` - Creature has actions at 75% HP
- `metadata:phase-bloodied` - Creature has actions at 50% HP
- `metadata:phase-doomed` - Creature has actions at 25% HP

### Warning System

Similar to Lair Legendary Deeds, round-start warnings will notify DMs when:
- Creature enters a new phase
- Phase deeds are available for current phase
- Phase deed has not yet been used this combat

### UI Implementation

Phase deed tracker UI (similar to Legendary Deeds and Resist system):
- Display available phase deeds per phase
- Track usage per phase
- Reset tracking on combat end (not per turn)
- Integrate with deed consumption system

## Implementation Status

✅ **Completed**:
- Phase marker display (Wounded/Bloodied/Doomed badges)
- Color-coded visual indicators
- Type definitions (phaseDeeds, phase mechanic flag)
- Initialization in combatant creation and migration
- Full test coverage with all tests passing

🔄 **Pending**:
- Metadata tag extraction in monster generator
- Phase deed UI tracker component
- Warning notifications on phase entry
- Integration with deed consumption system

## Related Documentation

- [Encounter Module](./encounter-module.md) - Combat runner and mechanics system
- [Metadata Generation](./metadata-generation.md) - Metadata extraction architecture
- [Build Pipeline](./build-pipeline.md) - Pre-init and asset processing

