# SCSS and Theme Token Rules

> **HARD RULE**: ABSOLUTELY NO color literals outside theme token definitions. Zero exceptions.

## Theme Token Location

**Single source of truth**: `src/app/[locale]/globals.scss`

All theme colors are CSS custom properties defined in:

- `:root` (default/fallback)
- `html[data-theme='light']`
- `html[data-theme='dark']`

---

## DO / DO NOT

### ✅ DO

```scss
// Use theme tokens
.myComponent {
  color: var(--color-text);
  background-color: var(--color-bg);
  border-color: var(--color-border);

  &:hover {
    background-color: var(--color-bg-secondary);
  }
}

// Use semantic tokens for notifications/states
.error {
  color: var(--color-error);
}
.warning {
  color: var(--color-warning);
}
.success {
  color: var(--color-success);
}
.info {
  color: var(--color-info);
}

// Use shadow tokens with rgb() function
.elevated {
  box-shadow: 0 4px 12px rgb(var(--color-shadow));
}

// Use opacity tokens for overlays
.overlay {
  background: rgb(var(--color-overlay));
}

// Use transparency token when needed
.transparent-bg {
  background-color: var(--color-transparent);
}
```

### ❌ DO NOT

```scss
// ❌ NO hex colors
.bad { color: #ff0000; }

// ❌ NO rgb/rgba with literal values
.bad { background: rgb(255, 0, 0); }
.bad { background: rgba(0, 0, 0, 0.5); }

// ❌ NO hsl/hsla
.bad { color: hsl(0, 100%, 50%); }

// ❌ NO color names
.bad { color: red; }
.bad { background: white; }
.bad { border-color: black; }

// ❌ NO 'transparent' keyword (use token)
.bad { background: transparent; }

// ❌ NO inline styles with colors
<div style={{ color: '#333' }}>  // ❌
<div style={{ color: 'var(--color-text)' }}>  // ✅ if must use inline

// ❌ NO hardcoded shadows
.bad { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
```

---

## Available Token Categories

### Core Colors

```scss
--color-bg              // Primary background
--color-bg-secondary    // Secondary background (cards, panels)
--color-bg-tertiary     // Tertiary background
--color-text            // Primary text
--color-text-secondary  // Muted/secondary text
--color-accent          // Primary accent (links, highlights)
--color-accent-hover    // Accent hover state
--color-surface         // Surface/card background
--color-border          // Border color
```

### Semantic Colors

```scss
--color-primary         // Primary brand color
--color-secondary       // Secondary brand color
--color-actionable      // Clickable/actionable items
--color-emphasis        // Emphasized text
```

### Notification/State Colors

```scss
--color-success         // Success state (green)
--color-warning         // Warning state (amber)
--color-error           // Error state (red)
--color-info            // Info state (blue)
--color-danger          // Danger/destructive (red)
--color-stratagem       // Stratagem mechanic (purple)
```

### Lair/Special Event Colors

```scss
--color-lair-bg-start   // Lair gradient start
--color-lair-bg-end     // Lair gradient end
--color-lair-border     // Lair border (gold)
--color-lair-text       // Lair text
```

### Shadow/Overlay Tokens (use with rgb())

```scss
--color-shadow          // Default shadow (e.g., 0 0 0 / 0.3)
--color-shadow-light    // Light shadow
--color-shadow-medium   // Medium shadow
--color-overlay         // Modal/overlay background
--color-accent-a10      // Accent at 10% opacity
--color-accent-a20      // Accent at 20% opacity
--color-stratagem-a15   // Stratagem at 15% opacity
```

### Structural

```scss
--color-transparent     // Use instead of 'transparent' keyword
```

### Corner Radii (`src/styles/globals/_tokens.scss`)

One scale for every rounded corner on the site, so the whole UI can be squared
off by editing one block — the terminal / Greek-architecture idiom the design
draws on has no rounded corners, and un-roundening tests flip these tokens.

```scss
--border-round-xs       // 2px  — hairline chips, focus rings
--border-round-s        // 4px  — buttons, inputs, scrollbar thumbs
--border-round-m        // 6px  — cards, panels, search results
--border-round-l        // 8px  — larger panels
--border-round-xl       // 12px — sheets, tab strips, section frames
--border-round-2xl      // 24px — hero media
--border-round-pill     // 999px — badges, pills
--border-round-circle   // 50%  — avatars, dots
```

```scss
// ✅ Tokens, including per-corner shorthands
.card { border-radius: var(--border-round-m); }
.tab  { border-radius: var(--border-round-m) var(--border-round-m) 0 0; }

// ✅ Sass mixin params carry the token through
@include scrollbar-thin($thumb-radius: var(--border-round-s));

// ❌ Literal radii
.bad { border-radius: 4px; }
.bad { border-radius: 0.375rem; }
```

`0` and `inherit` stay literal. The only literal radius left in the tree is the
`35%` squircle in `BlendedImage` — a deliberate shape, not a scale step.

---

## Adding New Tokens

When you need a new color token:

1. **Define in both themes** in `globals.scss`:

   ```scss
   // In :root (dark default)
   :root {
     --color-my-new-token: #somevalue;
   }

   // In light theme
   html[data-theme='light'] {
     --color-my-new-token: #lightvalue;
   }

   // In dark theme (explicit)
   html[data-theme='dark'] {
     --color-my-new-token: #darkvalue;
   }
   ```

2. **Use semantic naming**: Name describes purpose, not color
   - ✅ `--color-danger-bg`
   - ❌ `--color-red`

3. **Consider existing tokens**: Check if an existing token already serves the purpose

---

## Acceptance Checks (grep-based)

Run these to validate no color literals exist outside globals.scss:

```bash
# Find hex colors outside globals.scss
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include="*.scss" --include="*.css" | grep -v "globals.scss"

# Find rgb/rgba literals
grep -rn "rgb\s*(" src/ --include="*.scss" --include="*.css" | grep -v "var(--color" | grep -v "globals.scss"
grep -rn "rgba\s*(" src/ --include="*.scss" --include="*.css" | grep -v "var(--color" | grep -v "globals.scss"

# Find hsl/hsla literals
grep -rn "hsl\s*(" src/ --include="*.scss" | grep -v "globals.scss"

# Find color keywords (common ones)
grep -rn "color:\s*\(red\|blue\|green\|white\|black\|transparent\)[^-]" src/ --include="*.scss" | grep -v "globals.scss"

# Find inline style colors in TSX
grep -rn "style={{.*color.*#" src/ --include="*.tsx"
grep -rn "style={{.*background.*#" src/ --include="*.tsx"

# Find literal corner radii (expected: only BlendedImage's 35% squircle)
grep -rnE "border(-[a-z]+)*-radius\s*:\s*[0-9.]+(px|rem|em|%)" src/ --include="*.scss" --include="*.css"
```

---

## Inline Styles

**Avoid inline styles for colors**. If absolutely necessary:

```tsx
// ✅ Acceptable (uses CSS variable)
<div style={{ color: 'var(--color-text)' }}>

// ❌ Never
<div style={{ color: '#333' }}>
<div style={{ backgroundColor: 'red' }}>
```

---

## Tailwind Integration

The project uses Tailwind with CSS variable integration. Use:

```tsx
// ✅ Tailwind classes that reference theme tokens
<div className="text-[var(--color-text)] bg-[var(--color-bg)]">

// ❌ Tailwind arbitrary values with literals
<div className="text-[#333] bg-[red]">
```

Prose typography is configured in `src/styles/prose-theme.ts` to use theme variables.

---

## Common Mistakes

### Shadow Box with Literals

```scss
// ❌ Wrong
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

// ✅ Correct
box-shadow: 0 4px 12px rgb(var(--color-shadow));
```

### Transparent Keyword

```scss
// ❌ Wrong
background: transparent;
border-color: transparent;

// ✅ Correct
background: var(--color-transparent);
border-color: var(--color-transparent);
```

### Hardcoded Focus Rings

```scss
// ❌ Wrong
&:focus {
  outline: 2px solid blue;
}

// ✅ Correct
&:focus {
  outline: 2px solid var(--color-accent);
}
```

---

## Theme-Aware Components

Components should respond to theme changes automatically via CSS variables. No JavaScript theme checks for colors:

```tsx
// ❌ Wrong - don't read theme in JS for colors
const theme = getTheme();
const color = theme === 'dark' ? '#fff' : '#000';

// ✅ Correct - CSS handles it
// Component just uses: color: var(--color-text)
```

---

## Related Documentation

- [Theme System Architecture](./theme-system.md) - Full theme system details
- [Testing Rules](./testing-rules.md) - Testing patterns
- [JSDoc Standards](./jsdoc.md) - Documentation requirements
