# Library of Ikuisuus

[![CI Pipeline](https://github.com/Typeir/Ikuisuus/actions/workflows/ci.yml/badge.svg)](https://github.com/Typeir/Ikuisuus/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Typeir/Ikuisuus/graph/badge.svg?token=7Y5PMU9AK8)](https://codecov.io/gh/Typeir/Ikuisuus)

A Next.js 15 internationalized documentation site for D&D content, featuring MDX-based content management and a custom theme system.

---

## 📦 Features

- **Dark / Light Themes** with persistent storage
- **Multi-language Support** (currently only hosts content in English)
- **MDX Content System** with dynamic routing and metadata extraction
- **Filterable Tables** for monsters and items with search and sorting
- **Responsive Sidebar Navigation** generated from content structure
- **Print Optimization** with two-column layout
- **Static Site Generation** for fast page loads
- **Comprehensive Testing** with 1118 tests across 112 files (70%+ coverage)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ with npm 9+
- **Git LFS** (for images and binary files)
  ```bash
  # Install Git LFS
  git lfs install
  ```
- **PostgreSQL** 14+ (optional, for database seeding)

### Installation

1. **Clone the repository** (with submodules for content):
   ```bash
   git clone --recurse-submodules https://github.com/Typeir/Ikuisuus.git
   cd Ikuisuus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   This automatically:
   - Runs `npm run prepare` to install husky git hooks
   - Generates Prisma clients for SQL and MongoDB

3. **Install git hooks** (multirepo coordination):
   ```bash
   npm run multirepo:setup
   ```
   Installs warning hooks in the content submodule to keep repos in sync.

### First-Time Build

Before running dev server, prepare the build pipeline:

```bash
npm run pre-init
```

This runs the complete build pipeline:
1. **Prisma generate** — compile database clients
2. **Compress assets** — optimize images to WebP
3. **Kebabify content** — normalize filenames to kebab-case
4. **MD to MDX** — convert Markdown to MDX format
5. **Generate metadata** — extract metadata from content files
6. **Merge locales** — combine translation files
7. **Find outliers** — validate MDX reusability

### Development Server

```bash
npm run dev
```

Opens [http://localhost:3000](http://localhost:3000) in your browser.

- Automatically runs `pre-init` before starting
- Hot reloading on file changes
- Press Ctrl+C to stop

### Available Scripts

#### Development
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with auto-recompile |
| `npm run build` | Build for production (runs tests + pre-init) |
| `npm run start` | Run production server |

#### Content & Metadata
| Command | Purpose |
|---------|---------|
| `npm run kebabify-content` | Normalize content filenames |
| `npm run md-to-mdx` | Convert `.md` → `.mdx` |
| `npm run generate-metadata` | Extract metadata from content |
| `npm run merge-locales` | Combine translation files |
| `npm run compress-assets` | Optimize images |

#### Testing
| Command | Purpose |
|---------|---------|
| `npm run test` | Run all tests (unit + integration) |
| `npm run test:watch` | Watch mode with UI |
| `npm run test:coverage` | Coverage report |
| `npm run test:unit` | Unit tests only |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:hooks` | Validate git hook setup |

#### Database (PostgreSQL)
| Command | Purpose |
|---------|---------|
| `npm run db:init` | Create schema + indexes |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:seed` | Load content from filesystem |

#### Utilities
| Command | Purpose |
|---------|---------|
| `npm run linkify:world:dry` | Preview auto-linking in world content |
| `npm run linkify:world` | Apply auto-linking with backup |
| `npm run scaffold:world:dry` | Preview missing content scaffolding |
| `npm run scaffold:world` | Create placeholder files for broken links |

#### Multirepo (Content Submodule)
| Command | Purpose |
|---------|---------|
| `npm run multirepo:setup` | Install hooks in content repo |
| `npm run multirepo:help` | Show `ik` command help |
| `bash scripts/multirepo/ik.sh commit -m "msg"` | Commit both repos together |
| `bash scripts/multirepo/ik.sh status` | See both repos' status |

---

## 📋 Common Workflows

### Editing Content

Content is stored in `src/content/` as MDX files organized by category:

```
src/content/en/
├── library/        # Monsters, items, spells
├── world/          # Setting information
└── lore/           # Background and history
```

After editing content:

```bash
# Re-extract metadata and rebuild
npm run pre-init
npm run dev
```

### Working with Multirepo

Content lives in a **git submodule** at `src/content/`. Changes in both repos should be committed together:

```bash
# One-liner to commit both main + content repos
bash scripts/multirepo/ik.sh commit -m "[feat]: your message"

# Or manually
git add <main-repo-changes>
git commit -m "[feat]: your changes"
cd src/content && git add <content-changes>
git commit -m "[feat]: your changes"
cd ../..
git add src/content  # update submodule pointer
git commit -m "[feat]: sync content"
```

### Running Tests

```bash
# Full suite (unit + integration + E2E)
npm run test:all

# Watch mode for development
npm run test:watch --ui

# Coverage report
npm run test:coverage
```

### Database Setup (Optional)

If developing database features:

```bash
# 1. Set DATABASE_URL in .env.local
echo "DATABASE_URL=postgresql://user:password@localhost/ikuisuus" >> .env.local

# 2. Initialize database
npm run db:init

# 3. Apply migrations
npm run db:migrate

# 4. Seed from content files
npm run db:seed
```

---

## 🔧 Git Hooks

Hooks are managed by **husky** and automatically installed after `npm install`.

### Hook Chain

**Pre-commit** (runs during `git commit`):
1. Security scan for sensitive patterns
2. Multirepo sync warning (if content repo has changes)

**Commit-msg** (validates commit message format):
- Required format: `[action]: description`
- Examples: `[fix]: resolve login bug`, `[feat]: add tables`

**Post-commit** (runs after successful commit):
- Warns if content repo changes weren't committed

Verify hooks are working:

```bash
npm run test:hooks
```

---

## 📚 Architecture & Documentation

- **Complete guides**: See [`.github/docs/`](.github/docs/) for architecture documentation
- **Build pipeline**: [docs/build-pipeline.md](.github/docs/build-pipeline.md)
- **Content system**: [docs/content-system.md](.github/docs/content-system.md)
- **Theme system**: [docs/theme-system.md](.github/docs/theme-system.md)

---

## 🐛 Troubleshooting

### Git LFS issues
```bash
# Reinitialize LFS
git lfs install
git lfs fetch
git lfs checkout
```

### Hooks not running
```bash
# Reinstall hooks
npm install
npm run multirepo:setup

# Verify setup
npm run test:hooks
```

### Prisma client generation fails
```bash
# Regenerate for both schemas
npm run prisma:generate
```

### Build pipeline missing step
```bash
# Rerun complete pipeline
npm run pre-init
```

---

## 📄 License

[Your license here]
