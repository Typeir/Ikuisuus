/**
 * @fileoverview Import Ability Mapper
 * @description Maps imported metadata items (Spells, Heirlooms, Trinkets, Feats)
 * into {@link CharacterAbility} objects.
 *
 * @module modules/character-builder/presentation/tabs/abilities/importAbilityMapper
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import type { CharacterAbility } from '@/lib/types/character';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';
import type { ImportTab } from './abilityImportTypes';

/**
 * Maps a metadata item to a {@link CharacterAbility} based on the active import tab.
 *
 * @param {SpellMetadata | HeirloomMetadata | TrinketMetadata | FeatMetadata} item - Source metadata item
 * @param {ImportTab} tab - Active import tab
 * @returns {CharacterAbility} Mapped character ability
 */
export function mapImportToAbility(
  item: SpellMetadata | HeirloomMetadata | TrinketMetadata | FeatMetadata,
  tab: ImportTab,
): CharacterAbility {
  if (tab === 'spells') return mapSpell(item as SpellMetadata);
  if (tab === 'heirlooms') return mapHeirloom(item as HeirloomMetadata);
  if (tab === 'trinkets') return mapTrinket(item as TrinketMetadata);
  return mapFeat(item as FeatMetadata);
}

function mapSpell(s: SpellMetadata): CharacterAbility {
  const parts: string[] = [`> **${s.title}**`];
  const ls = [
    s.quality ? `${s.quality} ` : '',
    s.level !== undefined
      ? s.level === 0
        ? 'Cantrip'
        : `${s.level}${s.level === 1 ? 'st' : s.level === 2 ? 'nd' : s.level === 3 ? 'rd' : 'th'}-level Spell`
      : '',
  ]
    .join('')
    .trim();
  if (ls) parts.push(`> _${ls}_`);
  if (s.castingTimeRaw) parts.push(`> **Casting Time**: ${s.castingTimeRaw}`);
  if (s.range) parts.push(`> **Range**: ${s.range}`);
  if (s.components) {
    const c = [
      s.components.verbal ? 'V' : '',
      s.components.somatic ? 'S' : '',
      s.components.material
        ? `M${s.components.materialDescription ? ` (${s.components.materialDescription})` : ''}`
        : '',
    ]
      .filter(Boolean)
      .join(', ');
    if (c) parts.push(`> **Components**: ${c}`);
  }
  if (s.duration) parts.push(`> **Duration**: ${s.duration}`);
  return {
    id: generateId(),
    name: s.title,
    type: 'Spell',
    mechanics: parts.join('  \n'),
    description: s.description ?? '',
    source: s.slug,
    importedFrom: 'spells',
  };
}

function mapHeirloom(i: HeirloomMetadata): CharacterAbility {
  const p: string[] = [];
  if (i.rarity) p.push(`**Rarity**: ${i.rarity}`);
  if (i.itemType) p.push(`**Type**: ${i.itemType}`);
  if (i.requiresAttunement) p.push('**Requires Attunement**');
  if (i.weaponDamage)
    p.push(
      `**Damage**: ${i.weaponDamage}${i.weaponDamageType ? ` ${i.weaponDamageType}` : ''}`,
    );
  if (i.range) p.push(`**Range**: ${i.range}`);
  if (i.weight) p.push(`**Weight**: ${i.weight}`);
  return {
    id: generateId(),
    name: i.title,
    type: 'Heirloom',
    mechanics: p.length
      ? `> **${i.title}**  \n${p.map((x) => `> ${x}`).join('  \n')}`
      : '',
    description: i.description ?? '',
    source: i.slug,
    importedFrom: 'heirlooms',
  };
}

function mapTrinket(i: TrinketMetadata): CharacterAbility {
  const p: string[] = [];
  if (i.itemType) p.push(`**Type**: ${i.itemType}`);
  if (i.damage)
    p.push(`**Damage**: ${i.damage}${i.damageType ? ` ${i.damageType}` : ''}`);
  if (i.range) p.push(`**Range**: ${i.range}`);
  if (i.weight) p.push(`**Weight**: ${i.weight}`);
  return {
    id: generateId(),
    name: i.title,
    type: 'Trinket',
    mechanics: p.length
      ? `> **${i.title}**  \n${p.map((x) => `> ${x}`).join('  \n')}`
      : '',
    description: i.description ?? '',
    source: i.slug,
    importedFrom: 'trinkets',
  };
}

function mapFeat(f: FeatMetadata): CharacterAbility {
  return {
    id: generateId(),
    name: f.title,
    type: 'Feat',
    mechanics: f.prerequisite ? `**Prerequisite**: ${f.prerequisite}` : '',
    description: f.description ?? '',
    source: f.slug,
    importedFrom: 'feats',
  };
}
