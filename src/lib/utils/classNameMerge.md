/\*\*

- classNameMerge - Lightweight className Utility
-
- A minimal, zero-dependency alternative to `clsx` for combining classnames.
-
- ## Features
-
- - ✅ String classes
- - ✅ Conditional strings (`bool && 'class'`)
- - ✅ Object conditions (`{ [styles.active]: isActive }`)
- - ✅ Arrays and nested structures
- - ✅ Filters falsy values automatically
- - ✅ Zero dependencies
- - ✅ Type-safe (TypeScript)
-
- ## Import
-
- ```tsx

  ```
- import { cn } from '@/lib/utils/classNameMerge';
- ```

  ```
-
- ## Usage Examples
-
- ### Basic strings
-
- ```tsx

  ```
- cn('btn', 'primary') // 'btn primary'
- ```

  ```
-
- ### Conditional strings
-
- ```tsx

  ```
- cn('btn', open && 'open') // 'btn open' or 'btn'
- ```

  ```
-
- ### Object conditions (perfect for CSS modules)
-
- ```tsx

  ```
- const styles = { active: '\_active_xyz' };
- cn('btn', { [styles.active]: isActive })
- // 'btn \_active_xyz' (if isActive is true)
- ```

  ```
-
- ### Mixed types
-
- ```tsx

  ```
- const styles = { open: '\_open_abc', icon: '\_icon_def' };
-
- cn(
- 'ml-2',
- styles.icon,
- { [styles.open]: isOpen },
- 'sidebar-item'
- )
- // 'ml-2 \_icon_def \_open_abc sidebar-item'
- ```

  ```
-
- ### Replace `.filter(Boolean).join(' ')` pattern
-
- **Before:**
- ```tsx

  ```
- className={['ml-2', styles.accordion, open ? styles.open : '']
- .filter(Boolean)
- .join(' ')}
- ```

  ```
-
- **After:**
- ```tsx

  ```
- className={cn('ml-2', styles.accordion, open && styles.open)}
- ```

  ```
-
- ## Supported Input Types
-
- | Type | Example | Behavior |
- |------|---------|----------|
- | String | `'className'` | Included as-is |
- | Falsy string | `''`, `false && 'cls'`, `null`, `undefined` | Filtered out |
- | Object | `{ [cls]: true }` | Keys included if value is truthy |
- | Array | `['cls1', 'cls2']` | Flattened and processed |
- | Nested | `['cls', { [cls]: true }]` | Recursively processed |
-
- ## Why not `clsx`?
-
- `clsx` is an external dependency. This project intentionally minimizes dependencies.
- The `cn` utility provides the most common `clsx` features without adding bulk.
-
- For the rare case needing more advanced features, you could:
- 1.  Add `clsx` as a dependency
- 2.  Extend this utility
- 3.  Keep using template literals for complex logic
-
- ## Performance
-
- - O(n) where n = number of arguments
- - No recursive depth overhead for typical usage
- - Minimal memory allocation
- - Suitable for rendering loops (classNames are re-computed on every render)
-
- ## Testing
-
- Comprehensive tests in `tests/unit/src/lib/utils/classNameMerge.test.ts`
-
- Run tests:
- ```bash

  ```
- npm run test -- classNameMerge
- ```
  */
  ```

// See: src/lib/utils/classNameMerge.ts
