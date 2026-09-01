/**
 * @fileoverview Character Sheet Module Public API
 * @description Re-exports all public components from the characterSheet module.
 *
 * @module modules/character-builder/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

export { AbilityScoreBlock } from './presentation/stats/abilityScoreBlock';
export type { AbilityScoreBlockProps } from './presentation/stats/abilityScoreBlock';

export { AttacksTable } from './presentation/stats/attacksTable';
export type { AttacksTableProps } from './presentation/stats/attacksTable';

export { BoonPicker } from './presentation/builder/boonPicker';
export type { BoonPickerProps } from './presentation/builder/boonPicker';

export { ContentShardPanel } from './presentation/shards/contentShardPanel';
export type { ContentShardPanelProps } from './presentation/shards/contentShardPanel';
export type { ContentShardType } from '@/lib/types/api';

export { CharacterRoster } from './presentation/Roster/characterRoster';
export type { CharacterRosterProps } from './presentation/Roster/characterRoster';

export { SelectedCharacterBadge } from './presentation/SelectedCharacter/selectedCharacterBadge';

export {
    CharacterEntityProvider,
    useCharacterEntity,
    useCharacterEntityContext,
    useCharacterEntityField,
} from './application/context/characterEntityContext';
export type { CharacterEntityContextValue } from './application/context/characterEntityContext';

export {
    ActiveSheetProvider,
    useActiveSheet,
    useSheetData,
    useSheetEditing,
    useSheetField,
    useSheetMutators,
    useSheetTab,
} from './application/context/activeSheetContext';
export type {
    ActiveSheetProviderProps,
    SheetContextValue,
    SheetMutators,
    SheetTabId,
} from './application/context/activeSheetContext';

export type { CharacterEntity } from './domain/character/characterEntity';

export { ActiveCharacterSheet } from './presentation/CharacterSheet/activeCharacterSheet';

export { CharacterSheet } from './presentation/CharacterSheet/characterSheet';
export type { CharacterSheetProps } from './presentation/CharacterSheet/characterSheet';

export { VocationFeatureCard } from './presentation/builder/vocationFeatureCard';
export type { VocationFeatureCardProps } from './presentation/builder/vocationFeatureCard';

export { NotesSection } from './presentation/notes/notesSection';
export type {
    NoteFields,
    NotesSectionProps
} from './presentation/notes/notesSection';

export { ShardDisplay } from './presentation/shards/shardDisplay';
export type { ShardDisplayProps } from './presentation/shards/shardDisplay';

export { SkillsTable } from './presentation/stats/skillsTable';
export type { SkillsTableProps } from './presentation/stats/skillsTable';

export { VocationSelector } from './presentation/builder/vocationSelector';
export type { VocationSelectorProps } from './presentation/builder/vocationSelector';

