# Fullstack Monorepo

A full-stack TypeScript monorepo powered by [Turborepo](https://turborepo.dev) and [Bun](https://bun.sh).

## Stack

| Layer               | Tech                                |
| ------------------- | ----------------------------------- |
| Package manager     | Bun 1.3.9                           |
| Build orchestration | Turborepo 2                         |
| Frontend            | Next.js 16 + React 19 + Tailwind v4 |
| Backend             | Fastify 5 + Zod                     |
| Database            | PostgreSQL + Drizzle ORM            |
| Storage             | Cloudflare R2 (S3-compatible)       |
| Auth                | Firebase Admin                      |
| Language            | TypeScript (strict) everywhere      |

---

## Repository Layout

```text
repo/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── crud/         # Fastify REST API
└── packages/
    ├── db/           # @repo/db  — Drizzle schemas + DB client
    ├── ui/           # @repo/ui  — Shared React component library
    ├── utils/        # @repo/utils — clsx / tailwind-merge helpers
    ├── eslint-config/        # @repo/eslint-config
    └── typescript-config/    # @repo/typescript-config
```

### Apps

**`apps/web`** — Next.js 16 app with React 19 and Tailwind v4. Consumes `@repo/ui` for shared components.

**`apps/crud`** — Fastify 5 REST API. Handles business logic, interacts with `@repo/db`, Firebase Admin for auth, and Cloudflare R2 for file storage.

### Packages

**`@repo/db`** — Single source of truth for database access. Exports the Drizzle client and all schemas. Import as:

```ts
import { db } from "@repo/db";
import { users } from "@repo/db/schema";
```

**`@repo/ui`** — Component library built on Radix UI primitives, CVA, and Lucide icons. Exports per file:

```ts
import { Button } from "@repo/ui/button";
```

**`@repo/utils`** — Tiny utilities. Exports `cn()` (clsx + tailwind-merge):

```ts
import { cn } from "@repo/utils";
```

**`@repo/eslint-config`** — Three ESLint presets: `base`, `next-js`, `react-internal`.

**`@repo/typescript-config`** — Three `tsconfig` bases: `base.json`, `nextjs.json`, `react-library.json`.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.9
- Node >= 18 (for tooling compatibility)
- A running PostgreSQL instance

### 1. Install dependencies

```sh
bun install
```

### 2. Set up environment variables

```sh
cp .env.example .env
```

Edit `.env` and fill in your values. **All apps read from this single root file** — no per-app `.env` needed.

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/mydb

# API server
CRUD_PORT=8000

# Next.js
WEB_PORT=3000
```

### 3. Push the database schema

```sh
bun db:push
```

### 4. Start development

```sh
bun dev
```

This runs all apps in parallel via Turborepo. To run a single app:

```sh
bun dev --filter=web
bun dev --filter=crud
```

---

## Common Commands

All commands run from the **repo root**.

| Command           | What it does                                                 |
| ----------------- | ------------------------------------------------------------ |
| `bun dev`         | Start all apps in dev/watch mode                             |
| `bun build`       | Build all apps (respects dependency order)                   |
| `bun lint`        | ESLint across all packages                                   |
| `bun format`      | Prettier across all packages                                 |
| `bun typecheck`   | `tsc --noEmit` across all packages                           |
| `bun clean`       | Remove `node_modules`, `.next`, `dist`, `.turbo`, `bun.lock` |
| `bun db:push`     | Push schema changes directly to the DB (dev)                 |
| `bun db:generate` | Generate Drizzle migration files                             |
| `bun db:migrate`  | Apply pending migrations                                     |

To scope any Turbo command to a specific app or package, use `--filter`:

```sh
bun build --filter=crud
bun lint --filter=@repo/ui
```

---

## Database Workflow

Schema files live in `packages/db/src/schema/`. The Drizzle client is configured in `packages/db/src/services/drizzle.ts`.

**Development (schema push — no migration files):**

```sh
bun db:push
```

**Production (migration files tracked in git):**

```sh
bun db:generate   # generates SQL files in packages/db/drizzle/
bun db:migrate    # applies them
```

**Drizzle Studio (visual DB browser):**

```sh
cd packages/db && bun db:studio
```

---

## Adding Dependencies

Bun workspaces mean you install from the root and scope to the right workspace with `--filter`.

**Add a dependency to a specific app or package:**

```sh
bun add <package> --filter=web
bun add <package> --filter=crud
bun add <package> --filter=@repo/ui
```

**Add a dev dependency:**

```sh
bun add -d <package> --filter=web
```

**Add a dependency shared across the whole repo (e.g. a dev tool):**

```sh
bun add -d <package> -w
```

The `-w` flag installs to the root `package.json`. Use this only for repo-wide tooling (Prettier, Turbo, Husky). Application and library dependencies always go in their own workspace.

**Never run `bun add` inside a subdirectory.** Always run from the repo root with `--filter` — this keeps `bun.lock` consolidated at the root.

---

## Adding a New Package

1. Create `packages/<name>/` with a `package.json` using `"name": "@repo/<name>"`.
2. Extend one of the shared TypeScript configs:

   ```json
   { "extends": "@repo/typescript-config/base.json" }
   ```

3. Add `"@repo/<name>": "*"` to the consuming app's dependencies.
4. Run `bun install` from the root — workspaces will link it automatically.

---

## Adding a New UI Component

From the root:

```sh
cd packages/ui && bun generate:component
```

This runs the Turborepo generator. The component is then importable from `@repo/ui/<component-name>`.

---

## Adding shadcn/ui Components

shadcn is configured in `packages/ui/components.json` with the **new-york** style, **zinc** base color, and CSS variables enabled. Components are added into `packages/ui/src/` and consumed by apps via `@repo/ui`.

Run the shadcn CLI from the **repo root** using `--cwd` to point it at `packages/ui`:

```sh
bunx shadcn@latest add <component> --cwd packages/ui
```

Examples:

```sh
bunx shadcn@latest add dialog --cwd packages/ui
bunx shadcn@latest add table --cwd packages/ui
bunx shadcn@latest add form --cwd packages/ui
```

The `--cwd` flag tells shadcn to read `packages/ui/components.json` and write output there — no need to `cd` into the package. The CLI writes the component to `packages/ui/src/<component>.tsx` and installs any required Radix UI primitives into `packages/ui`.

No manual alias setup needed — `components.json` already maps:

| shadcn alias        | Resolves to          |
| ------------------- | -------------------- |
| `components` / `ui` | `@repo/ui/src`       |
| `utils` / `lib`     | `@repo/utils`        |
| `hooks`             | `@repo/ui/src/hooks` |

**Consuming the component in an app:**

```ts
import { Dialog } from "@repo/ui/dialog";
```

Since `@repo/ui` exports via `"./*": "./src/*.tsx"`, any file in `packages/ui/src/` is automatically available to apps — no re-export step required.

---

## Code Quality

**Prettier** is the formatter. Config lives in `.prettierrc`:

- Double quotes, semi-colons, 2-space indent, trailing commas (ES5), 80-char print width.

**ESLint** enforces lint rules per app type:

- `web` uses `@repo/eslint-config/next-js`
- `crud` uses `@repo/eslint-config/base`
- `@repo/ui` uses `@repo/eslint-config/react-internal`

**Husky + lint-staged** run on every commit:

- `pre-commit`: runs Prettier (`--write`) on all staged `ts, tsx, js, jsx, json, md, css` files.

No `--no-verify` bypasses — fix lint/format issues before committing.

---

## Environment Variable Convention

- One root `.env` file, loaded explicitly with `bun --env-file ../../.env <script>`.
- Variables intended for the browser **must** be prefixed with `NEXT_PUBLIC_`.
- Never commit `.env` — only `.env.example` is tracked.

---

## Turborepo Task Pipeline

Defined in `turbo.json`:

| Task          | Depends on                          | Cached          |
| ------------- | ----------------------------------- | --------------- |
| `build`       | `^build` (dependencies build first) | Yes             |
| `lint`        | `^lint`                             | Yes             |
| `check-types` | `^check-types`                      | Yes             |
| `dev`         | —                                   | No (persistent) |

Build outputs cached: `.next/**` (excluding `.next/cache`).

---

## Useful Links

- [Turborepo docs](https://turborepo.dev/docs)
- [Drizzle ORM docs](https://orm.drizzle.team)
- [Fastify docs](https://fastify.dev)
- [Next.js docs](https://nextjs.org/docs)
- [Bun docs](https://bun.sh/docs)

# Rags
# Rags
