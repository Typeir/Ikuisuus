/**
 * @fileoverview Slot card component registry.
 * @description Card components for the library's slot forms, keyed by MDX
 * component name.
 *
 * @module modules/library/presentation/components/slots
 * @version 0.4.0
 * @author Typeir
 * @since 2026-09-02
 */

import { SLOT_ELEMENT_NAMES } from '@/modules/library/domain/slots';
import Attributes from './item/Attributes';
import Bloodline from './bloodline/Bloodline';
import Boons from './bloodline/Boons';
import Choice from './utils/Choice';
import Fold from './sheet/Fold';
import Sheet from './sheet/Sheet';
import Feat from './feat/Feat';
import Feature, { Action, Attack, Curse, Pool, Trait } from './feature/Feature';
import Heirloom, { Trinket } from './item/Heirloom';
import Lore from './utils/Lore';
import Monster from './monster/Monster';
import Overcast from './spell/Overcast';
import Statlet from './item/Statlet';
import Progression, { Column, Row } from './vocation/Progression';
import Scaling from './spell/Scaling';
import Spell from './spell/Spell';
import SpellList from './spell/SpellList';
import SpellLists from './spell/SpellLists';
import Vocation, { Specialization } from './vocation/Vocation';
import * as slotModule from './utils/slotElements';

/**
 * Slot card component map, keyed by MDX component name.
 */
export const slotComponents: Record<string, unknown> = {
  Heirloom,
  Attributes,
  Feature,
  Trait,
  Curse,
  Action,
  Pool,
  Attack,
  Spell,
  Trinket,
  Monster,
  Vocation,
  Specialization,
  Bloodline,
  Boons,
  Choice,
  Fold,
  Sheet,
  Lore,
  Progression,
  Scaling,
  Column,
  Row,
  SpellList,
  SpellLists,
  Feat,
  Statlet,
  ...Object.fromEntries(
    Object.values(SLOT_ELEMENT_NAMES).map((elementName) => [
      elementName,
      (slotModule as Record<string, unknown>)[elementName],
    ]),
  ),
  /* Overcast renders either as a row or as a titled block, so it replaces the
     generated inline element rather than sitting beside it. */
  Overcast,
};
