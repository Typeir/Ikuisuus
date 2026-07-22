/**
 * @fileoverview Character Sheet Types — compatibility shim
 * @description The canonical character model now lives in the
 * character-builder module's domain layer as `CharacterEntity` (one flat
 * JSON structure, no self-referencing objects). This path re-exports it so
 * existing `@/lib/types/character` imports keep working.
 *
 * @see modules/character-builder/domain/character/characterEntity
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/lib/types/character
 */

export type {
  AbilityImportSource,
  AbilityKey,
  AbilityType,
  CharacterAbility,
  CharacterAttack,
  CharacterCoinHoldings,
  CharacterCurrency,
  CharacterEntity,
  CharacterShard,
  CharacterSheet,
  CharacterSkill,
  CharacterSpellSlot,
  CharacterTool,
  CoinDenomination,
  CompactCharacterRef,
  CurrencySystem,
  EquipmentItem,
  TierLevel,
  VocationEntry,
} from '@/modules/character-builder/domain/character/characterEntity';
