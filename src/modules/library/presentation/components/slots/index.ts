/**
 * @fileoverview Slot card component registry.
 * @description Card components for the library's slot forms, keyed by MDX
 * component name. Slot elements are picked off the element module's named
 * exports by schema, so the registry follows the schema; picking named
 * exports keeps each element a client reference when a server component
 * consumes this map. Spread into the library's component registry, so content
 * can use these tags directly.
 *
 * @module modules/library/presentation/components/slots
 * @version 0.4.0
 * @author Typeir
 * @since 2026-09-02
 */

import { SLOT_ELEMENT_NAMES } from '@/modules/library/domain/slots';
import Attributes from './Attributes';
import Feat from './Feat';
import Feature, { Action, Curse, Pool, Trait } from './Feature';
import Heirloom, { Trinket } from './Heirloom';
import Monster from './Monster';
import Overcast from './Overcast';
import Spell from './Spell';
import Vocation from './Vocation';
import * as slotModule from './slotElements';

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
  Spell,
  Trinket,
  Monster,
  Vocation,
  Feat,
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
