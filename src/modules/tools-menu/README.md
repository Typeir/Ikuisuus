# tools-menu Module

DDD module exposing the sidebar DM tools navigation menu.

## Structure

```
src/modules/tools-menu/
├── index.ts                              # Public barrel (ToolsMenu, useToolRegistry, ToolMenuItem)
├── README.md
├── domain/
│   └── toolMenuItem.types.ts             # ToolMenuItem interface
├── infrastructure/
│   └── registry/
│       └── toolRegistry.config.ts        # TOOL_REGISTRY static config + ToolRegistryEntry
├── application/
│   └── hooks/
│       └── useToolRegistry.ts            # i18n-aware hook → ToolMenuItem[]
└── presentation/
    └── ToolsMenu/
        ├── ToolsMenu.tsx                 # Dropdown menu component
        ├── ToolsMenu.module.scss         # Styles
        └── index.ts                     # Re-export barrel
```

## Usage

```tsx
import { ToolsMenu, useToolRegistry } from '@/modules/tools-menu';

function MyShell() {
  const toolItems = useToolRegistry();
  return (
    <ToolsMenu
      items={toolItems}
      onSelect={(item) => router.push(item.href)}
      trigger={
        <>
          <WrenchIcon /> Tools
        </>
      }
    />
  );
}
```

## Adding a Tool

1. Add an entry to `infrastructure/registry/toolRegistry.config.ts`
2. Add the label keys to `messages/{locale}/layout.json` for all locales
3. Run `npm run merge-locales`

## i18n

Uses the `layout` namespace. Required keys under `tools.*`:

- `tools.title`
- `tools.label`
- `tools.toggleTools`
- `tools.encounterCreator`
- `tools.worldSim`
- `tools.characterBuilder`
- `tools.mdxEditor`

> ⚠️ **Known gap**: `es` and `fi` locales are missing `tools.label`, `tools.worldSim`, `tools.mdxEditor`, and `tools.characterBuilder` — these will fall back to the key string until translated.

## Tests

```
tests/unit/src/modules/tools-menu/
├── ToolsMenu.test.tsx          # Component unit tests (11 suites)
├── useToolRegistry.test.ts     # Hook unit tests
└── tools-menu-registry.test.tsx # Integration test
tests/e2e/
└── tools-menu.spec.ts          # Playwright e2e
```
