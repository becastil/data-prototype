# Project Structure and Organization

This document proposes and explains the organization used for this repository. It follows Next.js App Router conventions and a feature-oriented grouping with clear separation of concerns.

## High-Level Layout

```
data-prototype/
├─ app/                        # Next.js App Router (routes + UI layer)
│  ├─ components/              # Feature/UI components (presentation)
│  │  ├─ ui/                   # Reusable UI primitives (button, card, tabs)
│  │  ├─ charts/               # Chart-related components (ECharts, MUI)
│  │  ├─ loaders/              # CSV and data-loader components (wrappers to existing files)
│  │  ├─ accessibility/        # A11y helpers (re-exports for clarity)
│  │  └─ data/                 # Data tables and export views (wrappers)
│  ├─ utils/                   # Client-side utilities (formatters, processors)
│  ├─ styles/                  # Vanilla Extract + CSS artifacts
│  ├─ constants/               # Theme-aware constants (chart colors)
│  ├─ hooks/                   # Reusable client hooks
│  ├─ page.tsx                 # Root dashboard page
│  └─ layout.tsx               # Root layout
├─ public/                     # Static assets
├─ docs/                       # Documentation, architecture, research
│  ├─ ideas/                   # Archived ideation
│  └─ research/                # Research artifacts
├─ next.config.ts              # Next.js configuration
├─ tsconfig.json               # Typescript configuration + path aliases
└─ README.md                   # Project overview
```

Notes:
- Route groups (e.g., `app/(shared)`) are avoided to keep path depth simple. If the app grows substantially, route groups can be introduced for large sections without affecting URLs.
- The components folder is sub-grouped by role. This preserves separation of concerns and discoverability.
- Shared utilities live under `app/utils` and are imported via path aliases (see `tsconfig.json`).

## Naming Conventions

- Components: PascalCase (e.g., `FinancialDataTable.tsx`)
- Hooks: `useSomething.ts`
- Utilities: `verbNoun.ts` or domain-specific (e.g., `chartDataProcessors.ts`)
- Styles: `.css.ts` for VE, and global/static styles in `app/globals.css`
- Tests (when added): `<name>.test.ts(x)` colocated with the subject or inside `tests/`

## Path Aliases

Defined in `tsconfig.json` for maintainability and future refactors:
- `@components/*` → `app/components/*`
- `@utils/*` → `app/utils/*`
- `@styles/*` → `app/styles/*`

Using these aliases lets us reorganize folders later without mass import churn.

## Non-Obvious Decisions

- Documentation is consolidated under `docs/` and removed from the project root to reduce noise. Research/ideation artifacts are preserved in `docs/research` and `docs/ideas`.
- We deliberately keep `app/` at the repository root to avoid a disruptive move to `src/`. This makes the restructure non-breaking and compatible with existing Next.js configuration.


### Wrapper-based Restructure (Non-breaking)

To avoid breaking imports while clarifying structure, we introduced thin wrapper files under `app/components/{loaders,data,accessibility}` that re-export existing components. This enables developers to adopt conventional paths like `@components/data/FinancialDataTable` incrementally, without relocating original implementations in a single PR.

Examples:
- `@components/loaders/CSVLoader` → re-exports `app/components/CSVLoader`
- `@components/data/EnterpriseDataExport` → re-exports `app/components/EnterpriseDataExport`
- `@components/accessibility/AccessibilityEnhancements` → re-exports named helpers

When convenient, the underlying implementations can be moved into these folders with no external churn, since imports already point to the wrapper locations.
