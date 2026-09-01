/**
 * @fileoverview Ability Grid Component
 * @description Responsive CSS Grid rendering `AbilityCard` components.
 * Shows empty state when no abilities exist.
 *
 * @module modules/character-builder/presentation/tabs/abilities/AbilityGrid
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CharacterAbility } from '@/lib/types/character';
import { useTranslations } from 'next-intl';
import { AbilityCard } from './AbilityCard';
import styles from './abilities.module.scss';

/**
 * Props for `<AbilityGrid>`.
 *
 * @interface AbilityGridProps
 * @property {CharacterAbility[]} abilities - List of abilities to render
 * @property {boolean} [editing] - Whether edit controls are shown on cards
 * @property {(id: string) => void} [onEdit] - Called when a card's edit button is clicked
 * @property {(id: string) => void} [onDelete] - Called when a card's delete button is clicked
 */
export interface AbilityGridProps {
  abilities: CharacterAbility[];
  editing?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * Responsive grid of ability cards. Empty state when no abilities.
 *
 * @component
 * @param {AbilityGridProps} props - Component props
 * @param {CharacterAbility[]} props.abilities - List of abilities to render
 * @param {boolean} [props.editing=false] - Whether edit controls are shown on cards
 * @param {(id: string) => void} [props.onEdit] - Called when a card's edit button is clicked
 * @param {(id: string) => void} [props.onDelete] - Called when a card's delete button is clicked
 * @returns {JSX.Element} Rendered grid
 */
export const AbilityGrid: React.FC<AbilityGridProps> = ({
  abilities,
  editing = false,
  onEdit,
  onDelete,
}) => {
  const t = useTranslations('characterSheet');

  if (abilities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>{t('abilityNoAbilities')}</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {abilities.map((ability) => (
        <AbilityCard
          key={ability.id}
          ability={ability}
          editing={editing}
          onEdit={onEdit ? () => onEdit(ability.id) : undefined}
          onDelete={onDelete ? () => onDelete(ability.id) : undefined}
        />
      ))}
    </div>
  );
};
