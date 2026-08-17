/**
 * @fileoverview Ability Import Helpers
 * @description Pure functions to build CharacterAbility from metadata
 * and fetch raw MDX source for imported content.
 *
 * @module modules/character-builder/presentation/tabs/abilities/importHelpers
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import type { HeirloomMetadata } from '@/lib/db/content/schemas/heirloomMetadata';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import type { TrinketMetadata } from '@/lib/db/content/schemas/trinketMetadata';
import type { CharacterAbility } from '@/lib/types/character';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';

export function spellToAbility(spell: SpellMetadata): CharacterAbility {
  const parts: string[] = [];
  parts.push(`> **${spell.title}**`);
  const ls = [
    spell.quality ? `${spell.quality} ` : '',
    spell.level !== undefined
      ? spell.level === 0
        ? 'Cantrip'
        : `${spell.level}${spell.level === 1 ? 'st' : spell.level === 2 ? 'nd' : spell.level === 3 ? 'rd' : 'th'}-level Spell`
      : '',
  ]
    .join('')
    .trim();
  if (ls) parts.push(`> _${ls}_`);
  if (spell.castingTimeRaw)
    parts.push(`> **Casting Time**: ${spell.castingTimeRaw}`);
  if (spell.range) parts.push(`> **Range**: ${spell.range}`);
  if (spell.components) {
    const c = [
      spell.components.verbal ? 'V' : '',
      spell.components.somatic ? 'S' : '',
      spell.components.material
        ? `M${spell.components.materialDescription ? ` (${spell.components.materialDescription})` : ''}`
        : '',
    ]
      .filter(Boolean)
      .join(', ');
    if (c) parts.push(`> **Components**: ${c}`);
  }
  if (spell.duration) parts.push(`> **Duration**: ${spell.duration}`);
  return {
    id: generateId(),
    name: spell.title,
    type: 'Spell',
    mechanics: parts.join('  \n'),
    description: spell.description ?? '',
    source: spell.slug,
    importedFrom: 'spells',
  };
}

export function heirloomToAbility(item: HeirloomMetadata): CharacterAbility {
  const p: string[] = [];
  if (item.rarity) p.push(`**Rarity**: ${item.rarity}`);
  if (item.itemType) p.push(`**Type**: ${item.itemType}`);
  if (item.requiresAttunement) p.push('**Requires Attunement**');
  if (item.weaponDamage)
    p.push(
      `**Damage**: ${item.weaponDamage}${item.weaponDamageType ? ` ${item.weaponDamageType}` : ''}`,
    );
  if (item.range) p.push(`**Range**: ${item.range}`);
  if (item.weight) p.push(`**Weight**: ${item.weight}`);
  return {
    id: generateId(),
    name: item.title,
    type: 'Heirloom',
    mechanics: p.length
      ? `> **${item.title}**  \n${p.map((x) => `> ${x}`).join('  \n')}`
      : '',
    description: item.description ?? '',
    source: item.slug,
    importedFrom: 'heirlooms',
  };
}

export function trinketToAbility(item: TrinketMetadata): CharacterAbility {
  const p: string[] = [];
  if (item.itemType) p.push(`**Type**: ${item.itemType}`);
  if (item.damage)
    p.push(
      `**Damage**: ${item.damage}${item.damageType ? ` ${item.damageType}` : ''}`,
    );
  if (item.range) p.push(`**Range**: ${item.range}`);
  if (item.weight) p.push(`**Weight**: ${item.weight}`);
  return {
    id: generateId(),
    name: item.title,
    type: 'Trinket',
    mechanics: p.length
      ? `> **${item.title}**  \n${p.map((x) => `> ${x}`).join('  \n')}`
      : '',
    description: item.description ?? '',
    source: item.slug,
    importedFrom: 'trinkets',
  };
}

export function featToAbility(feat: FeatMetadata): CharacterAbility {
  return {
    id: generateId(),
    name: feat.title,
    type: 'Feat',
    mechanics: feat.prerequisite
      ? `**Prerequisite**: ${feat.prerequisite}`
      : '',
    description: feat.description ?? '',
    source: feat.slug,
    importedFrom: 'feats',
  };
}

export async function fetchRawSource(
  type: string,
  slug: string,
  locale: string,
): Promise<string | undefined> {
  try {
    const res = await fetch('/api/raw-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, slug, locale }),
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json.content as string;
  } catch {
    return undefined;
  }
}
