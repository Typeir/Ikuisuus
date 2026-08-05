/**
 * @fileoverview Aspect Glyphs
 * @description The glyph tables behind `aspectMark`, split out so the domain
 * module stays under the file-length gate.
 *
 * Colour carries the group, which is what lets one glyph serve several
 * vocabularies: `Flame` is `damage:fire` in ember and `condition:burning` in
 * violet, and the two are different marks rather than a collision.
 *
 * @module modules/library/domain/aspectGlyphs
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */
import {
  Activity,
  Anvil,
  ArrowDownToLine,
  Ban,
  Battery,
  BatteryLow,
  Blend,
  Brain,
  ChevronUp,
  ChevronsUp,
  CircleDot,
  CircleOff,
  CloudOff,
  Cog,
  Dices,
  Drama,
  Droplet,
  Droplets,
  EarOff,
  Eye,
  EyeOff,
  FlaskConical,
  Flame,
  Footprints,
  Gem,
  Ghost,
  Grab,
  Hammer,
  HeartHandshake,
  HeartPulse,
  Hourglass,
  Key,
  Landmark,
  Layers,
  Lock,
  type LucideIcon,
  Moon,
  Mountain,
  MoveUpRight,
  Palette,
  PawPrint,
  Radiation,
  Ruler,
  Scaling,
  Send,
  Shield,
  ShieldOff,
  Snail,
  Snowflake,
  Sparkles,
  Spline,
  Sun,
  Sword,
  Swords,
  Timer,
  TrendingUp,
  VenetianMask,
  Waves,
  Zap,
} from 'lucide-react';

/** Last-resort glyph for a group with no mapping of its own. */
export const FALLBACK_ICON: LucideIcon = Cog;

/** Glyph per group, used when a value has no glyph of its own. */
export const GROUP_ICON: Record<string, LucideIcon> = {
  /* Crossed swords for damage in general; a single sword is slashing. `Flame`
     was wrong here because it is fire's own glyph, which made a stratum read as
     "fire, plus three others" rather than as damage as such. */
  damage: Swords,
  defense: Shield,
  resistance: Shield,
  immunity: Ban,
  vulnerability: ShieldOff,
  condition: Activity,
  mechanic: Cog,
  phase: HeartPulse,
  range: Ruler,
  delivery: Send,
  tempo: Timer,
  resource: Battery,
  scaling: TrendingUp,
  save: Dices,
  source: Waves,
  access: Key,
  size: Scaling,
  rarity: Gem,
  creature: PawPrint,
  sense: Eye,
  movement: Footprints,
  position: MoveUpRight,
  cover: Layers,
  proficiency: Anvil,
  property: Anvil,
  component: FlaskConical,
  slot: CircleDot,
  myth: Landmark,
  theme: Palette,
  level: Layers,
  item: Gem,
  weapon: Sword,
  armor: Shield,
  vocation: Landmark,
};

/**
 * Glyph per damage type. These double as the badge on a scoped defence, so the
 * element is recognisable inside a composed mark.
 */
export const DAMAGE_ICON: Record<string, LucideIcon> = {
  fire: Flame,
  frost: Snowflake,
  lightning: Zap,
  dark: Moon,
  force: Radiation,
  poison: FlaskConical,
  psychic: Brain,
  holy: Sun,
  chemical: Droplets,
  bludgeoning: Hammer,
  piercing: MoveUpRight,
  slashing: Sword,
  true: Sparkles,
};

/**
 * How much worse a condition is than the family it belongs to.
 *
 * Drawn as a chevron badge over the family's base glyph, so a reader who has
 * never seen `terrified` can still tell it is the worse version of the thing
 * beside it.
 */
export type Severity = 'base' | 'worse' | 'worst';

/**
 * Glyph and severity per condition.
 *
 * **Every condition gets its own glyph, and the chevron carries the ladder.**
 * Sharing one base across a family was tried first and breaks under
 * composition: `immunity:stunned` draws the condition as a 12px badge under a
 * `Ban`, which has no room for a severity chevron, so every member of a family
 * collapsed into the same mark. Identity has to survive being shrunk; the
 * relationship is what degrades gracefully.
 *
 * Four ladders are written into the rules rather than inferred:
 *
 * - **Incapacitation.** `stunned` and `paralyzed` each open with "is
 *   **incapacitated**", and paralyzed adds auto-crits on top of stunned.
 * - **Restraint.** `restrained` is `grappled` plus advantage against it and
 *   disadvantage on its own attacks and Dexterity saves.
 * - **Fear.** `terrified` is `frightened` plus a forced Dash away and
 *   disadvantage even when the source is out of sight.
 * - **Action economy.** `staggered` only forbids reactions; `slowed` forbids
 *   reactions *and* halves speed, caps attacks and taxes casting. Staggered is
 *   the lighter of the two, which is the reverse of how the words sound.
 */
export const CONDITION_MARK: Record<string, { Icon: LucideIcon; severity: Severity }> =
  {
    incapacitated: { Icon: CircleOff, severity: 'base' },
    stunned: { Icon: Sparkles, severity: 'worse' },
    paralyzed: { Icon: Zap, severity: 'worst' },

    grappled: { Icon: Grab, severity: 'base' },
    restrained: { Icon: Lock, severity: 'worse' },

    frightened: { Icon: Ghost, severity: 'base' },
    terrified: { Icon: Drama, severity: 'worse' },

    staggered: { Icon: Hourglass, severity: 'base' },
    slowed: { Icon: Snail, severity: 'worse' },

    bleeding: { Icon: Droplet, severity: 'base' },
    blinded: { Icon: EyeOff, severity: 'base' },
    burning: { Icon: Flame, severity: 'base' },
    charmed: { Icon: HeartHandshake, severity: 'base' },
    deafened: { Icon: EarOff, severity: 'base' },
    exhaustion: { Icon: BatteryLow, severity: 'base' },
    invisible: { Icon: VenetianMask, severity: 'base' },
    petrified: { Icon: Mountain, severity: 'base' },
    poisoned: { Icon: FlaskConical, severity: 'base' },
    prone: { Icon: ArrowDownToLine, severity: 'base' },
    suffocating: { Icon: CloudOff, severity: 'base' },
    sundered: { Icon: ShieldOff, severity: 'base' },
    unconscious: { Icon: Moon, severity: 'base' },
    unsteady: { Icon: Spline, severity: 'base' },
  };

/** Badge drawn over a family's base glyph to mark severity. */
export const SEVERITY_BADGE: Record<Severity, LucideIcon | undefined> = {
  base: undefined,
  worse: ChevronUp,
  worst: ChevronsUp,
};

/** Glyph per value where the value reads better than its group. */
export const VALUE_ICON: Record<string, LucideIcon> = {
  'delivery:aura': Blend,
  'delivery:summon': Sparkles,
  'movement:dimensional': Blend,
};

/**
 * The three damage types in each stratum, in canon order.
 *
 * A stratum is always exactly three types and always will be, which is what
 * makes it drawable: the mark is the three member glyphs in their own colours,
 * arranged around a point. `true` damage has no stratum — it stands outside all
 * of them and cannot be resisted.
 */
export const STRATUM_TYPES: Record<string, readonly string[]> = {
  physical: ['slashing', 'bludgeoning', 'piercing'],
  elemental: ['frost', 'fire', 'lightning'],
  somatic: ['poison', 'chemical', 'psychic'],
  akashic: ['holy', 'dark', 'force'],
};

/** Groups drawn as a modifier over the damage glyph rather than their own mark. */
export const SCOPED_DEFENCE: Record<string, LucideIcon> = {
  resistance: Shield,
  immunity: Ban,
  vulnerability: ShieldOff,
};

