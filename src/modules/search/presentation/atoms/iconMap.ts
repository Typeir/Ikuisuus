/**
 * @fileoverview Type → Lucide Icon Map
 * @description Maps domain `SearchContentType` strings to Lucide icon
 * components.
 *
 * @module modules/search/presentation/atoms/iconMap
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
    BookOpen,
    Droplet,
    FlaskConical,
    Gem,
    Medal,
    ScrollText,
    Skull,
    Sparkles,
    Star,
    Swords,
    type LucideIcon,
} from 'lucide-react';
import type { SearchContentType } from '../../domain';

/** Maps each content type to its Lucide icon component. */
export const typeIconMap: Record<SearchContentType, LucideIcon> = {
  monsters: Skull,
  spells: Sparkles,
  heirlooms: Gem,
  trinkets: FlaskConical,
  bloodlines: Droplet,
  vocations: Swords,
  specializations: Star,
  feats: Medal,
  world: ScrollText,
  rules: BookOpen,
};
