---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## Existing UI Atoms in the Codebase

**IMPORTANT**: Before inventing new components, use the existing atoms already available in the Library of Ikuisuus codebase. These components are battle-tested, styled, and accessible. Compose them creatively rather than building from scratch.

### Verified Atoms

- **[Tooltip](src/lib/components/ui/tooltip/tooltip.tsx)** — Accessible hover/focus tooltips with placement options, delays, and auto-flip. Supports custom content and styling.
- **[Draggable](src/lib/components/ui/draggable/Draggable.tsx)** — Resizable, repositionable panels with handles and optional close buttons. Powers WorldSim content panels and character sheet previews.
- **[Dropdown](src/lib/components/ui/dropdown/)** — Menu patterns with open/close states, keyboard navigation, and positioning logic.
- **[Tables](src/lib/components/mdx/MetadataTable/)** — Generic table component for rendering metadata (monsters, heirlooms, spells). Supports custom columns, sorting, and searching.
- **[Lucide Icons](https://lucide.dev)** — Comprehensive icon library (lucide-react). 1000+ consistent, accessible icons. Use instead of custom SVGs or icon fonts.

### Import Examples

```typescript
// Use existing components
import { Tooltip } from '@/lib/components/ui/tooltip';
import { Draggable } from '@/lib/components/ui/draggable/Draggable';
import { MetadataTable } from '@/lib/components/mdx/MetadataTable';
import { ChevronDown, Heart, Settings, AlertCircle } from 'lucide-react';

// NOT inventing:
// - Custom button variants (use semantic HTML + CSS)
// - Bespoke card containers (use Draggable or semantic divs)
// - Homebrew modals (use Draggable + Tooltip patterns)
// - One-off popup systems (use Tooltip with custom content)
// - Custom icons (use lucide-react instead)
```

### When to Compose vs. Create

**Compose existing atoms when:**

- Building modal/dialog-like interfaces → Use `Draggable`
- Needing hover information → Use `Tooltip`
- Displaying tabular data → Use `MetadataTable`
- Building dropdown menus → Use `Dropdown`

**Only create NEW components when:**

- The requirement is fundamentally different from existing atoms (after confirming no existing component fits)
- The new component will be reused across multiple pages
- No combination of existing atoms can solve the problem efficiently

### Design Within Constraints

The existing atoms come with built-in styling via SCSS modules and CSS variables. Respect their design while:

- Applying custom `className` props to adjust wrapping divs
- Using theme variables (`--color-bg`, `--color-text`, etc.) for consistency
- Theming via existing slots (dark/light mode support built-in)

This approach ensures cohesion across the application and prevents component proliferation.
