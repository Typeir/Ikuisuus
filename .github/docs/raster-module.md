# Raster Module

**Purpose**: One entry point to `sharp` for every image conversion in the repo.

`src/lib/raster/` is the only place that imports `sharp`. ESLint bans the bare import everywhere else under `src/`, `scripts/` and `foundry/`, and all three trees reach the lib through the `@/lib/raster` alias.

## Consumers

| Site                                    | Uses                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| `scripts/assets/compressAssets.ts`      | `readDimensions`, `fitWidth`, `gaussianBlur`, `toWebp`, `writeBytes` |
| `src/lib/seo/og/renderer.ts`            | `toPng` (compact)                                           |
| `src/lib/seo/og/pngConverter.ts`        | `toPngDataUri`                                              |
| `foundry/scripts/utils/tokenGenerator.ts` | `coverSquare`, `solidLayer`, `circleMask`, `overlay`, `mask`, `composite`, `toPng`, `toWebp`, `writeBytes` |

## API

### `pipeline.ts`

| Export                                  | Does                                                              |
| --------------------------------------- | ----------------------------------------------------------------- |
| `open(input)`                           | Path, `Buffer` or `Sharp` → `Sharp`. A pipeline passes through.  |
| `readDimensions(input)`                 | `{ width, height }`. Throws when the header has none.            |
| `fitWidth(input, maxWidth)`             | Caps width, never enlarges, keeps ratio.                          |
| `coverSquare(input, size, bias = 0.5)`  | Largest square, placed by `bias` from top (0) to bottom (1), scaled to `size`. |
| `gaussianBlur(input, sigma)`            | Blur in px.                                                       |

### `encode.ts`

| Export                        | Does                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `DEFAULT_WEBP_QUALITY`        | `80`.                                                     |
| `toWebp(input, quality)`      | `{ data, width, height, size }`.                          |
| `toPng(input, compact)`       | `Buffer`. `compact` adds palette quantisation and level 9. |
| `toPngDataUri(input)`         | `data:image/png;base64,…`.                                |
| `writeBytes(path, data)`      | `mkdir -p` then write.                                    |

### `layers.ts`

| Export                            | Does                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `solidLayer(w, h, colour)`        | SVG rect bytes.                                        |
| `circleMask(size, fraction = 1)`  | SVG white disc bytes, radius `fraction` of half `size`. |
| `overlay(bytes)`                  | Layer with blend `over`.                               |
| `mask(bytes)`                     | Layer with blend `dest-in`.                            |
| `composite(base, layers)`         | One composite pass.                                    |

## Rules

- `sharp` allows one `composite()` per pipeline. Encode with `toPng` between passes, as the token generator does.
- Colours are the caller's. The lib takes fill strings and owns no palette.
- Transforms return a lazy `Sharp`. Nothing runs until an encoder is awaited.
- Tests run real `sharp` on generated 2 to 16 px images under `tests/unit/src/lib/raster/`, project `unit:other`.
