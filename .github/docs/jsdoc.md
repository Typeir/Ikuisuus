# JSDoc Standards for Library of Ikuisuus

This document defines the JSDoc formatting standards used throughout the project's scripts and utility modules.

---

## Hard Rules Summary

> **REQUIRED on all touched code**: JSDoc must be present on every exported function, interface, type, class, and constant.

| Rule                                  | Enforcement                                                          |
| ------------------------------------- | -------------------------------------------------------------------- |
| File-level `@fileoverview`            | Required for all `.ts`/`.tsx`/`.mjs` files                           |
| Interface `@property` tags            | REQUIRED - no inline `/** */` on properties                          |
| Function callbacks in props           | Include full type signature: `{(arg: T) => R}`                       |
| Inline comments inside logic          | **PROHIBITED** - extract to helper functions with JSDoc              |
| `@component` tag for React components | Required with function prop signatures                               |
| Component `@param` exhaustiveness     | **REQUIRED** - every prop must have a `@param {Type} [props.x]` line |

---

## Inline Comments Policy

> **HARD RULE**: NO inline comments inside function/method bodies.

### ❌ DO NOT

```typescript
function processData(items: Item[]) {
  // Filter out inactive items  ❌
  const active = items.filter((i) => i.active);

  // Sort by priority  ❌
  const sorted = active.sort((a, b) => a.priority - b.priority);

  // Take top 10  ❌
  return sorted.slice(0, 10);
}
```

### ✅ DO

```typescript
/**
 * Processes items by filtering, sorting, and limiting results
 *
 * @param {Item[]} items - Raw items to process
 * @returns {Item[]} Top 10 active items sorted by priority
 */
function processData(items: Item[]) {
  const active = filterActiveItems(items);
  const sorted = sortByPriority(active);
  return limitResults(sorted, 10);
}

/**
 * Filters items to only include active ones
 * @param {Item[]} items - Items to filter
 * @returns {Item[]} Active items only
 */
function filterActiveItems(items: Item[]): Item[] {
  return items.filter((i) => i.active);
}
```

**Why**: Inline comments become stale. Helper functions with JSDoc are self-documenting, testable, and maintainable.

---

## File-Level Documentation

Every JavaScript/TypeScript file should begin with a comprehensive file-level JSDoc block:

```javascript
/**
 * Module Title
 *
 * @fileoverview Brief description of what this file does (1-3 sentences).
 * Additional context about purpose, use cases, or architectural decisions.
 *
 * @module moduleName
 * @version 1.0.0
 * @author AuthorName
 * @since 1.0.0
 *
 * @requires dependency1 Description of what this dependency provides
 * @requires dependency2 Description of what this dependency provides
 *
 * @description
 * Detailed multi-paragraph explanation of the module's purpose, architecture,
 * and key concepts. Include:
 * - What problem this solves
 * - How it fits into the larger system
 * - Key algorithms or patterns used
 * - Performance characteristics
 *
 * @example
 * // How to use this module
 * const result = await myFunction('input');
 *
 * @example
 * // Advanced usage
 * const advanced = await myFunction('input', { option: true });
 */
```

## Function Documentation

Functions must document parameters, return values, errors, and include examples:

```javascript
/**
 * Brief one-line description of what the function does
 *
 * @async (if function is async)
 * @function functionName
 * @param {Type} paramName - Parameter description
 * @param {Type} [optionalParam] - Optional parameter description
 * @param {Type} [optionalParam="default"] - Optional with default value
 * @returns {ReturnType} Description of what is returned
 * @throws {ErrorType} Description of when errors are thrown
 *
 * @description
 * Detailed explanation of function behavior:
 * 1. Step one of the process
 * 2. Step two of the process
 * 3. Step three of the process
 *
 * Additional notes about edge cases, performance, or limitations.
 *
 * @example
 * // Basic usage
 * const result = parseStatBlock(lines);
 * // Returns: { ac: 20, hp: 780, cr: "23" }
 *
 * @example
 * // With optional parameters
 * const result = parseStatBlock(lines, { strict: true });
 */
async function parseStatBlock(lines, options = {}) {
  // Implementation
}
```

## Interface/Type Documentation

> **HARD RULE**: All interface properties MUST use `@property` tags in the JSDoc block.  
> **DO NOT** use inline `/** comments */` on individual properties.

TypeScript interfaces and complex types should be fully documented:

```javascript
/**
 * @interface InterfaceName
 * @description Complete description of the interface purpose
 * @property {string} requiredProp - Description of required property
 * @property {number} [optionalProp] - Description of optional property
 * @property {Type} [optionalProp=default] - Optional with default value
 * @property {(value: T) => void} onChange - Function prop with type signature
 */
interface InterfaceName {
  requiredProp: string;
  optionalProp?: number;
}
```

### ✅ Correct Interface Documentation

```typescript
/**
 * Props for FilterSelect component
 *
 * @interface FilterSelectProps
 * @property {string} value - Currently selected value
 * @property {FilterSelectOption[]} options - Available options
 * @property {(value: string) => void} onChange - Callback when selection changes
 * @property {string} [placeholder] - Placeholder text when no selection
 * @property {boolean} [disabled=false] - Whether the select is disabled
 */
interface FilterSelectProps {
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

### ❌ Incorrect (DO NOT use inline comments)

```typescript
// ❌ WRONG - Inline comments on properties
interface FilterSelectProps {
  /** Currently selected value */
  value: string;
  /** Available options */
  options: FilterSelectOption[];
  /** Callback when selection changes */
  onChange: (value: string) => void;
}
```

## Constant Documentation

Constants should document their type and purpose:

```javascript
/**
 * Brief description of what this constant represents
 * @constant
 * @type {Type}
 * @default defaultValue (if applicable)
 */
const MY_CONSTANT = value;
```

## React Component Documentation

> **HARD RULE**: Every React component's JSDoc **must** list each prop individually via `@param {Type} [props.x]` lines between the `@param {PropsType} props` line and the `@returns` line. A bare `@param` + `@returns` without per-prop lines is a violation.

This applies to **all** component-level JSDoc blocks — functional components, providers, page components, and inner render helpers.

### Why

A single `@param {MyProps} props` tells consumers nothing about the actual contract. Exhaustive `@param [props.x]` lines make every prop visible in IDE hover tooltips, enforce documentation coverage, and prevent props from being added without documentation.

### ✅ Correct: Exhaustive per-prop `@param` lines

```tsx
/**
 * Split-pane editor layout with a draggable divider.
 *
 * @component
 * @param {EditorSplitPaneProps} props - Component properties
 * @param {string} props.textareaId - DOM id of the code editor textarea
 * @param {string} props.content - Editor text content
 * @param {Function} props.setContent - Update editor content callback
 * @param {boolean} props.disabled - Whether the editor is inactive
 * @param {'edit' | 'new'} props.mode - Editor mode
 * @param {string} props.newPlaceholder - Placeholder text for new file mode
 * @returns {JSX.Element} Split pane editor
 */
```

### ❌ Wrong: Missing per-prop lines

```tsx
/**
 * Split-pane editor layout with a draggable divider.
 *
 * @component
 * @param {EditorSplitPaneProps} props - Component properties
 * @returns {JSX.Element} Split pane editor
 */
```

### Formatting Rules

| Scenario                     | Format                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Required prop                | `@param {Type} props.name - Description`                                       |
| Optional prop                | `@param {Type} [props.name] - Description`                                     |
| Optional with default        | `@param {Type} [props.name=default] - Description`                             |
| Callback/function prop       | `@param {Function} props.onChange - Description of when it fires`              |
| Union literal prop           | `@param {'edit' \| 'new'} props.mode - Description`                            |
| Complex object prop          | `@param {{ username: string, role: string } \| null} props.user - Description` |
| Promise prop (Next.js pages) | `@param {Promise<{ locale: string }>} props.params - Async route parameters`   |

### Provider / Context Components

Providers follow the same rule — `children` and config props must all be listed:

```tsx
/**
 * Provider component that wraps a combatant row.
 *
 * @component CombatantProvider
 * @param {CombatantProviderProps} props - Provider props
 * @param {InProgressCombatant} props.combatant - The combatant data object
 * @param {string} props.locale - Current locale
 * @param {Function} props.onUpdate - Callback when combatant data changes
 * @param {Function} [props.onRemoveSessionOnly] - Remove combatant from session
 * @param {ReactNode} props.children - Child components to wrap
 * @param {boolean} [props.disableLocking=false] - Whether to disable row locking
 * @returns {React.ReactElement} Provider with children
 */
```

### Empty Props Interfaces

Components with empty prop interfaces (e.g., components that get all data from context) are exempt — there are no props to document:

```tsx
/**
 * @component
 * @param {CombatantConditionsManagerProps} props - Component props
 * @returns {JSX.Element} Rendered conditions manager
 */
```

## Class Documentation

Classes require documentation at the class level and for each method:

```javascript
/**
 * Brief description of the class purpose
 *
 * @class ClassName
 * @description Detailed explanation of the class:
 * - What it represents
 * - Key responsibilities
 * - Usage patterns
 *
 * @example
 * const instance = new ClassName('param');
 * instance.method();
 */
class ClassName {
  /**
   * Creates an instance of ClassName
   *
   * @constructor
   * @param {Type} param - Parameter description
   */
  constructor(param) {
    // Implementation
  }

  /**
   * Method description
   *
   * @method methodName
   * @param {Type} param - Parameter description
   * @returns {Type} Return value description
   *
   * @example
   * instance.methodName('value');
   */
  methodName(param) {
    // Implementation
  }
}
```

## Project-Specific Tags

### Metadata Generators

For metadata generation scripts, include additional context:

```javascript
/**
 * @fileoverview Parser for D&D monster stat blocks.
 * Extracts structured metadata including combat stats, abilities, resistances.
 *
 * @module generateMonsterMetadata
 * @version 3.0.0
 * @since 1.0.0
 *
 * @requires @/lib/metadata Performance monitoring and utility functions
 * @requires scripts/core/shared-data.json Centralized game data and validation patterns
 *
 * @description
 * Advanced parser supporting:
 * - Multiple stat blocks per file
 * - Nested blockquote variants
 * - Comprehensive tag generation
 * - Performance profiling
 *
 * Output Format:
 * - Writes .metadata.json files alongside source .sheet.mdx files
 * - Supports arrays for multi-variant monsters
 * - Includes auto-generated tags for filtering
 */
```

### Build Scripts

For build pipeline scripts:

```javascript
/**
 * @fileoverview Compresses full-resolution images to WebP format.
 * Part of the pre-initialization build pipeline.
 *
 * @module compressAssets
 * @version 2.0.0
 *
 * @requires sharp Image processing library
 * @requires fs.promises File system operations
 *
 * @description
 * Pipeline Stage: 1 (runs first in pre-init)
 *
 * Process:
 * 1. Scans public/full-size/ for images
 * 2. Converts to WebP (max 1600px width)
 * 3. Outputs to public/library/
 * 4. Mirrors directory structure
 * 5. Skips existing files
 *
 * Performance: ~5-30 seconds for 50 images
 * Memory: Peak ~200MB during processing
 */
```

## Tag Reference

### Common Tags

- `@fileoverview` - Brief file description
- `@module` - Module name
- `@version` - Current version
- `@author` - Author name
- `@since` - Initial version
- `@requires` - Dependencies with descriptions
- `@description` - Detailed explanation
- `@example` - Usage examples (multiple allowed)
- `@function` - Function definition
- `@async` - Marks async functions
- `@param` - Function parameter
- `@returns` - Return value
- `@throws` - Error conditions
- `@constant` - Constant value
- `@type` - Type annotation
- `@default` - Default value
- `@interface` - Interface definition
- `@property` - Interface property
- `@class` - Class definition
- `@constructor` - Constructor method
- `@method` - Class method

### Type Syntax

```javascript
@param {string} name - Simple type
@param {string|number} id - Union type
@param {string[]} tags - Array type
@param {Object} options - Generic object
@param {{ key: string, value: number }} obj - Literal object type
@param {Record<string, any>} map - Record/map type
@param {Promise<string>} result - Promise type
@param {Type} [optional] - Optional parameter
@param {Type} [optional="default"] - Optional with default
```

## Examples from Codebase

### Metadata Generator (Complex)

```javascript
/**
 * Spell Metadata Generator
 *
 * @fileoverview Parser for d20 spell descriptions in MDX format.
 * Extracts level, school, casting time, components, and game mechanics tags.
 *
 * @module generateSpellMetadata
 * @version 2.0.0
 * @since 1.0.0
 *
 * @requires fs.promises File system operations
 * @requires @/lib/metadata Shared parsing and tagging utilities
 *
 * @description
 * Parses spell MDX files to extract:
 * - Level (0-12, where 0 = cantrip)
 * - School (Evocation, Abjuration, etc.)
 * - Casting time (parsed as array: action, bonus action, reaction)
 * - Components (V, S, M with descriptions)
 * - Concentration requirement
 * - Damage types and conditions
 *
 * Special Handling:
 * - Dual casting times (e.g., "1 action or reaction")
 * - Ritual casting detection
 * - Material component extraction with descriptions
 *
 * @example
 * // Run generator
 * npx tsx --tsconfig tsconfig.scripts.json scripts/metadata/generateSpellMetadata.ts
 * // Output: Creates .metadata.json files alongside spell .mdx files
 */

/**
 * Parses spell casting time into array of action economy types
 *
 * @function parseCastingTimeToArray
 * @param {string} castingTimeRaw - Raw casting time text from spell
 * @returns {string[]} Array of action types (e.g., ['action', 'reaction'])
 *
 * @description
 * Priority order (first match wins):
 * 1. "bonus action" - Highest priority
 * 2. "action" - Second priority
 * 3. "reaction" - Third priority
 * 4. Time durations - "minute", "hour", "day"
 * 5. "ritual" - Special flag
 *
 * Handles dual casting times:
 * "1 action or reaction" → ['action', 'reaction']
 *
 * @example
 * parseCastingTimeToArray('1 action');
 * // Returns: ['action']
 *
 * @example
 * parseCastingTimeToArray('1 bonus action or reaction');
 * // Returns: ['bonus action', 'reaction']
 *
 * @example
 * parseCastingTimeToArray('1 minute (ritual)');
 * // Returns: ['minute', 'ritual']
 */
function parseCastingTimeToArray(castingTimeRaw) {
  // Implementation
}
```

### Utility Script (Simple)

```javascript
/**
 * Translation File Merger
 *
 * @fileoverview Merges namespaced translation files into single index.json per locale.
 *
 * @module mergeMessages
 * @version 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires glob File pattern matching
 *
 * @description
 * Consolidates separate namespace files (layout.json, search.json) into
 * a unified index.json for next-intl. Maintains namespace structure.
 *
 * @example
 * npx tsx --tsconfig tsconfig.scripts.json scripts/i18n/mergeMessages.ts
 * // Output: ✅ en: merged 4 files into index.json (namespaced)
 */
```

## Documentation Best Practices

1. **Be Specific**: Use concrete examples, not generic placeholders
2. **Show Input/Output**: Examples should demonstrate actual usage
3. **Explain Why**: Include rationale for design decisions
4. **Document Edge Cases**: Note special handling or limitations
5. **Link Related Code**: Reference related functions or modules
6. **Update Version**: Increment @version for breaking changes
7. **Keep Examples Working**: Test example code periodically
8. **Use Proper Types**: Match TypeScript types exactly
9. **Multi-line for Clarity**: Break long descriptions into readable paragraphs
10. **Consistency**: Follow this standard across all files

## Tools and Validation

### VSCode Integration

- Install "Document This" extension for JSDoc generation
- Enable `checkJs` in jsconfig.json for type checking
- Use TypeScript language server for inline docs

### Type Checking

```json
// jsconfig.json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": true
  }
}
```

### Documentation Generation

```bash
# Generate HTML documentation (if jsdoc is configured)
npm run generate-docs

# View generated docs
open docs/index.html
```

## References

- [JSDoc Official Documentation](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Google JavaScript Style Guide - JSDoc](https://google.github.io/styleguide/jsguide.html#jsdoc)

---

**Maintained by**: Typeir  
**Last Updated**: December 5, 2025  
**Version**: 1.0.0
